package com.ldt.transaction.service;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.event.TransactionNotificationEvent;
import com.ldt.transaction.dto.transfer.WalletTransferRequest;
import com.ldt.transaction.dto.user.InternalVerifyPinRequest;
import com.ldt.transaction.dto.user.UserInternalResponse;
import com.ldt.transaction.exception.AppException;
import com.ldt.transaction.exception.ErrorCode;
import com.ldt.transaction.mapper.TransactionMapper;
import com.ldt.transaction.model.Transaction;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.producer.TransactionEventProducer;
import com.ldt.transaction.repository.TransactionRepository;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;


@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;
    private final TransactionMapper transactionMapper;
    private final TransactionEventProducer notificationProducer;
    @Value("${service.wallet-service.url}")
    private String walletServiceUrl;

    @Value("${user-service.url}")
    private String userServiceUrl;

    @Transactional(noRollbackFor = AppException.class)
    public TransactionResponse transfer(TransferRequest transferRequest, String fromPhone, TransactionType transactionType) {

        if (fromPhone.equals(transferRequest.getToPhoneNumber())) {
            throw new AppException(ErrorCode.SELF_TRANSFER);
        }
        // Xác thực PIN giao dịch
        // fromPhone lấy từ header
        try {
            restTemplate.postForEntity(
                    userServiceUrl + "/internal/users/verify-pin",
                    new InternalVerifyPinRequest(fromPhone, transferRequest.getPin()),
                    Void.class
            );
        } catch (HttpClientErrorException e) {
            throw new AppException(ErrorCode.PIN_VERIFICATION_FAILED, e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new AppException(ErrorCode.PIN_VERIFICATION_FAILED, "Không thể xác thực PIN: " + e.getMessage());
        }
        //
        Optional<Transaction> existingTransaction = transactionRepository.findByRequestId(transferRequest.getRequestId());
        if (existingTransaction.isPresent()) {
            Transaction existing = existingTransaction.get();
            if (existing.getStatus() == TransactionStatus.SUCCESS || existing.getStatus() == TransactionStatus.FAILED) {
                return transactionMapper.toTransactionResponse(existing);
            }
            throw new AppException(ErrorCode.DUPLICATE_TRANSACTION);
        }
        //
        ResponseEntity<UserInternalResponse> responseFromUser =
                restTemplate.getForEntity(
                        userServiceUrl + "/internal/users/" + fromPhone,
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
            throw new AppException(ErrorCode.RECIPIENT_LOCKED);
        }
        Transaction transaction = new Transaction();
        transaction.setRequestId(transferRequest.getRequestId());
        transaction.setFromUserId(fromUser.getUserId());
        transaction.setFromPhone(fromUser.getPhone());
        transaction.setFromFullName(fromUser.getFullName());
        transaction.setToUserId(toUser.getUserId());
        transaction.setToPhone(toUser.getPhone());
        transaction.setToFullName(toUser.getFullName());
        transaction.setAmount(transferRequest.getAmount());
        transaction.setDescription(transferRequest.getDescription());
        transaction.setTransactionType(transactionType);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction = transactionRepository.save(transaction);
        //
        try {
            WalletTransferRequest walletReq = new WalletTransferRequest();
            walletReq.setFromUserId(fromUser.getUserId());
            walletReq.setToUserId(toUser.getUserId());
            walletReq.setAmount(transferRequest.getAmount());
            restTemplate.postForEntity(
                    walletServiceUrl + "/internal/wallets/transfer",
                    walletReq,
                    Void.class
            );
            transaction.setStatus(TransactionStatus.SUCCESS);
        } catch (HttpClientErrorException ex) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new AppException(ErrorCode.TRANSFER_FAILED, ex.getResponseBodyAsString());
        } catch (Exception ex) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new AppException(ErrorCode.TRANSFER_FAILED, "Lỗi hệ thống: " + ex.getMessage());
        }
        transaction = transactionRepository.save(transaction);

        // Event transfer -> ActiveMq
        TransactionNotificationEvent event = TransactionNotificationEvent.builder()
                .transactionId(transaction.getTransactionId())
                .fromUserId(transaction.getFromUserId())
                .fromFullName(transaction.getFromFullName())
                .fromPhone(transaction.getFromPhone())
                .fromEmail(fromUser.getEmail())
                .toUserId(transaction.getToUserId())
                .toFullName(transaction.getToFullName())
                .toPhone(transaction.getToPhone())
                .toEmail(toUser.getEmail())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .transactionType(transaction.getTransactionType().name())
                .status(transaction.getStatus().name())
                .build();

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notificationProducer.sendNotification(event);
            }
        });

        return transactionMapper.toTransactionResponse(transaction);
    }
}
