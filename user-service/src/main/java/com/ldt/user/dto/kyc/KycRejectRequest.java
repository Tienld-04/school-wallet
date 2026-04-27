package com.ldt.user.dto.kyc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class KycRejectRequest {
    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    private String rejectionReason;
}
