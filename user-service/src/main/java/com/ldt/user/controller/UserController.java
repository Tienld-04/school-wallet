package com.ldt.user.controller;

import com.ldt.user.dto.auth.LoginRequest;
import com.ldt.user.dto.auth.LoginResponse;
import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.request.VerifyPinRequest;
import com.ldt.user.dto.response.QrTransferResponse;
import com.ldt.user.dto.response.RecipientResponse;
import com.ldt.user.dto.response.UserResponse;
import com.ldt.user.service.AuthService;
import com.ldt.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/info")
    public ResponseEntity<UserResponse> getUserCurrent(){
        return ResponseEntity.ok(userService.getUserCurent());
    }

    /**
     * Tra cứu thông tin người nhận theo số điện thoại.
     * kiểm tra người nhận tồn tại trước khi hiển thị màn hình xác nhận.
     */
    @GetMapping("/by-phone/{phone}")
    public ResponseEntity<RecipientResponse> getRecipientByPhone(@PathVariable String phone) {
        return ResponseEntity.ok(userService.getRecipientByPhone(phone));
    }

    /**
     * Xác thực mã PIN giao dịch của người dùng đang đăng nhập.
     * kiểm tra PIN sau khi người dùng nhập.
     */
    @PostMapping("/verify-pin")
    public ResponseEntity<Void> verifyTransactionPin(@Valid @RequestBody VerifyPinRequest request) {
        userService.verifyTransactionPin(request.getPin());
        return ResponseEntity.ok().build();
    }

    /**
     * Tạo QR content của user hiện tại.
     */
    @GetMapping("/my-qr")
    public ResponseEntity<QrTransferResponse> getMyQr() {
        return ResponseEntity.ok(userService.generateMyQr());
    }
}

