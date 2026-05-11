package com.ldt.user.service;

import com.ldt.user.dto.response.UserInternalResponse;
import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import com.ldt.user.model.User;
import com.ldt.user.model.UserRole;
import com.ldt.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InternalUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Cacheable(value = "users", key = "#phone_number")
    public UserInternalResponse getUserByPhone(String phone_number) {
        User user = userRepository.findByPhone(phone_number).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return toInternalResponse(user);
    }

    public List<UserInternalResponse> getUsersByPhones(List<String> phones) {
        List<User> users = userRepository.findByPhoneIn(phones);
        return users.stream()
                .map(this::toInternalResponse)
                .toList();
    }

    /**
     * Lấy admin đầu tiên (theo createdAt) để dùng làm "ví hệ thống" thu phí platform.
     * Gọi nội bộ bởi transaction-service trong flow merchant payment.
     */
    public UserInternalResponse getFirstAdmin() {
        User admin = userRepository.findFirstByRoleOrderByCreatedAtAsc(UserRole.ADMIN)
                .orElseThrow(() -> new AppException(ErrorCode.ADMIN_NOT_CONFIGURED));
        return toInternalResponse(admin);
    }

    private UserInternalResponse toInternalResponse(User user) {
        String kyc = user.getKycStatus() != null ? user.getKycStatus().name() : null;
        return new UserInternalResponse(
                user.getUserId(),
                user.getStatus(),
                user.getFullName(),
                user.getPhone(),
                user.getEmail(),
                kyc);
    }

    /**
     * Xác thực mã PIN giao dịch theo số điện thoại.
     * Được gọi nội bộ bởi transaction-service trước khi chuyển tiền.
     * - Nếu đang khóa: kiểm tra hết thời gian khóa chưa.
     *   + Còn khóa → throw PIN_LOCKED.
     *   + Hết khóa → reset counter + null lockedUntil để user có lại 5 chances mới.
     * - Sai PIN: tăng pinFailedAttempts, khóa 15 phút nếu >= 5 lần.
     * - Đúng PIN: reset bộ đếm.
     */
    @Transactional(dontRollbackOn = AppException.class)
    public void verifyPinByPhone(String phone, String rawPin) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getPinLockedUntil() != null) {
            if (LocalDateTime.now().isBefore(user.getPinLockedUntil())) {
                long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getPinLockedUntil()).toMinutes() + 1;
                throw new AppException(ErrorCode.PIN_LOCKED, "Chức năng chuyển tiền tạm khóa. Vui lòng thử lại sau " + minutesLeft + " phút");
            }
            user.setPinFailedAttempts(0);
            user.setPinLockedUntil(null);
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
