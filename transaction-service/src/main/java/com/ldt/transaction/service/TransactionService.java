package com.ldt.transaction.service;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.transfer.WalletTransferRequest;
import com.ldt.transaction.dto.user.InternalVerifyPinRequest;
import com.ldt.transaction.dto.user.UserInternalResponse;
import com.ldt.transaction.exception.AppException;
import com.ldt.transaction.exception.ErrorCode;
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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;


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
    public TransactionResponse transfer(TransferRequest transferRequest, String fromPhone) {

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
        if (transactionRepository.existsByRequestId(transferRequest.getRequestId())) {
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
        transaction.setDescription(
                "Từ: " + fromUser.getFullName() + " (" + fromUser.getPhone() + ")"
                        + " → Đến: " + toUser.getFullName() + " (" + toUser.getPhone() + ")"
                        + " | Số tiền: " + transferRequest.getAmount()
                        + " | Nội dung: " + transferRequest.getDescription()
        );
        transaction.setTransactionType(TransactionType.TRANSFER);
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
        } catch (Exception ex) {
            transaction.setStatus(TransactionStatus.FAILED);
            transaction = transactionRepository.save(transaction);
//            throw new RuntimeException("Chuyển tiền thất bại: " + ex.getMessage());
            return transactionMapper.toTransactionResponse(transaction);
        }
        transaction = transactionRepository.save(transaction);
        return transactionMapper.toTransactionResponse(transaction);

        // call wallet-service
//        WalletTransferRequest walletReq = new WalletTransferRequest();
//        walletReq.setFromUserId(fromUser.getUserId());
//        walletReq.setToUserId(toUser.getUserId());
//        walletReq.setAmount(transferRequest.getAmount());
//        restTemplate.postForEntity(
//                walletServiceUrl + "/internal/wallets/transfer",
//                walletReq,
//                Void.class
//        );
//        Transaction transaction = new Transaction();
//        transaction.setRequestId(transferRequest.getRequestId());
//        transaction.setFromUserId(fromUser.getUserId());
//        transaction.setToUserId(toUser.getUserId());
//        transaction.setAmount(transferRequest.getAmount());
//        transaction.setDescription("Ví ID: " + fromUser.getUserId()
//                + " -" + transferRequest.getAmount() + " -> "
//                + "Ví ID: " + toUser.getUserId() + " +" + transferRequest.getAmount()
//                + ", Nội dung: " + transferRequest.getDescription());
//        transaction.setTransactionType(TransactionType.TRANSFER);
//        transaction.setStatus(TransactionStatus.SUCCESS);
//        transaction = transactionRepository.save(transaction);
//        return transactionMapper.toTransactionResponse(transaction);
    }
}
