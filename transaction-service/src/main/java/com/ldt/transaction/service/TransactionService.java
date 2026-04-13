package com.ldt.transaction.service;

import com.ldt.transaction.dto.response.PageResponse;
import com.ldt.transaction.dto.response.TransactionHistoryResponse;
import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.payment.PaymentRequest;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
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
        // 1. Check duplicate
        Optional<Transaction> existingTransaction = transactionRepository.findByRequestId(transferRequest.getRequestId());
        if (existingTransaction.isPresent()) {
            Transaction existing = existingTransaction.get();
            if (existing.getStatus() == TransactionStatus.SUCCESS || existing.getStatus() == TransactionStatus.FAILED) {
                return transactionMapper.toTransactionResponse(existing);
            }
            throw new AppException(ErrorCode.DUPLICATE_TRANSACTION);
        }
        // 2. Xác thực PIN giao dịch
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
        // 3. Lấy thông tin 2 user trong 1 request
        List<String> phones = List.of(fromPhone, transferRequest.getToPhoneNumber());
        ResponseEntity<List<UserInternalResponse>> batchResponse = restTemplate.exchange(
                userServiceUrl + "/internal/users/batch",
                HttpMethod.POST,
                new HttpEntity<>(phones),
                new ParameterizedTypeReference<>() {}
        );
        List<UserInternalResponse> users = batchResponse.getBody();
        if (users == null || users.size() < 2) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, "Không tìm thấy thông tin người dùng");
        }
        Map<String, UserInternalResponse> userMap = users.stream()
                .collect(Collectors.toMap(UserInternalResponse::getPhone, Function.identity()));
        UserInternalResponse fromUser = userMap.get(fromPhone);
        UserInternalResponse toUser = userMap.get(transferRequest.getToPhoneNumber());
        if (fromUser == null || toUser == null) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, "Không tìm thấy thông tin người dùng");
        }
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
        try {
            transaction = transactionRepository.save(transaction);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Race condition: 2 request cùng requestId đến đồng thời
            Transaction existing = transactionRepository.findByRequestId(transferRequest.getRequestId())
                    .orElseThrow(() -> new AppException(ErrorCode.DUPLICATE_TRANSACTION));
            return transactionMapper.toTransactionResponse(existing);
        }
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
    //
    @Transactional(noRollbackFor = AppException.class)
    public TransactionResponse merchantPayment(PaymentRequest request, String fromPhone) {
        if (fromPhone.equals(request.getMerchantPhone())) {
            throw new AppException(ErrorCode.SELF_TRANSFER);
        }
        // 1. Check duplicate
        Optional<Transaction> existingTransaction = transactionRepository.findByRequestId(request.getRequestId());
        if (existingTransaction.isPresent()) {
            Transaction existing = existingTransaction.get();
            if (existing.getStatus() == TransactionStatus.SUCCESS || existing.getStatus() == TransactionStatus.FAILED) {
                return transactionMapper.toTransactionResponse(existing);
            }
            throw new AppException(ErrorCode.DUPLICATE_TRANSACTION);
        }
        // 2. Xác thực PIN
        try {
            restTemplate.postForEntity(
                    userServiceUrl + "/internal/users/verify-pin",
                    new InternalVerifyPinRequest(fromPhone, request.getPin()),
                    Void.class
            );
        } catch (HttpClientErrorException e) {
            throw new AppException(ErrorCode.PIN_VERIFICATION_FAILED, e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new AppException(ErrorCode.PIN_VERIFICATION_FAILED, "Không thể xác thực PIN: " + e.getMessage());
        }
        // 3. Lấy thông tin 2 user (người trả + merchant owner) trong 1 request
        List<String> phones = List.of(fromPhone, request.getMerchantPhone());
        ResponseEntity<List<UserInternalResponse>> batchResponse = restTemplate.exchange(
                userServiceUrl + "/internal/users/batch",
                HttpMethod.POST,
                new HttpEntity<>(phones),
                new ParameterizedTypeReference<>() {}
        );
        List<UserInternalResponse> users = batchResponse.getBody();
        if (users == null || users.size() < 2) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, "Không tìm thấy thông tin người dùng");
        }
        Map<String, UserInternalResponse> userMap = users.stream()
                .collect(Collectors.toMap(UserInternalResponse::getPhone, Function.identity()));
        UserInternalResponse fromUser = userMap.get(fromPhone);
        UserInternalResponse toUser = userMap.get(request.getMerchantPhone());
        if (fromUser == null || toUser == null) {
            throw new AppException(ErrorCode.TRANSFER_FAILED, "Không tìm thấy thông tin người dùng");
        }
        if (toUser.getStatus().equals("LOCKED")) {
            throw new AppException(ErrorCode.RECIPIENT_LOCKED);
        }
        // 4. Tạo transaction
        String description = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription()
                : "Thanh toán " + request.getMerchantName();

        Transaction transaction = new Transaction();
        transaction.setRequestId(request.getRequestId());
        transaction.setFromUserId(fromUser.getUserId());
        transaction.setFromPhone(fromUser.getPhone());
        transaction.setFromFullName(fromUser.getFullName());
        transaction.setToUserId(toUser.getUserId());
        transaction.setToPhone(toUser.getPhone());
        transaction.setToFullName(toUser.getFullName());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(description);
        transaction.setMerchantId(request.getMerchantId());
        transaction.setTransactionType(TransactionType.PAYMENT);
        transaction.setStatus(TransactionStatus.PENDING);
        try {
            transaction = transactionRepository.save(transaction);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            Transaction existing = transactionRepository.findByRequestId(request.getRequestId())
                    .orElseThrow(() -> new AppException(ErrorCode.DUPLICATE_TRANSACTION));
            return transactionMapper.toTransactionResponse(existing);
        }
        // 5. Gọi wallet-service chuyển tiền
        try {
            WalletTransferRequest walletReq = new WalletTransferRequest();
            walletReq.setFromUserId(fromUser.getUserId());
            walletReq.setToUserId(toUser.getUserId());
            walletReq.setAmount(request.getAmount());
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

        // 6. Event notification
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

    public PageResponse<TransactionHistoryResponse> getTransactionHistory(String userId, int page, int size) {
        UUID userUUID = UUID.fromString(userId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Transaction> transactionPage = transactionRepository.findByFromUserIdOrToUserId(userUUID, userUUID, pageable);
        List<TransactionHistoryResponse> content = transactionPage.getContent().stream()
                .map(tx -> TransactionHistoryResponse.builder()
                        .transactionId(tx.getTransactionId())
                        .fromFullName(tx.getFromFullName())
                        .fromPhone(tx.getFromPhone())
                        .toFullName(tx.getToFullName())
                        .toPhone(tx.getToPhone())
                        .amount(tx.getAmount())
                        .description(tx.getDescription())
                        .transactionType(tx.getTransactionType().name())
                        .status(tx.getStatus().name())
                        .merchantId(tx.getMerchantId())
                        .createdAt(tx.getCreatedAt())
                        .build())
                .toList();

        return PageResponse.<TransactionHistoryResponse>builder()
                .content(content)
                .page(transactionPage.getNumber())
                .size(transactionPage.getSize())
                .totalElements(transactionPage.getTotalElements())
                .totalPages(transactionPage.getTotalPages())
                .build();
    }

    public TransactionHistoryResponse getTransactionDetail(UUID transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        return TransactionHistoryResponse.builder()
                .transactionId(tx.getTransactionId())
                .fromFullName(tx.getFromFullName())
                .fromPhone(tx.getFromPhone())
                .toFullName(tx.getToFullName())
                .toPhone(tx.getToPhone())
                .amount(tx.getAmount())
                .description(tx.getDescription())
                .transactionType(tx.getTransactionType().name())
                .status(tx.getStatus().name())
                .merchantId(tx.getMerchantId())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
