package com.ldt.wallet.service;

import com.ldt.wallet.dto.request.WalletTopupRequest;
import com.ldt.wallet.exception.AppException;
import com.ldt.wallet.exception.ErrorCode;
import com.ldt.wallet.model.LedgerDirection;
import com.ldt.wallet.model.LedgerReason;
import com.ldt.wallet.model.Wallet;
import com.ldt.wallet.model.WalletLedger;
import com.ldt.wallet.model.WalletStatus;
import com.ldt.wallet.repository.WalletLedgerRepository;
import com.ldt.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class WalletTopupService {
    private final WalletRepository walletRepository;
    private final WalletLedgerRepository walletLedgerRepository;

    @Transactional
    public String topup(WalletTopupRequest req) {
        // 1. Validate input
        if (req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }
        // 2. Lock wallet record for update
        Wallet wallet = walletRepository.findByUserIdForUpdate(req.getToUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        if (wallet.getStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }
        // 3. Idempotency check
        UUID transactionId = req.getTransactionId();
        if (!walletLedgerRepository.findByTransactionId(transactionId).isEmpty()) {
            return "Nạp tiền thành công";
        }
        // 4. Update balance and create ledger entry
        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal balanceAfter = balanceBefore.add(req.getAmount());
        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);
        // 5. Create ledger entry
        WalletLedger entry = WalletLedger.builder()
                .walletId(wallet.getWalletId())
                .transactionId(transactionId)
                .direction(LedgerDirection.CREDIT)
                .amount(req.getAmount())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .reason(LedgerReason.TOP_UP)
                .note(req.getNote())
                .build();
        walletLedgerRepository.save(entry);
        return "Nạp tiền thành công";
    }
}
