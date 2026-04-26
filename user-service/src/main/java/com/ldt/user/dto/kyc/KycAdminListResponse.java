package com.ldt.user.dto.kyc;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class KycAdminListResponse {
    private UUID kycId;
    private UUID userId;
    private String fullName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    private String idNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate idIssueDate;

    private String idIssuePlace;
    private String studentCode;
    private String idFrontUrl;
    private String idBackUrl;
    private String studentCardUrl;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedAt;

    private UUID verifiedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime verifiedAt;

    private String rejectionReason;
}
