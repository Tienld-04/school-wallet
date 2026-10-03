package com.ldt.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendEmailRequest {
    @NotBlank(message = "{validation.to_email.required}")
    @Email(message = "{validation.email.invalid}")
    private String toEmail;

    @NotBlank(message = "{validation.to_name.required}")
    private String toName;

    @NotBlank(message = "{validation.subject.required}")
    private String subject;

    @NotBlank(message = "{validation.html_content.required}")
    private String htmlContent;
}
