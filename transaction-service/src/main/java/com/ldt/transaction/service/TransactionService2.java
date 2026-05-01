package com.ldt.transaction.service;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.payment.PaymentRequest;
import com.ldt.transaction.dto.transfer.WalletTransferRequest;
import com.ldt.transaction.dto.transfer.WalletTransferWithFeeRequest;
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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;


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

    @Value("${platform.fee-rate:0.10}")
    private BigDecimal feeRate;

    /**
     * Snapshot toàn bộ input của 1 giao dịch để engine xử lý đồng nhất.
     */
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
            String successMessage,
            boolean applyPlatformFee) {
    }

    /**
     * Gom info sender + receiver thành 1 đơn vị trả về từ batch call.
     */
    private record UserPair(UserInternalResponse from, UserInternalResponse to) {
    }

    /**
     * Kết quả gọi wallet-service: success + error message (nếu fail).
     */
    private record WalletCallResult(boolean success, String errorMessage) {
        static WalletCallResult ok() {
            return new WalletCallResult(true, null);
        }

        static WalletCallResult fail(String msg) {
            return new WalletCallResult(false, msg);
        }
    }

    /**
     * Map TransactionType → reason string khớp với LedgerReason ở wallet-service.
     */
    // private static String walletReasonOf(TransactionType type) {
    //     return switch (type) {
    //         TODO: 2 case dưới chỉ dùng khi /payment, /topup endpoint
    //         case TOPUP -> "TOP_UP";
    //         case PAYMENT -> "PAYMENT";
    //         default -> "TRANSFER_OUT";
    //     };
    // }

    /**
     * Entry cho /transfer, /payment, /topup — không tính fee, delegate xuống engine.
     */
    public TransactionResponse transfer(TransferRequest request, String fromPhone, TransactionType type) {
        if (fromPhone.equals(request.getToPhoneNumber())) {
            throw new AppException(ErrorCode.SELF_TRANSFER);
        }
        // TODO: nhánh PAYMENT/TOPUP chỉ áp dụng khi /payment, /topup endpoint
        // String successMsg = type == TransactionType.PAYMENT
        //         ? "Thanh toán thành công"
        //         : (type == TransactionType.TOPUP ? "Nạp tiền thành công" : "Chuyển tiền thành công");
        String successMsg = "Chuyển tiền thành công";

        return executeTransaction(new TransactionContext(
                request.getRequestId(),
                request.getPin(),
                fromPhone,
                request.getToPhoneNumber(),
                request.getAmount(),
                request.getDescription(),
                type,
                null,
                "TRANSFER_OUT",
                successMsg,
                false));
    }

    /**
     * Entry cho /merchant/payment — bật cờ applyPlatformFee để engine tách phí cho admin.
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
                "Thanh toán merchant thành công",
                true));
    }

    /**
     * Engine 4 pha: pre-check → lưu PENDING → gọi wallet → finalize SUCCESS/FAILED.
     * Wallet fail vẫn commit FAILED rồi mới throw để status được persist.
     */
    private TransactionResponse executeTransaction(TransactionContext ctx) {
        // 1. Idempotency check
        Optional<Transaction> existingOpt = transactionRepository.findByRequestId(ctx.requestId());
        if (existingOpt.isPresent()) {
            Transaction existing = existingOpt.get();
            if (existing.getStatus() == TransactionStatus.SUCCESS
                    || existing.getStatus() == TransactionStatus.FAILED) {
                return transactionMapper.toTransactionResponse(existing);
            }
            throw new AppException(ErrorCode.DUPLICATE_TRANSACTION);
        }
        // 2. Verify PIN 
        verifyPin(ctx.fromPhone(), ctx.pin());
        // 3. Fetch user info + check LOCKED status
        UserPair users = fetchUserPair(ctx.fromPhone(), ctx.toPhone());
        if ("LOCKED".equals(users.from().getStatus())) {
            throw new AppException(ErrorCode.SENDER_LOCKED);
        }
        if ("LOCKED".equals(users.to().getStatus())) {
            throw new AppException(ErrorCode.RECIPIENT_LOCKED);
        }
        // 4. Nếu là merchant payment có áp dụng fee platform, ctx.applyPlatformFee() = true -> fetch admin.
        UserInternalResponse admin = ctx.applyPlatformFee() ? fetchFirstAdmin() : null;
        boolean adminIsCustomer = admin != null
                && admin.getUserId().equals(users.from().getUserId());
        // 5. Tính toán txAmount gửi wallet-service, tách riêng fee để lưu vào Transaction.fee.
        BigDecimal txAmount;
        BigDecimal fee;
        if (ctx.applyPlatformFee() && !adminIsCustomer) {
            fee = ctx.amount().multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
            txAmount = ctx.amount();
        } else if (ctx.applyPlatformFee() && adminIsCustomer) {
            BigDecimal waivedFee = ctx.amount().multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
            txAmount = ctx.amount().subtract(waivedFee);
            fee = BigDecimal.ZERO;
        } else {
            fee = BigDecimal.ZERO;
            txAmount = ctx.amount();
        }
        // 6. Lưu transaction với status PENDING, dùng saveAndFlush để bắt race condition cùng requestId ngay tại flush
        Optional<Transaction> pendingOpt = savePendingTransaction(ctx, users, txAmount, fee);
        if (pendingOpt.isEmpty()) {
            return handleRaceCondition(ctx.requestId());
        }
        Transaction pendingTx = pendingOpt.get();
        // 7. Gọi wallet-service để trừ/cộng tiền, nhận kết quả mà không throw exception để còn finalize transaction.
        WalletCallResult walletResult = (ctx.applyPlatformFee() && !adminIsCustomer)
                ? callWalletTransferWithFee(ctx, users, admin, pendingTx.getTransactionId(), txAmount, fee)
                : callWalletTransfer(ctx, users, pendingTx.getTransactionId(), txAmount);

        Transaction finalTx = finalizeTransaction(pendingTx, walletResult, users, ctx.successMessage());

        if (!walletResult.success()) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, walletResult.errorMessage());
        }
        return transactionMapper.toTransactionResponse(finalTx);
    }

    /**
     * Verify PIN qua user-service; mọi lỗi map về PIN_VERIFICATION_FAILED.
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
     * Lấy info sender + receiver trong 1 batch call, match theo phone.
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
     * Insert Transaction PENDING; saveAndFlush để bắt race condition cùng requestId tại flush.
     * Trả Optional.empty() khi 2 request cùng requestId chạy đua.
     */
    private Optional<Transaction> savePendingTransaction(TransactionContext ctx, UserPair users,
                                                         BigDecimal txAmount, BigDecimal fee) {
        return transactionTemplate.execute(status -> {
            Transaction tx = new Transaction();
            tx.setRequestId(ctx.requestId());
            tx.setFromUserId(users.from().getUserId());
            tx.setFromPhone(users.from().getPhone());
            tx.setFromFullName(users.from().getFullName());
            tx.setToUserId(users.to().getUserId());
            tx.setToPhone(users.to().getPhone());
            tx.setToFullName(users.to().getFullName());
            tx.setAmount(txAmount);
            tx.setFee(fee);
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
     * Trả kết quả của tx đã thắng race nếu đã SUCCESS/FAILED, không thì throw DUPLICATE.
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
     * Lấy admin đầu tiên làm ví thu phí; mọi lỗi map về TRANSFER_FAILED để fail-fast.
     */
    private UserInternalResponse fetchFirstAdmin() {
        try {
            ResponseEntity<UserInternalResponse> resp = restTemplate.getForEntity(
                    userServiceUrl + "/internal/users/first-admin",
                    UserInternalResponse.class);
            UserInternalResponse admin = resp.getBody();
            if (admin == null || admin.getUserId() == null) {
                throw new AppException(ErrorCode.TRANSFER_FAILED, "Hệ thống chưa cấu hình tài khoản admin");
            }
            return admin;
        } catch (HttpClientErrorException e) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new AppException(ErrorCode.TRANSFER_FAILED,
                    "Không thể lấy thông tin admin: " + e.getMessage());
        }
    }

    /**
     * Gọi wallet /transfer (plain 2-party). amount truyền riêng để case admin-trả-merchant
     * dùng txAmount đã trừ fee; lỗi gói vào WalletCallResult để engine còn finalize FAILED.
     */
    private WalletCallResult callWalletTransfer(TransactionContext ctx, UserPair users,
                                                UUID transactionId, BigDecimal amount) {
        WalletTransferRequest req = new WalletTransferRequest();
        req.setFromUserId(users.from().getUserId());
        req.setToUserId(users.to().getUserId());
        req.setAmount(amount);
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
     * Gọi wallet /transfer-with-fee — wallet ghi 3 ledger entries atomic
     * (customer DEBIT amount, merchant CREDIT amount-fee, admin CREDIT fee).
     */
    private WalletCallResult callWalletTransferWithFee(TransactionContext ctx, UserPair users,
                                                       UserInternalResponse admin, UUID transactionId,
                                                       BigDecimal amount, BigDecimal fee) {
        WalletTransferWithFeeRequest req = new WalletTransferWithFeeRequest();
        req.setFromUserId(users.from().getUserId());
        req.setToUserId(users.to().getUserId());
        req.setPlatformUserId(admin.getUserId());
        req.setAmount(amount);
        req.setFee(fee);
        req.setTransactionId(transactionId);
        req.setNote(ctx.description());
        try {
            restTemplate.postForEntity(walletServiceUrl + "/internal/wallets/transfer-with-fee",
                    req, Void.class);
            return WalletCallResult.ok();
        } catch (HttpClientErrorException ex) {
            log.warn("Wallet transfer-with-fee rejected for tx {}: {}", transactionId, ex.getResponseBodyAsString());
            return WalletCallResult.fail(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("Wallet transfer-with-fee error for tx {}: {}", transactionId, ex.getMessage(), ex);
            return WalletCallResult.fail("Lỗi hệ thống: " + ex.getMessage());
        }
    }

    /**
     * Cập nhật status SUCCESS/FAILED + ghi history; đăng ký notification afterCommit khi thành công.
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

}
