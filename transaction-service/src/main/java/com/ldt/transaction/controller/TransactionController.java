package com.ldt.transaction.controller;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    @PostMapping
    public ResponseEntity<TransactionResponse> transfer(@RequestBody TransferRequest transferRequest) {
        return ResponseEntity.ok(transactionService.transfer(transferRequest));
    }

}

