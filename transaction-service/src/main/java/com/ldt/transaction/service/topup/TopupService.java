package com.ldt.transaction.service.topup;

import com.ldt.transaction.dto.topup.InitiateTopupRequest;
import com.ldt.transaction.dto.topup.InitiateTopupResponse;
import com.ldt.transaction.dto.topup.TopupStatusResponse;
import com.ldt.transaction.dto.topup.VnPayIpnResponse;
import com.ldt.transaction.dto.topup.WalletTopupRequest;
import com.ldt.transaction.dto.user.UserInternalResponse;
import com.ldt.transaction.enums.VnPayIpnCode;
import com.ldt.transaction.enums.VnPayTransactionCode;
import com.ldt.transaction.exception.AppException;
import com.ldt.transaction.exception.ErrorCode;
import com.ldt.transaction.model.Transaction;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.repository.TransactionRepository;
import com.ldt.transaction.service.TransactionStatusHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class TopupService {

    private static final UUID VNPAY_USER_ID = UUID.fromString("0000000e-e000-e000-e000-e00000000000");
    private static final String VNPAY_PHONE = "VNPay Gateway";
    private static final String VNPAY_FULLNAME = "VNPay";
    private final TransactionRepository transactionRepository;
    private final TransactionStatusHistoryService statusHistoryService;
    private final VnPayService vnPayService;
    private final RestTemplate restTemplate;

    @Value("${service.wallet-service.url}")
    private String walletServiceUrl;

    @Value("${user-service.url}")
    private String userServiceUrl;

    @Transactional
    public InitiateTopupResponse initiateTopup(InitiateTopupRequest request, String userId,
                                               String userPhone, String ipAddr) {
        // 1. Check if there's an existing PENDING transaction with the same requestId. If yes, return the existing payment URL.
        String requestId = request.getRequestId();
        UUID toUserId = UUID.fromString(userId);
        Optional<Transaction> existing = transactionRepository.findByRequestId(requestId);
        if (existing.isPresent()) {
            Transaction tx = existing.get();
            if (!tx.getToUserId().equals(toUserId)) {
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }
            if (tx.getStatus() != TransactionStatus.PENDING) {
                throw new AppException(ErrorCode.DUPLICATE_TRANSACTION);
            }
            String orderInfo = "Nạp tiền vào ví " + userPhone;
            String paymentUrl = vnPayService.buildPaymentUrl(
                    requestId, tx.getAmount(), orderInfo, ipAddr,
                    request.getBankCode(), request.getLanguage());
            log.debug("Retry topup PENDING requestId={} userId={}", requestId, userId);
            return InitiateTopupResponse.builder()
                    .paymentUrl(paymentUrl)
                    .requestId(requestId)
                    .build();
        }
        // 2. Cancel any stale PENDING transactions for this user (optional, depends on business rules)
        List<Transaction> stalePending = transactionRepository
                .findByToUserIdAndTransactionTypeAndStatus(toUserId, TransactionType.TOPUP, TransactionStatus.PENDING);
        for (Transaction stale : stalePending) {
            stale.setStatus(TransactionStatus.CANCELLED);
            transactionRepository.save(stale);
            statusHistoryService.record(stale.getTransactionId(),
                    TransactionStatus.PENDING, TransactionStatus.CANCELLED,
                    "Người dùng khởi tạo giao dịch nạp tiền mới");
            log.debug("Cancelled stale PENDING topup requestId={} for userId={}", stale.getRequestId(), userId);
        }
        String toFullName = fetchUserFullName(userPhone);
        // 3. Create new Transaction record with PENDING status
        Transaction tx = new Transaction();
        tx.setRequestId(requestId);
        tx.setFromUserId(VNPAY_USER_ID);
        tx.setFromPhone(VNPAY_PHONE);
        tx.setFromFullName(VNPAY_FULLNAME);
        tx.setToUserId(toUserId);
        tx.setToPhone(userPhone);
        tx.setToFullName(toFullName);
        tx.setAmount(request.getAmount());
        tx.setFee(BigDecimal.ZERO);
        tx.setTransactionType(TransactionType.TOPUP);
        tx.setStatus(TransactionStatus.PENDING);
        tx.setDescription("Nạp tiền vào ví qua VNPay");
        Transaction saved = transactionRepository.saveAndFlush(tx);
        // 4. Record initial status history
        statusHistoryService.record(saved.getTransactionId(), null,
                TransactionStatus.PENDING, "Khởi tạo yêu cầu nạp tiền VNPay");
        // 5. Build VNPay payment URL and return to client
        String orderInfo = "Nạp tiền vào ví " + userPhone;
        String paymentUrl = vnPayService.buildPaymentUrl(
                requestId, request.getAmount(), orderInfo, ipAddr,
                request.getBankCode(), request.getLanguage());
        log.debug("Initiated topup PENDING requestId={} userId={} amount={}",
                requestId, userId, request.getAmount());
        return InitiateTopupResponse.builder()
                .paymentUrl(paymentUrl)
                .requestId(requestId)
                .build();
    }

    @Transactional
    public VnPayIpnResponse handleIpn(Map<String, String> params) {
        // 1. Verify signature
        if (!vnPayService.verifySignature(params)) {
            log.warn("VNPay IPN: invalid signature, params={}", params);
            return VnPayIpnCode.INVALID_SIGNATURE.toResponse();
        }
        // 2. Find transaction by vnp_TxnRef (= requestId)
        String txnRef = params.get("vnp_TxnRef");
        Optional<Transaction> txOpt = transactionRepository.findByRequestId(txnRef);
        if (txOpt.isEmpty()) {
            return VnPayIpnCode.ORDER_NOT_FOUND.toResponse();
        }
        Transaction tx = txOpt.get();
        // 3. Verify amount form VNPay matches database record
        try {
            BigDecimal vnpAmount = new BigDecimal(params.get("vnp_Amount"))
                    .divide(BigDecimal.valueOf(100));
            if (vnpAmount.compareTo(tx.getAmount()) != 0) {
                log.warn("VNPay IPN: amount mismatch txnRef={} vnp={} db={}",
                        txnRef, vnpAmount, tx.getAmount());
                return VnPayIpnCode.INVALID_AMOUNT.toResponse();
            }
        } catch (Exception e) {
            return VnPayIpnCode.INVALID_AMOUNT.toResponse();
        }
        // 4. Check transaction status
        if (tx.getStatus() == TransactionStatus.SUCCESS
                || tx.getStatus() == TransactionStatus.FAILED
                || tx.getStatus() == TransactionStatus.CANCELLED) {
            return VnPayIpnCode.ALREADY_CONFIRMED.toResponse();
        }
        // 5. Update transaction status based on vnp_ResponseCode and vnp_TransactionStatus
        String responseCode = params.get("vnp_ResponseCode");
        String txnStatus = params.get("vnp_TransactionStatus");
        boolean paid = VnPayTransactionCode.SUCCESS.getCode().equals(responseCode)
                && VnPayTransactionCode.SUCCESS.getCode().equals(txnStatus);
        // 6. If paid, credit wallet and update transaction to SUCCESS. Otherwise, mark as FAILED or CANCELLED based on response code.
        if (paid) {
            try {
                creditWallet(tx);
                tx.setStatus(TransactionStatus.SUCCESS);
                transactionRepository.save(tx);
                statusHistoryService.record(tx.getTransactionId(),
                        TransactionStatus.PENDING, TransactionStatus.SUCCESS,
                        "VNPay xác nhận thanh toán thành công");
                log.debug("Topup SUCCESS requestId={} userId={} amount={}",
                        txnRef, tx.getToUserId(), tx.getAmount());
            } catch (Exception e) {
                log.error("Topup credit wallet failed requestId={}", txnRef, e);
                tx.setStatus(TransactionStatus.FAILED);
                transactionRepository.save(tx);
                statusHistoryService.record(tx.getTransactionId(), TransactionStatus.PENDING, TransactionStatus.FAILED, " " + e.getMessage());
                return VnPayIpnCode.CREDIT_WALLET_FAILED.toResponse();
            }
        } else {
            boolean cancelled = VnPayTransactionCode.CANCELLED_BY_USER.getCode().equals(responseCode);
            TransactionStatus newStatus = cancelled
                    ? TransactionStatus.CANCELLED
                    : TransactionStatus.FAILED;
            String reason = mapVnpayCodeToReason(responseCode, txnStatus);
            tx.setStatus(newStatus);
            transactionRepository.save(tx);
            statusHistoryService.record(tx.getTransactionId(),
                    TransactionStatus.PENDING, newStatus, reason);
            log.debug("Topup {} requestId={} responseCode={} txnStatus={}",
                    newStatus, txnRef, responseCode, txnStatus);
        }
        return VnPayIpnCode.SUCCESS.toResponse();
    }

    private static String mapVnpayCodeToReason(String responseCode, String txnStatus) {
        VnPayTransactionCode code = VnPayTransactionCode.fromCode(responseCode);
        if (code == null) {
            return "VNPay từ chối: code=" + responseCode + " status=" + txnStatus;
        }
        return switch (code) {
            case CANCELLED_BY_USER -> "Người dùng hủy giao dịch";
            case NOT_REGISTERED_INTERNET_BANKING -> "Thẻ chưa đăng ký Internet Banking";
            case AUTH_FAILED_3_TIMES -> "Xác thực thẻ không thành công quá 3 lần";
            case PAYMENT_EXPIRED -> "Hết hạn chờ thanh toán";
            case CARD_BLOCKED -> "Thẻ bị khóa";
            case WRONG_OTP -> "OTP không chính xác";
            case INSUFFICIENT_BALANCE -> "Tài khoản không đủ số dư";
            case EXCEEDED_DAILY_LIMIT -> "Vượt hạn mức giao dịch trong ngày";
            case BANK_MAINTENANCE -> "Ngân hàng đang bảo trì";
            case WRONG_PASSWORD_EXCEEDED -> "Sai mật khẩu thanh toán quá số lần quy định";
            default -> "VNPay từ chối: code=" + responseCode + " status=" + txnStatus;
        };
    }

    @Transactional(readOnly = true)
    public TopupStatusResponse getStatus(String requestId, String userId) {
        Transaction tx = transactionRepository.findByRequestId(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        if (!tx.getToUserId().toString().equals(userId)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        String message = switch (tx.getStatus()) {
            case SUCCESS -> "Nạp tiền thành công";
            case FAILED -> "Nạp tiền thất bại";
            case PENDING -> "Đang chờ xác nhận từ VNPay";
            case CANCELLED -> "Bạn đã hủy giao dịch nạp tiền";
        };
        return TopupStatusResponse.builder()
                .requestId(tx.getRequestId())
                .transactionId(tx.getTransactionId())
                .status(tx.getStatus().name())
                .amount(tx.getAmount())
                .description(tx.getDescription())
                .message(message)
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private String fetchUserFullName(String phone) {
        try {
            UserInternalResponse user = restTemplate.getForObject(
                    userServiceUrl + "/internal/users/" + phone,
                    UserInternalResponse.class);
            return user != null ? user.getFullName() : null;
        } catch (HttpClientErrorException ex) {
            log.warn("User lookup rejected for phone {}: {}", phone, ex.getResponseBodyAsString());
            throw new AppException(ErrorCode.TOPUP_FAILED, ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("User lookup error for phone {}: {}", phone, ex.getMessage(), ex);
            throw new AppException(ErrorCode.TOPUP_FAILED, "Lỗi hệ thống: " + ex.getMessage());
        }
    }

    private void creditWallet(Transaction tx) {
        WalletTopupRequest req = new WalletTopupRequest();
        req.setToUserId(tx.getToUserId());
        req.setAmount(tx.getAmount());
        req.setTransactionId(tx.getTransactionId());
        req.setNote("Nap tien VNPay - " + tx.getRequestId());
        try {
            restTemplate.postForEntity(walletServiceUrl + "/internal/wallets/topup", req, Void.class);
        } catch (HttpClientErrorException ex) {
            log.warn("Wallet topup rejected for tx {}: {}",
                    tx.getTransactionId(), ex.getResponseBodyAsString());
            throw new AppException(ErrorCode.TOPUP_FAILED, ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("Wallet topup error for tx {}: {}",
                    tx.getTransactionId(), ex.getMessage(), ex);
            throw new AppException(ErrorCode.TOPUP_FAILED, "Lỗi hệ thống: " + ex.getMessage());
        }
    }
}
