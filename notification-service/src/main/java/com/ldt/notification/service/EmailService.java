package com.ldt.notification.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@Slf4j
public class EmailService {

    private final SendGrid sendGrid;
    private final Email fromEmail;

    public EmailService(
            @Value("${sendgrid.api-key}") String apiKey,
            @Value("${sendgrid.from-email}") String fromEmailAddress,
            @Value("${sendgrid.from-name}") String fromName
    ) {
        this.sendGrid = new SendGrid(apiKey);
        this.fromEmail = new Email(fromEmailAddress, fromName);
    }

    public void sendEmail(String toEmailAddress, String toName, String subject, String htmlContent) {
        Email to = new Email(toEmailAddress, toName);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(fromEmail, subject, to, content);

        try {
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sendGrid.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to: {} | Subject: {}", toEmailAddress, subject);
            } else {
                log.error("Failed to send email to: {} | Status: {} | Body: {}",
                        toEmailAddress, response.getStatusCode(), response.getBody());
            }
        } catch (IOException e) {
            log.error("Error sending email to: {} | Error: {}", toEmailAddress, e.getMessage());
        }
    }
}
