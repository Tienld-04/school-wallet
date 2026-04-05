package com.ldt.notification.service;

import com.ldt.notification.exception.AppException;
import com.ldt.notification.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class OtpService {
    // TODO: Check lại OTP
    private final RedisTemplate<String, String> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final SpeedSmsService speedSmsService;

    @Value("${otp.expiration-minutes}")
    private int expirationMinutes;

    @Value("${otp.max-attempts}")
    private int maxAttempts;

    @Value("${otp.resend-cooldown-seconds}")
    private int resendCooldownSeconds;

    @Value("${otp.token-expiration-minutes}")
    private int tokenExpirationMinutes;

    @Value("${internal.secret}")
    private String internalSecret;

    private static final String OTP_PREFIX = "otp:";
    private static final String ATTEMPTS_PREFIX = "otp:attempts:";
    private static final String COOLDOWN_PREFIX = "otp:cooldown:";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Tạo OTP 6 số, lưu hash vào Redis, gửi SMS qua eSMS.
     */
    public void sendOtp(String phone) {
        // Check cooldown
        String cooldownKey = COOLDOWN_PREFIX + phone;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            throw new AppException(ErrorCode.OTP_RESEND_TOO_SOON);
        }
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        String otpKey = OTP_PREFIX + phone;
        String attemptsKey = ATTEMPTS_PREFIX + phone;
        redisTemplate.opsForValue().set(otpKey, passwordEncoder.encode(otp), expirationMinutes, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(cooldownKey, "1", resendCooldownSeconds, TimeUnit.SECONDS);
        String content = "[School Wallet] - Ma xac thuc cua ban la: " + otp + ". Het han sau " + expirationMinutes + " phut.";
        //smsService.sendSms(phone, content);
        speedSmsService.sendSms(phone, content);
        log.info("OTP sent to phone: {}", phone);
    }

    /**
     * Xác thực OTP. ok → return verificationToken.
     */
    public String verifyOtp(String phone, String otp) {
        String attemptsKey = ATTEMPTS_PREFIX + phone;
        String otpKey = OTP_PREFIX + phone;
        String attemptsStr = redisTemplate.opsForValue().get(attemptsKey);
        int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;
        if (attempts >= maxAttempts) {
            throw new AppException(ErrorCode.OTP_MAX_ATTEMPTS);
        }
        String otpHash = redisTemplate.opsForValue().get(otpKey);
        if (otpHash == null) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        if (!passwordEncoder.matches(otp, otpHash)) {
            redisTemplate.opsForValue().increment(attemptsKey);
            redisTemplate.expire(attemptsKey, expirationMinutes, TimeUnit.MINUTES);
            int remaining = maxAttempts - attempts - 1;
            throw new AppException(ErrorCode.OTP_INVALID, "Mã OTP không đúng. Còn " + remaining + " lần thử");
        }
        redisTemplate.delete(otpKey);
        redisTemplate.delete(attemptsKey);
        redisTemplate.delete(COOLDOWN_PREFIX + phone);
        return createVerificationToken(phone);
    }

    /**
     * Tạo token HMAC: Base64(phone|timestamp.signature)
     * user-service dùng cùng INTERNAL_SECRET để verify.
     */
    private String createVerificationToken(String phone) {
        long timestamp = System.currentTimeMillis();
        String data = phone + "|" + timestamp;
        String signature = hmacSha256(data, internalSecret);
        String token = data + "." + signature;
        return Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
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
            throw new RuntimeException("Failed to create HMAC signature", e);
        }
    }
}
