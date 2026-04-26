package com.ldt.user.dto.kyc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class KycRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    private String fullName;

    @NotNull(message = "Ngày sinh không được để trống")
    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Số CCCD không được để trống")
    @Size(max = 20, message = "Số CCCD tối đa 20 ký tự")
    private String idNumber;

    @NotNull(message = "Ngày cấp CCCD không được để trống")
    private LocalDate idIssueDate;

    @NotBlank(message = "Nơi cấp CCCD không được để trống")
    @Size(max = 255, message = "Nơi cấp tối đa 255 ký tự")
    private String idIssuePlace;

    @NotBlank(message = "Mã sinh viên không được để trống")
    @Size(max = 20, message = "Mã sinh viên tối đa 20 ký tự")
    private String studentCode;

    // Ảnh giấy tờ (tuỳ chọn)
    private String idFrontUrl;
    private String idBackUrl;
    private String studentCardUrl;
}
