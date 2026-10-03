package com.ldt.user.dto.kyc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class KycRequest {

    @NotBlank(message = "{validation.kyc_full_name.required}")
    @Size(max = 100, message = "{validation.kyc_full_name.max_length}")
    private String fullName;

    @NotNull(message = "{validation.date_of_birth.required}")
    @Past(message = "{validation.date_of_birth.past}")
    private LocalDate dateOfBirth;

    @NotBlank(message = "{validation.id_number.required}")
    @Size(max = 20, message = "{validation.id_number.max_length}")
    private String idNumber;

    @NotNull(message = "{validation.id_issue_date.required}")
    private LocalDate idIssueDate;

    @NotBlank(message = "{validation.id_issue_place.required}")
    @Size(max = 255, message = "{validation.id_issue_place.max_length}")
    private String idIssuePlace;

    @NotBlank(message = "{validation.hometown.required}")
    @Size(max = 255, message = "{validation.hometown.max_length}")
    private String placeOfOrigin;

    @NotBlank(message = "{validation.permanent_address.required}")
    @Size(max = 255, message = "{validation.permanent_address.max_length}")
    private String permanentAddress;

    // Ảnh giấy tờ — URL (cũ, không bắt buộc)
    private String idFrontUrl;
    private String idBackUrl;

    // Ảnh CCCD dạng base64 string (mới, bắt buộc cho mặt trước + sau)
    @NotBlank(message = "{validation.id_front_image.required}")
    private String idFrontImage;

    @NotBlank(message = "{validation.id_back_image.required}")
    private String idBackImage;
}
