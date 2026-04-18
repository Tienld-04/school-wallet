package com.ldt.user.controller;

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
}
