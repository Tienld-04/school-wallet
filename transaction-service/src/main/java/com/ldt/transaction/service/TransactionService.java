package com.ldt.transaction.service;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.transfer.WalletTransferRequest;
import com.ldt.transaction.dto.user.UserInternalResponse;
import com.ldt.transaction.mapper.TransactionMapper;
import com.ldt.transaction.model.Transaction;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.repository.TransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
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

    @Value("${user-service.url}")
    private String userServiceUrl;

    @Transactional
    public TransactionResponse transfer(TransferRequest transferRequest) {
        // idempotency
        if (transactionRepository.existsByRequestId(transferRequest.getRequestId())) {
            throw new RuntimeException("Giao dịch đang được xử lí");
        }
        //
        ResponseEntity<UserInternalResponse> responseFromUser =
                restTemplate.getForEntity(
                        userServiceUrl + "/internal/users/" + transferRequest.getFromPhoneNumber(),
                        UserInternalResponse.class
                );
        UserInternalResponse fromUser = responseFromUser.getBody();
        //
        ResponseEntity<UserInternalResponse> responseToUser =
                restTemplate.getForEntity(
                        userServiceUrl + "/internal/users/" + transferRequest.getToPhoneNumber(),
                        UserInternalResponse.class
                );
        UserInternalResponse toUser = responseToUser.getBody();
        //
        if (toUser.getStatus().equals("LOCKED")) {
            throw new RuntimeException("Ví bị khóa. Vui lòng nhập lại số điện thoại");
        }
        // call wallet-service
        WalletTransferRequest walletReq = new WalletTransferRequest();
        walletReq.setFromUserId(fromUser.getUserId());
        walletReq.setToUserId(toUser.getUserId());
        walletReq.setAmount(transferRequest.getAmount());
        restTemplate.postForEntity(
                walletServiceUrl + "/internal/wallets/transfer",
                walletReq,
                Void.class
        );
        Transaction transaction = new Transaction();
        transaction.setRequestId(transferRequest.getRequestId());
        transaction.setFromWalletId(fromUser.getUserId());
        transaction.setToWalletId(toUser.getUserId());
        transaction.setAmount(transferRequest.getAmount());
        transaction.setDescription("Ví ID: " + fromUser.getUserId()
                + " -" + transferRequest.getAmount() + " -> "
                + "Ví ID: " + toUser.getUserId() + " +" + transferRequest.getAmount()
                + ", Nội dung: " + transferRequest.getDescription());
        transaction.setTransactionType(TransactionType.TRANSFER);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction = transactionRepository.save(transaction);
        return transactionMapper.toTransactionResponse(transaction);
    }
}
