package com.ldt.notification.service;

import com.ldt.notification.exception.AppException;
import com.ldt.notification.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class SpeedSmsService {
    // TODO: Check lại OTP
    private static final String API_URL = "https://api.speedsms.vn/index.php";

    private final RestTemplate restTemplate;

    @Value("${speedsms.access-token}")
    private String accessToken;

    @Value("${speedsms.sender:Verify}")
    private String sender;

    /**
     * SMS type:
     * 2 - gửi từ đầu số ngẫu nhiên
     * 3 - gửi từ brandname (notify)
     * 4 - gửi từ brandname (ads)
     * 5 - gửi từ app OTP
     */
    @Value("${speedsms.type:5}")
    private int smsType;

    public SpeedSmsService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendSms(String phone, String content) {
        String url = API_URL + "/sms/send";

        Map<String, Object> body = new HashMap<>();
        body.put("to", List.of(phone));
        body.put("content", content);
        body.put("sms_type", smsType);
        body.put("sender", sender);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", buildBasicAuth());

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("SpeedSMS response for phone {}: {}", phone, response.getBody());

            if (!response.getStatusCode().is2xxSuccessful()) {
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

    private String buildBasicAuth() {
        String credentials = accessToken + ":x";
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }
}
