package com.ldt.wallet.controller;

import com.ldt.wallet.dto.request.WalletCreateRequest;
import com.ldt.wallet.dto.request.WalletTransferRequest;
import com.ldt.wallet.dto.request.WalletTransferWithFeeRequest;
import com.ldt.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/internal/wallets")
@RequiredArgsConstructor
public class InternalWalletController {
    private final WalletService walletService;

    @PostMapping
    public ResponseEntity<Void> createWallet(@Valid @RequestBody WalletCreateRequest walletCreateRequest) {
        walletService.createWallet(walletCreateRequest);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/transfer")
    public ResponseEntity<Map<String, String>> transfer(@Valid @RequestBody WalletTransferRequest walletTransferRequest) {
        Map<String, String> map = new HashMap<>();
        map.put("status", walletService.transfer(walletTransferRequest));
        return ResponseEntity.ok(map);
    }

    @PostMapping("/transfer-with-fee")
    public ResponseEntity<Map<String, String>> transferWithFee(@Valid @RequestBody WalletTransferWithFeeRequest req) {
        Map<String, String> map = new HashMap<>();
        map.put("status", walletService.transferWithFee(req));
        return ResponseEntity.ok(map);
    }

}
