package com.ldt.user.controller;

import com.ldt.user.dto.kyc.KycAdminListResponse;
import com.ldt.user.dto.kyc.KycRejectRequest;
import com.ldt.user.dto.request.ResetPinRequest;
import com.ldt.user.dto.response.UsersResponse;
import com.ldt.user.model.UserStatus;
import com.ldt.user.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/user-statuses")
    public ResponseEntity<List<String>> getUserStatuses() {
        return ResponseEntity.ok(
                Arrays.stream(UserStatus.values()).map(Enum::name).toList()
        );
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UsersResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getUsers(page, size, status, search));
    }

    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<Map<String, String>> toggleUserStatus(@PathVariable UUID userId) {
        adminService.toggleUserStatus(userId);
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái tài khoản thành công"));
    }

    @PutMapping("/reset-pin")
    public ResponseEntity<Map<String, String>> resetTransactionPin(@Valid @RequestBody ResetPinRequest request) {
        adminService.resetTransactionPin(request.getPhone(), request.getNewPin());
        return ResponseEntity.ok(Map.of("message", "Cấp lại mã PIN thành công"));
    }
    
    @GetMapping("/kyc")
    public ResponseEntity<Page<KycAdminListResponse>> getKycList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.getKycList(page, size, status));
    }

    @PutMapping("/kyc/{kycId}/approve")
    public ResponseEntity<Map<String, String>> approveKyc(@PathVariable UUID kycId) {
        adminService.approveKyc(kycId);
        return ResponseEntity.ok(Map.of("message", "Duyệt KYC thành công"));
    }

    @PutMapping("/kyc/{kycId}/reject")
    public ResponseEntity<Map<String, String>> rejectKyc(
            @PathVariable UUID kycId,
            @Valid @RequestBody KycRejectRequest request) {
        adminService.rejectKyc(kycId, request.getRejectionReason());
        return ResponseEntity.ok(Map.of("message", "Từ chối KYC thành công"));
    }
}
