package com.ldt.user.controller;

import com.ldt.user.dto.auth.ChangePasswordRequest;
import com.ldt.user.dto.auth.ForgotPasswordRequest;
import com.ldt.user.dto.auth.LoginRequest;
import com.ldt.user.dto.auth.LoginResponse;
import com.ldt.user.dto.auth.LogoutRequest;
import com.ldt.user.dto.request.DynamicQrRequest;
import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.request.VerifyPinRequest;
import com.ldt.user.dto.response.QrTransferResponse;
import com.ldt.user.dto.response.RecipientResponse;
import com.ldt.user.dto.response.UserResponse;
import com.ldt.user.service.AuthService;
import com.ldt.user.dto.request.QrVerifyRequest;
import com.ldt.user.dto.response.QrVerifyResponse;
import com.ldt.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> createUser(@Valid @RequestBody UserCreateRequest userCreateRequest){
        userService.createUser(userCreateRequest);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUsersById(@PathVariable UUID userId){
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest){
        return ResponseEntity.ok(authService.login(loginRequest));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest logoutRequest){
        authService.logout(logoutRequest);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request){
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Mật khẩu mới đã được gửi đến email của bạn"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request){
        authService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    @GetMapping("/info")
    public ResponseEntity<UserResponse> getUserCurrent(){
        return ResponseEntity.ok(userService.getUserCurent());
    }

    /**
     * Tra cứu thông tin người nhận theo số điện thoại.
     */
    @GetMapping("/by-phone/{phone}")
    public ResponseEntity<RecipientResponse> getRecipientByPhone(@PathVariable String phone) {
        return ResponseEntity.ok(userService.getRecipientByPhone(phone));
    }

    /**
     * Xác thực mã PIN giao dịch của người dùng đang đăng nhập.
     */
    @PostMapping("/verify-pin")
    public ResponseEntity<Void> verifyTransactionPin(@Valid @RequestBody VerifyPinRequest request) {
        userService.verifyTransactionPin(request.getPin());
        return ResponseEntity.ok().build();
    }

    /**
     * Static QR: Tạo QR content cá nhân của user hiện tại (không có số tiền).
     * Người gửi quét → nhập số tiền → nhập PIN → chuyển tiền.
     */
    @GetMapping("/my-qr")
    public ResponseEntity<QrTransferResponse> getMyQr() {
        return ResponseEntity.ok(userService.generateMyQr());
    }

    /**
     * Dynamic QR: Tạo QR có kèm số tiền + mô tả cố định.
     * Người gửi quét → thấy ngay thông tin + số tiền → chỉ nhập PIN → chuyển tiền.
     */
    @PostMapping("/qr/dynamic")
    public ResponseEntity<QrTransferResponse> getDynamicQr(@Valid @RequestBody DynamicQrRequest request) {
        return ResponseEntity.ok(
                userService.generateDynamicQr(request.getAmount(), request.getDescription())
        );
    }

    /**
     * Verify QR: Nhận QR string từ thư viện quét mã, kiểm tra HMAC_SHA512 sig.
     * Trả về thông tin người nhận (và số tiền nếu là Dynamic QR).
     * Đảm bảo an toàn không bị sửa đổi thông tin khi quét QR.
     */
    @PostMapping("/qr/verify")
    public ResponseEntity<QrVerifyResponse> verifyQr(
            @Valid @RequestBody QrVerifyRequest request) {
        return ResponseEntity.ok(userService.verifyQr(request));
    }
}

