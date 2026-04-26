package com.ldt.transaction.controller;

import com.ldt.transaction.context.UserContext;
import com.ldt.transaction.dto.response.PageResponse;
import com.ldt.transaction.dto.request.TransactionHistoryRequest;
import com.ldt.transaction.dto.response.RecentTransactionResponse;
import com.ldt.transaction.dto.response.TransactionHistoryResponse;
import com.ldt.transaction.dto.response.TransactionStatusHistoryResponse;
import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.payment.PaymentRequest;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @PostMapping("/merchant/payment")
    public ResponseEntity<TransactionResponse> merchantPayment(
            @Valid @RequestBody PaymentRequest paymentRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.merchantPayment(paymentRequest, fromPhone));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<RecentTransactionResponse>> getRecentTransactions() {
        String userId = UserContext.getUserId();
        return ResponseEntity.ok(transactionService.getRecentTransactions(userId));
    }

    @PostMapping("/history")
    public ResponseEntity<PageResponse<TransactionHistoryResponse>> getTransactionHistory(
            @RequestBody TransactionHistoryRequest request) {
        String userId = UserContext.getUserId();
        return ResponseEntity.ok(transactionService.getTransactionHistory(userId, request.getPage(), request.getSize()));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionHistoryResponse> getTransactionDetail(
            @PathVariable UUID transactionId) {
        return ResponseEntity.ok(transactionService.getTransactionDetail(transactionId));
    }

    @GetMapping("/{transactionId}/status-history")
    public ResponseEntity<List<TransactionStatusHistoryResponse>> getStatusHistory(
            @PathVariable UUID transactionId) {
        return ResponseEntity.ok(transactionService.getStatusHistory(transactionId));
    }

}
