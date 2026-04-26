package com.ldt.wallet.controller;

import com.ldt.wallet.context.UserContext;
import com.ldt.wallet.dto.response.BalanceResponse;
import com.ldt.wallet.dto.response.LedgerEntryResponse;
import com.ldt.wallet.dto.response.PageResponse;
import com.ldt.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/my-balance")
    public ResponseEntity<BalanceResponse> getBalance() {
        String userId = UserContext.getUserId();
        return ResponseEntity.ok(walletService.getBalanceByUserId(userId));
    }

    @GetMapping("/my-ledger")
    public ResponseEntity<PageResponse<LedgerEntryResponse>> getMyLedger(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = UserContext.getUserId();
        return ResponseEntity.ok(walletService.getMyLedger(userId, page, size));
    }
}
