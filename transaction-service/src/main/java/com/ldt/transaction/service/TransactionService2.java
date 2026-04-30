package com.ldt.transaction.service;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.payment.PaymentRequest;
import com.ldt.transaction.dto.transfer.WalletTransferRequest;
import com.ldt.transaction.dto.user.InternalVerifyPinRequest;
import com.ldt.transaction.dto.user.UserInternalResponse;
import com.ldt.transaction.event.TransactionNotificationEvent;
import com.ldt.transaction.exception.AppException;
import com.ldt.transaction.exception.ErrorCode;
import com.ldt.transaction.mapper.TransactionMapper;
import com.ldt.transaction.model.Transaction;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.producer.TransactionEventProducer;
import com.ldt.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service xử lý transfer + merchant payment, tối ưu connection pool bằng cách
 * tách HTTP call ra ngoài DB transaction và gộp logic chung của 2 luồng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService2 {

    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;
    private final TransactionMapper transactionMapper;
    private final TransactionEventProducer notificationProducer;
    private final TransactionStatusHistoryService statusHistoryService;
    private final TransactionTemplate transactionTemplate;

    @Value("${service.wallet-service.url}")
    private String walletServiceUrl;

    @Value("${user-service.url}")
    private String userServiceUrl;

    /**
     * Xử lý chuyển tiền cho 3 endpoint /transfer, /payment, /topup.
     * Validate self-transfer rồi delegate xuống engine chính.
     */
    public TransactionResponse transfer(TransferRequest request, String fromPhone, TransactionType type) {
        if (fromPhone.equals(request.getToPhoneNumber())) {
            throw new AppException(ErrorCode.SELF_TRANSFER);
        }
        String successMsg = type == TransactionType.PAYMENT
                ? "Thanh toán thành công"
                : (type == TransactionType.TOPUP ? "Nạp tiền thành công" : "Chuyển tiền thành công");

        return executeTransaction(new TransactionContext(
                request.getRequestId(),
                request.getPin(),
                fromPhone,
                request.getToPhoneNumber(),
                request.getAmount(),
                request.getDescription(),
                type,
                null,
                walletReasonOf(type),
                successMsg));
    }

    /**
     * Xử lý thanh toán cho merchant: tự sinh description nếu thiếu,
     * lưu kèm merchantId rồi delegate xuống engine chính.
     */
    public TransactionResponse merchantPayment(PaymentRequest request, String fromPhone) {
        if (fromPhone.equals(request.getMerchantPhone())) {
            throw new AppException(ErrorCode.SELF_TRANSFER);
        }
        String description = (request.getDescription() != null && !request.getDescription().isBlank())
                ? request.getDescription()
                : "Thanh toán " + request.getMerchantName();

        return executeTransaction(new TransactionContext(
                request.getRequestId(),
                request.getPin(),
                fromPhone,
                request.getMerchantPhone(),
                request.getAmount(),
                description,
                TransactionType.PAYMENT,
                request.getMerchantId(),
                "PAYMENT",
                "Thanh toán merchant thành công"));
    }

    /**
     * Engine chạy 4 pha: pre-check (idempotency, PIN, user, LOCKED) → lưu PENDING
     * → gọi wallet-service (ngoài transaction) → finalize SUCCESS/FAILED.
     * Dù wallet fail vẫn commit FAILED rồi mới throw để trạng thái được persist.
     */
    private TransactionResponse executeTransaction(TransactionContext ctx) {
        Optional<Transaction> existingOpt = transactionRepository.findByRequestId(ctx.requestId());
        if (existingOpt.isPresent()) {
            Transaction existing = existingOpt.get();
            if (existing.getStatus() == TransactionStatus.SUCCESS
                    || existing.getStatus() == TransactionStatus.FAILED) {
                return transactionMapper.toTransactionResponse(existing);
            }
            throw new AppException(ErrorCode.DUPLICATE_TRANSACTION);
        }

        verifyPin(ctx.fromPhone(), ctx.pin());

        UserPair users = fetchUserPair(ctx.fromPhone(), ctx.toPhone());

        if ("LOCKED".equals(users.from().getStatus())) {
            throw new AppException(ErrorCode.SENDER_LOCKED);
        }
        if ("LOCKED".equals(users.to().getStatus())) {
            throw new AppException(ErrorCode.RECIPIENT_LOCKED);
        }

        Optional<Transaction> pendingOpt = savePendingTransaction(ctx, users);
        if (pendingOpt.isEmpty()) {
            return handleRaceCondition(ctx.requestId());
        }
        Transaction pendingTx = pendingOpt.get();

        WalletCallResult walletResult = callWalletTransfer(ctx, users, pendingTx.getTransactionId());

        Transaction finalTx = finalizeTransaction(pendingTx, walletResult, users, ctx.successMessage());

        if (!walletResult.success()) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, walletResult.errorMessage());
        }
        return transactionMapper.toTransactionResponse(finalTx);
    }

    /**
     * Gọi user-service xác thực PIN giao dịch.
     * Mọi lỗi (4xx, network, timeout) đều ánh xạ về PIN_VERIFICATION_FAILED.
     */
    private void verifyPin(String phone, String pin) {
        try {
            restTemplate.postForEntity(
                    userServiceUrl + "/internal/users/verify-pin",
                    new InternalVerifyPinRequest(phone, pin),
                    Void.class);
        } catch (HttpClientErrorException e) {
            throw new AppException(ErrorCode.PIN_VERIFICATION_FAILED, e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new AppException(ErrorCode.PIN_VERIFICATION_FAILED,
                    "Không thể xác thực PIN: " + e.getMessage());
        }
    }

    /**
     * Lấy thông tin cả 2 user (sender + receiver/merchant) qua endpoint batch
     * trong 1 round-trip duy nhất, match theo phone rồi trả về dạng UserPair.
     */
    private UserPair fetchUserPair(String fromPhone, String toPhone) {
        ResponseEntity<List<UserInternalResponse>> response;
        try {
            response = restTemplate.exchange(
                    userServiceUrl + "/internal/users/batch",
                    HttpMethod.POST,
                    new HttpEntity<>(List.of(fromPhone, toPhone)),
                    new ParameterizedTypeReference<>() {
                    });
        } catch (Exception e) {
            throw new AppException(ErrorCode.TRANSFER_FAILED,
                    "Không thể lấy thông tin người dùng: " + e.getMessage());
        }
        List<UserInternalResponse> body = response.getBody();
        if (body == null || body.size() < 2) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, "Không tìm thấy thông tin người dùng");
        }
        Map<String, UserInternalResponse> userMap = body.stream()
                .collect(Collectors.toMap(UserInternalResponse::getPhone, Function.identity(), (a, b) -> a));
        UserInternalResponse fromUser = userMap.get(fromPhone);
        UserInternalResponse toUser = userMap.get(toPhone);
        if (fromUser == null || toUser == null) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, "Không tìm thấy thông tin người dùng");
        }
        return new UserPair(fromUser, toUser);
    }

    /**
     * Insert Transaction trạng thái PENDING trong 1 small transaction, dùng
     * saveAndFlush để bắt được DataIntegrityViolation race condition ngay tại flush.
     * Trả về Optional.empty() khi gặp race (2 request cùng requestId).
     */
    private Optional<Transaction> savePendingTransaction(TransactionContext ctx, UserPair users) {
        return transactionTemplate.execute(status -> {
            Transaction tx = new Transaction();
            tx.setRequestId(ctx.requestId());
            tx.setFromUserId(users.from().getUserId());
            tx.setFromPhone(users.from().getPhone());
            tx.setFromFullName(users.from().getFullName());
            tx.setToUserId(users.to().getUserId());
            tx.setToPhone(users.to().getPhone());
            tx.setToFullName(users.to().getFullName());
            tx.setAmount(ctx.amount());
            tx.setDescription(ctx.description());
            tx.setTransactionType(ctx.transactionType());
            tx.setMerchantId(ctx.merchantId());
            tx.setStatus(TransactionStatus.PENDING);
            try {
                Transaction saved = transactionRepository.saveAndFlush(tx);
                statusHistoryService.record(saved.getTransactionId(), null,
                        TransactionStatus.PENDING, "Giao dịch được khởi tạo");
                return Optional.of(saved);
            } catch (DataIntegrityViolationException e) {
                status.setRollbackOnly();
                return Optional.<Transaction>empty();
            }
        });
    }

    /**
     * Xử lý khi 2 request cùng requestId chạy đua: tìm transaction của bên thắng,
     * trả về kết quả cuối nếu đã SUCCESS/FAILED, không thì throw DUPLICATE.
     */
    private TransactionResponse handleRaceCondition(String requestId) {
        Transaction existing = transactionRepository.findByRequestId(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.DUPLICATE_TRANSACTION));
        if (existing.getStatus() == TransactionStatus.SUCCESS
                || existing.getStatus() == TransactionStatus.FAILED) {
            return transactionMapper.toTransactionResponse(existing);
        }
        throw new AppException(ErrorCode.DUPLICATE_TRANSACTION);
    }

    /**
     * Gọi wallet-service trừ/cộng tiền, chạy ngoài DB transaction.
     * Bọc try/catch để Phase 4 còn cập nhật được status, không throw thẳng lên caller.
     */
    private WalletCallResult callWalletTransfer(TransactionContext ctx, UserPair users, UUID transactionId) {
        WalletTransferRequest req = new WalletTransferRequest();
        req.setFromUserId(users.from().getUserId());
        req.setToUserId(users.to().getUserId());
        req.setAmount(ctx.amount());
        req.setTransactionId(transactionId);
        req.setReason(ctx.walletReason());
        req.setNote(ctx.description());
        try {
            restTemplate.postForEntity(walletServiceUrl + "/internal/wallets/transfer", req, Void.class);
            return WalletCallResult.ok();
        } catch (HttpClientErrorException ex) {
            log.warn("Wallet transfer rejected for tx {}: {}", transactionId, ex.getResponseBodyAsString());
            return WalletCallResult.fail(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("Wallet transfer error for tx {}: {}", transactionId, ex.getMessage(), ex);
            return WalletCallResult.fail("Lỗi hệ thống: " + ex.getMessage());
        }
    }

    /**
     * Cập nhật status SUCCESS/FAILED + ghi status history trong 1 small transaction.
     * Đăng ký gửi notification ở afterCommit chỉ khi giao dịch thành công.
     */
    private Transaction finalizeTransaction(
            Transaction pendingTx, WalletCallResult walletResult, UserPair users, String successMessage) {
        return transactionTemplate.execute(status -> {
            TransactionStatus newStatus = walletResult.success()
                    ? TransactionStatus.SUCCESS
                    : TransactionStatus.FAILED;
            String reason = walletResult.success() ? successMessage : walletResult.errorMessage();

            pendingTx.setStatus(newStatus);
            Transaction saved = transactionRepository.save(pendingTx);

            statusHistoryService.record(saved.getTransactionId(),
                    TransactionStatus.PENDING, newStatus, reason);

            if (walletResult.success()) {
                final TransactionNotificationEvent event = TransactionNotificationEvent.builder()
                        .transactionId(saved.getTransactionId())
                        .fromUserId(saved.getFromUserId())
                        .fromFullName(saved.getFromFullName())
                        .fromPhone(saved.getFromPhone())
                        .fromEmail(users.from().getEmail())
                        .toUserId(saved.getToUserId())
                        .toFullName(saved.getToFullName())
                        .toPhone(saved.getToPhone())
                        .toEmail(users.to().getEmail())
                        .amount(saved.getAmount())
                        .description(saved.getDescription())
                        .transactionType(saved.getTransactionType().name())
                        .status(saved.getStatus().name())
                        .transactionTime(saved.getCreatedAt())
                        .build();

                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            notificationProducer.sendNotification(event);
                        } catch (Exception e) {
                            log.warn("Send notification failed for tx {}: {}",
                                    saved.getTransactionId(), e.getMessage());
                        }
                    }
                });
            }
            return saved;
        });
    }

    /**
     * Map TransactionType sang string reason mà wallet-service yêu cầu
     * theo enum LedgerReason bên wallet-service.
     */
    private static String walletReasonOf(TransactionType type) {
        return switch (type) {
            case TOPUP -> "TOP_UP";
            case PAYMENT -> "PAYMENT";
            default -> "TRANSFER_OUT";
        };
    }

    private record TransactionContext(
            String requestId,
            String pin,
            String fromPhone,
            String toPhone,
            BigDecimal amount,
            String description,
            TransactionType transactionType,
            UUID merchantId,
            String walletReason,
            String successMessage) {
    }

    private record UserPair(UserInternalResponse from, UserInternalResponse to) {
    }

    private record WalletCallResult(boolean success, String errorMessage) {
        static WalletCallResult ok() {
            return new WalletCallResult(true, null);
        }

        static WalletCallResult fail(String msg) {
            return new WalletCallResult(false, msg);
        }
    }
}
