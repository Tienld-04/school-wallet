package com.ldt.user.service;

import com.ldt.user.dto.response.UserInternalResponse;
import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import com.ldt.user.model.User;
import com.ldt.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InternalUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserInternalResponse getUserByPhone(String phone_number) {
        User user = userRepository.findByPhone(phone_number).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return new UserInternalResponse(user.getUserId(), user.getStatus(), user.getFullName(), user.getPhone());
    }

    /**
     * Xác thực mã PIN giao dịch theo số điện thoại.
     * Được gọi nội bộ bởi transaction-service trước khi chuyển tiền.
     * - Kiểm tra tài khoản bị khóa
     * - Sai PIN: tăng pinFailedAttempts, khóa 15 phút nếu >= 5 lần
     * - Đúng PIN: reset bộ đếm
     */
    @Transactional
    public void verifyPinByPhone(String phone, String rawPin) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getPinLockedUntil() != null && LocalDateTime.now().isBefore(user.getPinLockedUntil())) {
            long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getPinLockedUntil()).toMinutes() + 1;
            throw new AppException(ErrorCode.PIN_LOCKED, "Chức năng chuyển tiền tạm khóa. Vui lòng thử lại sau " + minutesLeft + " phút");
        }

        if (!passwordEncoder.matches(rawPin, user.getTransactionPinHash())) {
            int attempts = (user.getPinFailedAttempts() == null ? 0 : user.getPinFailedAttempts()) + 1;
            user.setPinFailedAttempts(attempts);
            if (attempts >= 5) {
                user.setPinLockedUntil(LocalDateTime.now().plusMinutes(15));
                userRepository.save(user);
                throw new AppException(ErrorCode.PIN_LOCKED, "Sai PIN quá 5 lần. Chức năng chuyển tiền bị tạm khóa 15 phút");
            }
            userRepository.save(user);
            throw new AppException(ErrorCode.INVALID_PIN, "Mã PIN không đúng. Còn " + (5 - attempts) + " lần thử");
        }

        user.setPinFailedAttempts(0);
        user.setPinLockedUntil(null);
        userRepository.save(user);
    }
}
