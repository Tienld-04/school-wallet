package com.ldt.user.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_kyc")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserKyc {

    @Id
    @GeneratedValue
    @Column(name = "kyc_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID kycId;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    // Kyc info
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "id_number", nullable = false, length = 20)
    private String idNumber;

    @Column(name = "id_issue_date", nullable = false)
    private LocalDate idIssueDate;

    @Column(name = "id_issue_place", nullable = false, length = 255)
    private String idIssuePlace;

    // student code
    @Column(name = "student_code", nullable = false, length = 20)
    private String studentCode;

    // image cccd
    @Column(name = "id_front_url", length = 500)
    private String idFrontUrl;

    @Column(name = "id_back_url", length = 500)
    private String idBackUrl;

    // image student card
    @Column(name = "student_card_url", length = 500)
    private String studentCardUrl;

    // submit kyc by admin
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private KycStatus status = KycStatus.PENDING;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // Audit
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onSubmit() {
        this.submittedAt = LocalDateTime.now();
    }
}
