package com.ldt.user.service;

import com.ldt.user.context.UserContext;
import com.ldt.user.dto.kyc.KycAdminListResponse;
import com.ldt.user.dto.response.UsersResponse;
import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import com.ldt.user.mapper.UserMapper;
import com.ldt.user.model.KycStatus;
import com.ldt.user.model.User;
import com.ldt.user.model.UserKyc;
import com.ldt.user.model.UserStatus;
import com.ldt.user.repository.UserKycRepository;
import com.ldt.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final UserKycRepository userKycRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    /**
     * Cập nhật lại mã pin cho Users
     */
    public void resetTransactionPin(String phone, String newPin) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setTransactionPinHash(passwordEncoder.encode(newPin));
        user.setPinFailedAttempts(0);
        user.setPinLockedUntil(null);
        userRepository.save(user);
    }

    /**
     * Admin Lấy danh sách người dùng có phân trang, lọc theo trạng thái, tìm kiếm theo tên hoặc SĐT
     */
    public Page<UsersResponse> getUsers(int page, int size, String status, String search) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isBlank()) {
                try {
                    UserStatus userStatus = UserStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), userStatus));
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(root.get("phone"), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.findAll(spec, pageRequest).map(userMapper::toUsersResponse);
    }
    /**
     * Khóa/mở khóa tài khoản người dùng
     */
    public void toggleUserStatus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.ACTIVE) {
            user.setStatus(UserStatus.LOCKED);
        } else {
            user.setStatus(UserStatus.ACTIVE);
            user.setFailedLoginCount(0);
        }
        userRepository.save(user);
    }
    // Kyc user info
    public Page<KycAdminListResponse> getKycList(int page, int size, String status) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt"));
        Page<UserKyc> result;
        if (status != null && !status.isBlank()) {
            try {
                KycStatus kycStatus = KycStatus.valueOf(status.toUpperCase());
                result = userKycRepository.findAllByStatus(kycStatus, pageRequest);
            } catch (IllegalArgumentException ignored) {
                result = userKycRepository.findAll(pageRequest);
            }
        } else {
            result = userKycRepository.findAll(pageRequest);
        }
        return result.map(this::toKycAdminResponse);
    }

    @Transactional
    public void approveKyc(UUID kycId) {
        UserKyc kyc = userKycRepository.findById(kycId)
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND));

        kyc.setStatus(KycStatus.VERIFIED);
        kyc.setVerifiedBy(UUID.fromString(UserContext.getUserId()));
        kyc.setVerifiedAt(LocalDateTime.now());
        kyc.setRejectionReason(null);
        userKycRepository.save(kyc);

        userRepository.findById(kyc.getUserId()).ifPresent(user -> {
            user.setKycStatus(KycStatus.VERIFIED);
            userRepository.save(user);
        });
    }

    @Transactional
    public void rejectKyc(UUID kycId, String rejectionReason) {
        UserKyc kyc = userKycRepository.findById(kycId)
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND));

        kyc.setStatus(KycStatus.REJECTED);
        kyc.setRejectionReason(rejectionReason);
        kyc.setVerifiedBy(UUID.fromString(UserContext.getUserId()));
        kyc.setVerifiedAt(LocalDateTime.now());
        userKycRepository.save(kyc);

        userRepository.findById(kyc.getUserId()).ifPresent(user -> {
            user.setKycStatus(KycStatus.REJECTED);
            userRepository.save(user);
        });
    }

    private KycAdminListResponse toKycAdminResponse(UserKyc kyc) {
        KycAdminListResponse r = new KycAdminListResponse();
        r.setKycId(kyc.getKycId());
        r.setUserId(kyc.getUserId());
        r.setFullName(kyc.getFullName());
        r.setDateOfBirth(kyc.getDateOfBirth());
        r.setIdNumber(kyc.getIdNumber());
        r.setIdIssueDate(kyc.getIdIssueDate());
        r.setIdIssuePlace(kyc.getIdIssuePlace());
        r.setStudentCode(kyc.getStudentCode());
        r.setIdFrontUrl(kyc.getIdFrontUrl());
        r.setIdBackUrl(kyc.getIdBackUrl());
        r.setStudentCardUrl(kyc.getStudentCardUrl());
        r.setStatus(kyc.getStatus().name());
        r.setSubmittedAt(kyc.getSubmittedAt());
        r.setVerifiedBy(kyc.getVerifiedBy());
        r.setVerifiedAt(kyc.getVerifiedAt());
        r.setRejectionReason(kyc.getRejectionReason());
        return r;
    }

}
