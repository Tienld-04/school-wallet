package com.ldt.user.service;

import com.ldt.user.context.UserContext;
import com.ldt.user.dto.kyc.KycRequest;
import com.ldt.user.dto.kyc.KycResponse;
import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import com.ldt.user.model.KycStatus;
import com.ldt.user.model.User;
import com.ldt.user.model.UserKyc;
import com.ldt.user.repository.UserKycRepository;
import com.ldt.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KycService {

    private final UserKycRepository userKycRepository;
    private final UserRepository userRepository;

    /**
     * Người dùng nộp hồ sơ KYC.
     * - Nếu chưa có hồ sơ → tạo mới với status = PENDING
     * - Nếu bị REJECTED → cho phép nộp lại (cập nhật hồ sơ cũ)
     * - Nếu đang PENDING → báo lỗi chờ duyệt
     * - Nếu đã VERIFIED → báo lỗi đã xác minh
     */
    @Transactional
    public KycResponse submitKyc(KycRequest request) {
        UUID userId = UUID.fromString(UserContext.getUserId());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getKycStatus() == KycStatus.VERIFIED) {
            throw new AppException(ErrorCode.KYC_ALREADY_VERIFIED);
        }
        if (user.getKycStatus() == KycStatus.PENDING) {
            throw new AppException(ErrorCode.KYC_PENDING);
        }
        if (userKycRepository.existsByIdNumberAndUserIdNot(request.getIdNumber(), userId)) {
            throw new AppException(ErrorCode.KYC_ID_NUMBER_EXISTS);
        }
        if (userKycRepository.existsByStudentCodeAndUserIdNot(request.getStudentCode(), userId)) {
            throw new AppException(ErrorCode.KYC_STUDENT_CODE_EXISTS);
        }


        UserKyc kyc = userKycRepository.findByUserId(userId)
                .orElse(UserKyc.builder().userId(userId).build());

        kyc.setFullName(request.getFullName());
        kyc.setDateOfBirth(request.getDateOfBirth());
        kyc.setIdNumber(request.getIdNumber());
        kyc.setIdIssueDate(request.getIdIssueDate());
        kyc.setIdIssuePlace(request.getIdIssuePlace());
        kyc.setStudentCode(request.getStudentCode());
        kyc.setIdFrontUrl(request.getIdFrontUrl());
        kyc.setIdBackUrl(request.getIdBackUrl());
        kyc.setStudentCardUrl(request.getStudentCardUrl());
        kyc.setStatus(KycStatus.PENDING);
        kyc.setSubmittedAt(LocalDateTime.now());
        kyc.setVerifiedAt(null);
        kyc.setRejectionReason(null);

        userKycRepository.save(kyc);

        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);

        return toResponse(kyc);
    }

    /**
     * Người dùng xem trạng thái hồ sơ KYC của mình.
     */
    public KycResponse getMyKyc() {
        UUID userId = UUID.fromString(UserContext.getUserId());
        UserKyc kyc = userKycRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND));
        return toResponse(kyc);
    }

    private KycResponse toResponse(UserKyc kyc) {
        KycResponse response = new KycResponse();
        response.setKycId(kyc.getKycId());
        response.setFullName(kyc.getFullName());
        response.setDateOfBirth(kyc.getDateOfBirth());
        response.setIdNumber(kyc.getIdNumber());
        response.setIdIssueDate(kyc.getIdIssueDate());
        response.setIdIssuePlace(kyc.getIdIssuePlace());
        response.setStudentCode(kyc.getStudentCode());
        response.setIdFrontUrl(kyc.getIdFrontUrl());
        response.setIdBackUrl(kyc.getIdBackUrl());
        response.setStudentCardUrl(kyc.getStudentCardUrl());
        response.setStatus(kyc.getStatus().name());
        response.setSubmittedAt(kyc.getSubmittedAt());
        response.setVerifiedAt(kyc.getVerifiedAt());
        response.setRejectionReason(kyc.getRejectionReason());
        return response;
    }
}
