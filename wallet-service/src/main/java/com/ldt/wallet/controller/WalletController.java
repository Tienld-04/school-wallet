package com.ldt.wallet.controller;

import com.ldt.wallet.context.UserContext;
import com.ldt.wallet.dto.response.BalanceResponse;
import com.ldt.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/my-balance")
    public ResponseEntity<BalanceResponse> getBalanceByUserId() {
        String userId = UserContext.getUserId();
        BalanceResponse balance = walletService.getBalanceByUserId(userId);
        return ResponseEntity.ok(balance);
    }
}
