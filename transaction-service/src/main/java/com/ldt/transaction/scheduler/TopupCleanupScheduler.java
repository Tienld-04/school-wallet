package com.ldt.transaction.scheduler;

// import com.ldt.transaction.model.Transaction;
// import com.ldt.transaction.model.TransactionStatus;
// import com.ldt.transaction.model.TransactionType;
// import com.ldt.transaction.repository.TransactionRepository;
// import com.ldt.transaction.service.TransactionStatusHistoryService;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.stereotype.Component;
// import org.springframework.transaction.annotation.Transactional;

// import java.time.LocalDateTime;
// import java.util.List;

// @Slf4j
// @Component
// @RequiredArgsConstructor
public class TopupCleanupScheduler {

//     private final TransactionRepository transactionRepository;
//     private final TransactionStatusHistoryService statusHistoryService;

//     // Chạy mỗi 5 phút — expire PENDING topup quá 15 phút 
//     @Scheduled(fixedDelay = 5 * 60 * 1000)
//     @Transactional
//     public void expireStaleTopups() {
//         LocalDateTime cutoff = LocalDateTime.now().minusMinutes(15);
//         List<Transaction> stale = transactionRepository
//                 .findByTransactionTypeAndStatusAndCreatedAtBefore(
//                         TransactionType.TOPUP, TransactionStatus.PENDING, cutoff);
//         if (stale.isEmpty()) return;

//         log.info("Expiring {} stale PENDING topup(s) older than 15 minutes", stale.size());
//         for (Transaction tx : stale) {
//             tx.setStatus(TransactionStatus.CANCELLED);
//             transactionRepository.save(tx);
//             statusHistoryService.record(tx.getTransactionId(),
//                     TransactionStatus.PENDING, TransactionStatus.CANCELLED,
//                     "Hết thời gian thanh toán VNPay");
//         }
//     }
}
