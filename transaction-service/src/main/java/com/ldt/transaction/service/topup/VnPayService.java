package com.ldt.transaction.service.topup;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class VnPayService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final int EXPIRE_MINUTES = 10;

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Value("${vnpay.version:2.1.0}")
    private String version;

    public String buildPaymentUrl(String txnRef, BigDecimal amount, String orderInfo,
                                  String ipAddr, String bankCode, String language) {
        Map<String, String> params = new java.util.HashMap<>();
        params.put("vnp_Version", version);
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", amount.multiply(BigDecimal.valueOf(100)).toBigInteger().toString());
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", (language == null || language.isBlank()) ? "vn" : language);
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", ipAddr);
        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        params.put("vnp_CreateDate", now.format(DATE_FMT));
        params.put("vnp_ExpireDate", now.plusMinutes(EXPIRE_MINUTES).format(DATE_FMT));
        if (bankCode != null && !bankCode.isBlank()) {
            params.put("vnp_BankCode", bankCode);
        }

        String result = payUrl + "?" + buildQueryWithHash(params);
        // Debug: signature mismatch.
        // log.info("VNPay payment URL DEBUG");
        // log.info("Params: {}", params);
        // log.info("HashData: {}", buildHashData(params));
        // log.info("Final URL: {}", result);
        return result;
    }

    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isBlank()) {
            return false;
        }
        Map<String, String> filtered = new java.util.HashMap<>(params);
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");
        String hashData = buildHashData(filtered);
        String calculated = hmacSHA512(hashSecret, hashData);
        return calculated.equalsIgnoreCase(receivedHash);
    }

    private String buildHashData(Map<String, String> params) {
        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);
        StringBuilder sb = new StringBuilder();
        Iterator<String> it = keys.iterator();
        while (it.hasNext()) {
            String key = it.next();
            String value = params.get(key);
            if (value == null || value.isEmpty()) continue;
            sb.append(key).append('=')
                    .append(URLEncoder.encode(value, StandardCharsets.UTF_8));
            if (it.hasNext()) {
                sb.append('&');
            }
        }
        return sb.toString();
    }

    private String buildQueryWithHash(Map<String, String> params) {
        String hashData = buildHashData(params);
        String secureHash = hmacSHA512(hashSecret, hashData);
        return hashData + "&vnp_SecureHash=" + secureHash;
    }

    private static String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] result = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.error("HMAC SHA512 error", ex);
            return "";
        }
    }
}
