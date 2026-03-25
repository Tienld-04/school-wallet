package com.ldt.user.controller;

import com.ldt.user.dto.request.InternalVerifyPinRequest;
import com.ldt.user.dto.response.UserInternalResponse;
import com.ldt.user.service.AuthService;
import com.ldt.user.service.InternalUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {
    private final InternalUserService internalUserService;
    private final AuthService authService;

    @GetMapping("/{phone_number}")
    public ResponseEntity<UserInternalResponse> getUserByPhone(@PathVariable String phone_number) {
        return ResponseEntity.ok(internalUserService.getUserByPhone(phone_number));
    }

    @GetMapping("/validate")
    public ResponseEntity<Void> validateToken(@RequestParam String jti) {
        if (authService.isTokenBlacklisted(jti)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Xác thực PIN giao dịch theo số điện thoại.
     * Chỉ được gọi nội bộ từ transaction-service (yêu cầu X-Internal-Secret).
     */
    @PostMapping("/verify-pin")
    public ResponseEntity<Void> verifyPin(@Valid @RequestBody InternalVerifyPinRequest request) {
        internalUserService.verifyPinByPhone(request.getPhone(), request.getPin());
        return ResponseEntity.ok().build();
    }
}
