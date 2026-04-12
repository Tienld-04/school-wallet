package com.ldt.user.controller;

import com.ldt.user.context.UserContext;
import com.ldt.user.dto.merchant.MerchantListResponse;
import com.ldt.user.dto.merchant.MerchantRequest;
import com.ldt.user.dto.merchant.MerchantResponse;
import com.ldt.user.service.MerchantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ldt.user.model.MerchantType;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/merchants")
@RequiredArgsConstructor
public class MerchantController {
    private final MerchantService merchantService;

    @GetMapping("/list")
    public ResponseEntity<List<MerchantListResponse>> getActiveMerchants(
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(merchantService.getActiveMerchants(type));
    }

    @GetMapping("/my-user")
    public ResponseEntity<List<MerchantResponse>> getMyMerchants() {
        UUID userId = UUID.fromString(UserContext.getUserId());
        return ResponseEntity.ok(merchantService.getMerchantsByUserId(userId));
    }

    @GetMapping("/types")
    public ResponseEntity<List<Map<String, String>>> getMerchantTypes() {
        return ResponseEntity.ok(
                Arrays.stream(MerchantType.values())
                        .map(t -> Map.of("code", t.name(), "description", t.getDescription()))
                        .toList()
        );
    }

    @GetMapping
    public ResponseEntity<Page<MerchantResponse>> getMerchants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(merchantService.getMerchants(page, size, type, search));
    }

    @GetMapping("/detail/{merchantId}")
    public ResponseEntity<MerchantResponse> getMerchant(@PathVariable UUID merchantId) {
        return ResponseEntity.ok(merchantService.getMerchant(merchantId));
    }

    @PostMapping
    public ResponseEntity<MerchantResponse> createMerchant(@Valid @RequestBody MerchantRequest request) {
        return ResponseEntity.ok(merchantService.createMerchant(request));
    }

    @PutMapping("/{merchantId}")
    public ResponseEntity<MerchantResponse> updateMerchant(
            @PathVariable UUID merchantId,
            @Valid @RequestBody MerchantRequest request) {
        return ResponseEntity.ok(merchantService.updateMerchant(merchantId, request));
    }

    @DeleteMapping("/{merchantId}")
    public ResponseEntity<Map<String, String>> deleteMerchant(@PathVariable UUID merchantId) {
        merchantService.deleteMerchant(merchantId);
        return ResponseEntity.ok(Map.of("message", "Xóa merchant thành công"));
    }
}
