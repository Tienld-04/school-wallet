package com.ldt.transaction.service;

import com.ldt.transaction.dto.response.TransactionStatusHistoryResponse;
import com.ldt.transaction.model.TransactionStatus;
import com.ldt.transaction.model.TransactionStatusHistory;
import com.ldt.transaction.repository.TransactionStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionStatusHistoryService {

    private final TransactionStatusHistoryRepository historyRepository;

    public void record(UUID transactionId, TransactionStatus fromStatus, TransactionStatus toStatus, String reason) {
        historyRepository.save(TransactionStatusHistory.builder()
                .transactionId(transactionId)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .reason(reason)
                .build());
    }

    public List<TransactionStatusHistoryResponse> getByTransactionId(UUID transactionId) {
        return historyRepository.findByTransactionIdOrderByChangedAtAsc(transactionId)
                .stream()
                .map(h -> TransactionStatusHistoryResponse.builder()
                        .historyId(h.getHistoryId())
                        .transactionId(h.getTransactionId())
                        .fromStatus(h.getFromStatus() != null ? h.getFromStatus().name() : null)
                        .toStatus(h.getToStatus().name())
                        .reason(h.getReason())
                        .changedAt(h.getChangedAt())
                        .build())
                .toList();
    }
}
