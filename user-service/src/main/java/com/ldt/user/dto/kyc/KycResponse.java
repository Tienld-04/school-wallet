package com.ldt.user.dto.kyc;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class KycResponse {
    private UUID kycId;
    private String fullName;
    private LocalDate dateOfBirth;
    private String idNumber;
    private LocalDate idIssueDate;
    private String idIssuePlace;
    private String studentCode;
    private String idFrontUrl;
    private String idBackUrl;
    private String studentCardUrl;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private String rejectionReason;
}
