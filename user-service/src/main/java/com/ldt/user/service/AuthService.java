package com.ldt.user.service;

import com.ldt.user.dto.auth.ChangePasswordRequest;
import com.ldt.user.dto.auth.ForgotPasswordRequest;
import com.ldt.user.dto.auth.LoginRequest;
import com.ldt.user.dto.auth.LoginResponse;
import com.ldt.user.dto.auth.LogoutRequest;
import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import com.ldt.user.model.InvalidatedToken;
import com.ldt.user.model.User;
import com.ldt.user.model.UserStatus;
import com.ldt.user.repository.InvalidatedTokenRepository;
import com.ldt.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.ldt.user.context.UserContext;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Value("${service.notification-service.url}")
    private String notificationServiceUrl;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
            if (user.getFailedLoginCount() >= 5) {
                user.setStatus(UserStatus.LOCKED);
            }
            userRepository.save(user);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        user.setFailedLoginCount(0);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new LoginResponse(token);
    }
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    public boolean isTokenBlacklisted(String jti) {
        return invalidatedTokenRepository.existsById(jti);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));

        String newPassword = generateRandomPassword(6);
        String html = buildResetPasswordEmailHtml(user.getFullName(), newPassword);
        Map<String, String> body = Map.of(
                "toEmail", user.getEmail(),
                "toName", user.getFullName(),
                "subject", "School Wallet - Mật khẩu mới",
                "htmlContent", html
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(
                    notificationServiceUrl + "/internal/notification/send-email",
                    new HttpEntity<>(body, headers),
                    Void.class
            );
        } catch (Exception e) {
            log.error("Failed to send reset password email to: {}", user.getEmail(), e);
            throw new AppException(ErrorCode.SEND_EMAIL_FAILED);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String buildResetPasswordEmailHtml(String fullName, String newPassword) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="padding:20px;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
                        <tr>
                          <td style="background:#2c3e50;padding:24px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:24px;">School Wallet</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:32px;">
                            <p style="font-size:16px;color:#333;">Xin chào <strong>%s</strong>,</p>
                            <p style="font-size:15px;color:#555;">Mật khẩu của bạn đã được đặt lại. Dưới đây là mật khẩu mới:</p>
                            <div style="background:#f0f0f0;border-radius:6px;padding:16px;text-align:center;margin:20px 0;">
                              <span style="font-size:24px;font-weight:bold;letter-spacing:4px;color:#2c3e50;">%s</span>
                            </div>
                            <p style="font-size:14px;color:#e74c3c;font-weight:bold;">Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này.</p>
                            <p style="font-size:13px;color:#999;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ 0936733881 để được hỗ trợ.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#f4f4f4;padding:16px;text-align:center;">
                            <p style="font-size:12px;color:#aaa;margin:0;">School Wallet. TienDev.</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(fullName, newPassword);
    }

    public void changePassword(ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        User user = userRepository.findById(UUID.fromString(UserContext.getUserId()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void logout(LogoutRequest request) {
        try {
            Claims claims = jwtService.parseClaims(request.getToken());
            String jti = claims.getId();
            LocalDateTime expiryTime = claims.getExpiration()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();

            if (!invalidatedTokenRepository.existsById(jti)) {
                invalidatedTokenRepository.save(new InvalidatedToken(jti, expiryTime));
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
