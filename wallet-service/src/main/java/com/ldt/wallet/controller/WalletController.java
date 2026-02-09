package com.ldt.wallet.controller;

import com.ldt.wallet.dto.request.WalletCreateRequest;
import com.ldt.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/wallets")
@RequiredArgsConstructor
public class WalletController {
    private final WalletService walletService;
    @PostMapping
    public ResponseEntity<Void> createWallet(@RequestBody WalletCreateRequest walletCreateRequest) {
        walletService.createWallet(walletCreateRequest);
        return ResponseEntity.ok().build();
    }

}
