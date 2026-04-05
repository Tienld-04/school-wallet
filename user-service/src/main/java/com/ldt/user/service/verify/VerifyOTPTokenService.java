package com.ldt.user.service.verify;

import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class VerifyOTPTokenService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String USED_TOKEN_PREFIX = "used_token:";

    @Value("${internal.secret}")
    private String internalSecret;

    @Value("${otp.token-expiration-minutes:10}")
    private int tokenExpirationMinutes;

    /**
     * Verify token từ notification-service và kiểm tra phone khớp.
     * Token format: Base64(phone|timestamp.signature)
     * Token chỉ được dùng 1 lần (single-use) — lưu signature vào Redis sau khi verify.
     */
    public void verifyOTPToken(String token, String phone) {
        try {
            // 1. Base64 decode
            String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);

            // 2. Tách data và signature (split bằng dấu "." cuối cùng)
            int lastDot = decoded.lastIndexOf(".");
            if (lastDot == -1) {
                throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
            }
            String data = decoded.substring(0, lastDot);
            String signature = decoded.substring(lastDot + 1);

            // 3. Verify chữ ký HMAC
            String expectedSignature = hmacSha256(data, internalSecret);
            if (!expectedSignature.equals(signature)) {
                throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
            }

            // 4. Tách phone và timestamp từ data
            String[] parts = data.split("\\|");
            if (parts.length != 2) {
                throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
            }
            String tokenPhone = parts[0];
            long timestamp = Long.parseLong(parts[1]);

            // 5. Check phone trong token == phone đăng ký
            if (!tokenPhone.equals(phone)) {
                throw new AppException(ErrorCode.PHONE_MISMATCH);
            }

            // 6. Check token chưa hết hạn
            long expirationMs = (long) tokenExpirationMinutes * 60 * 1000;
            if (System.currentTimeMillis() - timestamp > expirationMs) {
                throw new AppException(ErrorCode.VERIFICATION_EXPIRED);
            }

            // 7. Check token đã dùng chưa (single-use)
            String usedKey = USED_TOKEN_PREFIX + signature;
            if (Boolean.TRUE.equals(redisTemplate.hasKey(usedKey))) {
                throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
            }

            // 8. Đánh dấu token đã dùng — TTL = tokenExpirationMinutes
            redisTemplate.opsForValue().set(usedKey, "1", tokenExpirationMinutes, TimeUnit.MINUTES);

        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
        }
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : rawHmac) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify HMAC signature", e);
        }
    }
}
