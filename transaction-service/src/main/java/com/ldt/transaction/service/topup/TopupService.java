package com.ldt.transaction.service.topup;

import com.ldt.transaction.dto.topup.InitiateTopupRequest;
import com.ldt.transaction.dto.topup.InitiateTopupResponse;
import com.ldt.transaction.dto.topup.TopupStatusResponse;
import com.ldt.transaction.dto.topup.VnPayIpnResponse;
import com.ldt.transaction.dto.topup.WalletTopupRequest;
import com.ldt.transaction.dto.user.UserInternalResponse;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class TopupService {

    private static final UUID VNPAY_USER_ID = UUID.fromString("0000000e-e000-e000-e000-e00000000000");
    private static final String VNPAY_LABEL = "VNPay Gateway";
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
        String requestId = UUID.randomUUID().toString().replace("-", "");
        UUID toUserId = UUID.fromString(userId);
        String toFullName = fetchUserFullName(userPhone);

        Transaction tx = new Transaction();
        tx.setRequestId(requestId);
        tx.setFromUserId(VNPAY_USER_ID);
        tx.setFromPhone(VNPAY_LABEL);
        tx.setFromFullName(VNPAY_LABEL);
        tx.setToUserId(toUserId);
        tx.setToPhone(userPhone);
        tx.setToFullName(toFullName);
        tx.setAmount(request.getAmount());
        tx.setFee(BigDecimal.ZERO);
        tx.setTransactionType(TransactionType.TOPUP);
        tx.setStatus(TransactionStatus.PENDING);
        tx.setDescription("Nap tien vao vi qua VNPay");
        Transaction saved = transactionRepository.saveAndFlush(tx);
        statusHistoryService.record(saved.getTransactionId(), null,
                TransactionStatus.PENDING, "Khoi tao yeu cau nap tien VNPay");

        String orderInfo = "Nap tien vao vi " + userPhone;
        String paymentUrl = vnPayService.buildPaymentUrl(
                requestId,
                request.getAmount(),
                orderInfo,
                ipAddr,
                request.getBankCode(),
                request.getLanguage()
        );
        log.info("Initiated topup PENDING requestId={} userId={} amount={}",
                requestId, userId, request.getAmount());
        return InitiateTopupResponse.builder()
                .paymentUrl(paymentUrl)
                .requestId(requestId)
                .build();
    }

    @Transactional
    public VnPayIpnResponse handleIpn(Map<String, String> params) {
        if (!vnPayService.verifySignature(params)) {
            log.warn("VNPay IPN: invalid signature, params={}", params);
            return VnPayIpnResponse.of("97", "Invalid Signature");
        }
        String txnRef = params.get("vnp_TxnRef");
        Optional<Transaction> txOpt = transactionRepository.findByRequestId(txnRef);
        if (txOpt.isEmpty()) {
            return VnPayIpnResponse.of("01", "Order not found");
        }
        Transaction tx = txOpt.get();
        try {
            BigDecimal vnpAmount = new BigDecimal(params.get("vnp_Amount"))
                    .divide(BigDecimal.valueOf(100));
            if (vnpAmount.compareTo(tx.getAmount()) != 0) {
                log.warn("VNPay IPN: amount mismatch txnRef={} vnp={} db={}",
                        txnRef, vnpAmount, tx.getAmount());
                return VnPayIpnResponse.of("04", "Invalid amount");
            }
        } catch (Exception e) {
            return VnPayIpnResponse.of("04", "Invalid amount");
        }

        if (tx.getStatus() == TransactionStatus.SUCCESS
                || tx.getStatus() == TransactionStatus.FAILED
                || tx.getStatus() == TransactionStatus.CANCELLED) {
            return VnPayIpnResponse.of("02", "Order already confirmed");
        }

        String responseCode = params.get("vnp_ResponseCode");
        String txnStatus = params.get("vnp_TransactionStatus");
        boolean paid = "00".equals(responseCode) && "00".equals(txnStatus);

        if (paid) {
            try {
                creditWallet(tx);
                tx.setStatus(TransactionStatus.SUCCESS);
                transactionRepository.save(tx);
                statusHistoryService.record(tx.getTransactionId(),
                        TransactionStatus.PENDING, TransactionStatus.SUCCESS,
                        "VNPay xac nhan thanh toan thanh cong");
                log.info("Topup SUCCESS requestId={} userId={} amount={}",
                        txnRef, tx.getToUserId(), tx.getAmount());
            } catch (Exception e) {
                log.error("Topup credit wallet failed requestId={}, keeping PENDING for VNPay retry", txnRef, e);
                return VnPayIpnResponse.of("99", "Credit wallet failed");
            }
        } else {
            boolean cancelled = "24".equals(responseCode);
            TransactionStatus newStatus = cancelled
                    ? TransactionStatus.CANCELLED
                    : TransactionStatus.FAILED;
            String reason = mapVnpayCodeToReason(responseCode, txnStatus);
            tx.setStatus(newStatus);
            transactionRepository.save(tx);
            statusHistoryService.record(tx.getTransactionId(),
                    TransactionStatus.PENDING, newStatus, reason);
            log.info("Topup {} requestId={} responseCode={} txnStatus={}",
                    newStatus, txnRef, responseCode, txnStatus);
        }
        return VnPayIpnResponse.of("00", "Confirm Success");
    }

    private static String mapVnpayCodeToReason(String responseCode, String txnStatus) {
        return switch (responseCode == null ? "" : responseCode) {
            case "24" -> "Khách hàng hủy giao dịch";
            case "09" -> "Thẻ chưa đăng ký Internet Banking";
            case "10" -> "Xác thực thẻ không thành công quá 3 lần";
            case "11" -> "Hết hạn chờ thanh toán";
            case "12" -> "Thẻ bị khóa";
            case "13" -> "OTP không chính xác";
            case "51" -> "Tài khoản không đủ số dư";
            case "65" -> "Vượt hạn mức giao dịch trong ngày";
            case "75" -> "Ngân hàng đang bảo trì";
            case "79" -> "Sai mật khẩu thanh toán quá số lần quy định";
            default   -> "VNPay từ chối: code=" + responseCode + " status=" + txnStatus;
        };
    }

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
