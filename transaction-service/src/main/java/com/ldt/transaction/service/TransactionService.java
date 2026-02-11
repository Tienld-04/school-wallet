package com.ldt.transaction.service;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.transfer.WalletTransferRequest;
import com.ldt.transaction.mapper.TransactionMapper;
import com.ldt.transaction.model.Transaction;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;
    private final TransactionMapper transactionMapper;
    @Value("${service.wallet-service.url}")
    private String walletServiceUrl;

    public TransactionResponse transfer(TransferRequest transferRequest) {
        // idempotency
        if (transactionRepository.existsByRequestId(transferRequest.getRequestId())) {
            throw new RuntimeException("Giao dịch đang được xử lí");
        }
        // call wallet-service
        WalletTransferRequest walletReq = new WalletTransferRequest();
        walletReq.setFromWalletId(transferRequest.getFromWalletId());
        walletReq.setToWalletId(transferRequest.getToWalletId());
        walletReq.setAmount(transferRequest.getAmount());
        restTemplate.postForEntity(
                walletServiceUrl + "/internal/wallets/transfer",
                walletReq,
                Void.class
        );
        Transaction transaction = new Transaction();
        transaction.setRequestId(transferRequest.getRequestId());
        transaction.setFromWalletId(transferRequest.getFromWalletId());
        transaction.setToWalletId(transferRequest.getToWalletId());
        transaction.setAmount(transferRequest.getAmount());
        transaction.setDescription("Ví ID: " + transferRequest.getFromWalletId()
                + " -" + transferRequest.getAmount() + " -> "
                + "Ví ID: " + transferRequest.getToWalletId() + " +" + transferRequest.getAmount()
                + ", Nội dung: " + transferRequest.getDescription());
        transaction.setTransactionType(TransactionType.TRANSFER);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction = transactionRepository.save(transaction);
        return transactionMapper.toTransactionResponse(transaction);
    }
}
