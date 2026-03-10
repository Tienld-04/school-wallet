package com.ldt.user.service;

import com.ldt.user.dto.auth.LoginRequest;
import com.ldt.user.dto.auth.LoginResponse;
import com.ldt.user.model.User;
import com.ldt.user.model.UserStatus;
import com.ldt.user.repository.InvalidatedTokenRepository;
import com.ldt.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("SĐT hoặc mật khẩu không đúng"));
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new RuntimeException("Tài khoản bị khóa");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
            if (user.getFailedLoginCount() >= 5) {
                user.setStatus(UserStatus.LOCKED);
            }
            userRepository.save(user);
            throw new RuntimeException("SĐT hoặc mật khẩu không đúng");
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
}
