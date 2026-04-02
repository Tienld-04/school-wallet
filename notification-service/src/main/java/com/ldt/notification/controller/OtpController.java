//package com.ldt.notification.controller;
//
//import com.ldt.notification.dto.OtpSendRequest;
//import com.ldt.notification.dto.OtpVerifyRequest;
//import com.ldt.notification.dto.OtpVerifyResponse;
//import com.ldt.notification.service.OtpService;
//import jakarta.validation.Valid;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/otp")
//@RequiredArgsConstructor
//public class OtpController {
//
//    private final OtpService otpService;
//
//    @PostMapping("/send")
//    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody OtpSendRequest request) {
//        otpService.sendOtp(request.getPhone());
//        return ResponseEntity.ok(Map.of("message", "Mã OTP đã được gửi đến số điện thoại của bạn"));
//    }
//
//    @PostMapping("/verify")
//    public ResponseEntity<OtpVerifyResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
//        String token = otpService.verifyOtp(request.getPhone(), request.getOtp());
//        return ResponseEntity.ok(new OtpVerifyResponse(token));
//    }
//}
