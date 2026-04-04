package com.ldt.notification.service;

import com.ldt.notification.exception.AppException;
import com.ldt.notification.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class SmsService {
    private final RestTemplate restTemplate;

    @Value("${esms.api-key}")
    private String apiKey;

    @Value("${esms.secret-key}")
    private String secretKey;

    @Value("${esms.sms-type}")
    private String smsType;

    @Value("${esms.brand-name:}")
    private String brandName;

    @Value("${esms.sandbox:0}")
    private String sandbox;

    public SmsService() {
        this.restTemplate = new RestTemplate();
    }
    public void sendSms(String phone, String content) {
        String url = "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";

        Map<String, Object> body = new HashMap<>();
        body.put("ApiKey", apiKey);
        body.put("Content", content);
        body.put("Phone", phone);
        body.put("SecretKey", secretKey);
        body.put("SmsType", smsType);
        body.put("IsUnicode", "0");
        body.put("Sandbox", sandbox);

        if (brandName != null && !brandName.isEmpty()) {
            body.put("Brandname", brandName);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("eSMS response for phone {}: {}", phone, response.getBody());
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("SMS sent successfully to: {}", phone);
            } else {
                log.error("Failed to send SMS to: {} | Status: {} | Body: {}",
                        phone, response.getStatusCode(), response.getBody());
                throw new AppException(ErrorCode.OTP_SEND_FAILED);
            }
        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Error sending SMS to: {} | Error: {}", phone, e.getMessage());
            throw new AppException(ErrorCode.OTP_SEND_FAILED, "Gửi SMS thất bại: " + e.getMessage());
        }
    }
}
