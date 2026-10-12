package com.ldt.user.dto.kyc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class KycRejectRequest {
    @NotBlank(message = "{validation.rejection_reason.required}")
    @Size(max = 500, message = "{validation.rejection_reason.max_length}")
    private String rejectionReason;
}
