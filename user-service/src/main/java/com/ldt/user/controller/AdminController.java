package com.ldt.user.controller;

import com.ldt.user.dto.request.ResetPinRequest;
import com.ldt.user.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @PutMapping("/reset-pin")
    public ResponseEntity<Map<String, String>> resetTransactionPin(@Valid @RequestBody ResetPinRequest request) {
        adminService.resetTransactionPin(request.getPhone(), request.getNewPin());
        return ResponseEntity.ok(Map.of("message", "Cấp lại mã PIN thành công"));
    }
}
