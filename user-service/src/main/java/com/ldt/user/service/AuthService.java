package com.ldt.user.service;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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
