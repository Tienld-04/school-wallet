package com.ldt.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendEmailRequest {
    @NotBlank(message = "Email người nhận không được để trống")
    @Email(message = "Email không hợp lệ")
    private String toEmail;

    @NotBlank(message = "Tên người nhận không được để trống")
    private String toName;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String subject;

    @NotBlank(message = "Nội dung email không được để trống")
    private String htmlContent;
}
