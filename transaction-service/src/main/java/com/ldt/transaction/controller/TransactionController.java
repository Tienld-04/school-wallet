package com.ldt.transaction.controller;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(
            @Valid @RequestBody TransferRequest transferRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.transfer(transferRequest, fromPhone, TransactionType.TRANSFER));
    }

    @PostMapping("/payment")
    public ResponseEntity<TransactionResponse> payment(
            @Valid @RequestBody TransferRequest transferRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.transfer(transferRequest, fromPhone, TransactionType.PAYMENT));
    }

    @PostMapping("/topup")
    public ResponseEntity<TransactionResponse> topup(
            @Valid @RequestBody TransferRequest transferRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.transfer(transferRequest, fromPhone, TransactionType.TOPUP));
    }

}
