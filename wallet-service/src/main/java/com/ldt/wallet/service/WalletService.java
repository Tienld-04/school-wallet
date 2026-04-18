package com.ldt.wallet.service;

import com.ldt.wallet.dto.request.WalletCreateRequest;
import com.ldt.wallet.dto.request.WalletTransferRequest;
import com.ldt.wallet.dto.response.BalanceResponse;
import com.ldt.wallet.exception.AppException;
import com.ldt.wallet.exception.ErrorCode;
import com.ldt.wallet.model.Wallet;
import com.ldt.wallet.model.WalletStatus;
import com.ldt.wallet.model.WalletType;
import com.ldt.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;

    @Transactional
    public void createWallet(WalletCreateRequest walletCreateRequest) {
        Wallet wallet = new Wallet();
        wallet.setUserId(walletCreateRequest.getUserId());
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setWalletType(WalletType.USER_WALLET);
        wallet.setStatus(WalletStatus.ACTIVE);
        walletRepository.save(wallet);
    }

    @Transactional
    public String transfer(WalletTransferRequest walletTransferRequest) {
        if (walletTransferRequest.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }
        Wallet fromWallet = walletRepository.findByUserIdForUpdate(walletTransferRequest.getFromUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        Wallet toWallet = walletRepository.findByUserIdForUpdate(walletTransferRequest.getToUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        if (fromWallet.getStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }
        if (toWallet.getStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }
        // Reset daily/monthly spent nếu sang ngày/tháng mới
        LocalDate today = LocalDate.now();
        if (fromWallet.getLastDailyReset() == null || !fromWallet.getLastDailyReset().equals(today)) {
            fromWallet.setDailySpent(BigDecimal.ZERO);
            fromWallet.setLastDailyReset(today);
        }
        if (fromWallet.getLastMonthlyReset() == null || fromWallet.getLastMonthlyReset().getMonth() != today.getMonth()
                || fromWallet.getLastMonthlyReset().getYear() != today.getYear()) {
            fromWallet.setMonthlySpent(BigDecimal.ZERO);
            fromWallet.setLastMonthlyReset(today);
        }
        // Check hạn mức
        BigDecimal amount = walletTransferRequest.getAmount();
        if (fromWallet.getDailySpent().add(amount).compareTo(fromWallet.getDailyLimit()) > 0) {
            throw new AppException(ErrorCode.DAILY_LIMIT_EXCEEDED);
        }
        if (fromWallet.getMonthlySpent().add(amount).compareTo(fromWallet.getMonthlyLimit()) > 0) {
            throw new AppException(ErrorCode.MONTHLY_LIMIT_EXCEEDED);
        }
        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
        // Cập nhật số dư + hạn mức đã dùng
        fromWallet.setBalance(fromWallet.getBalance().subtract(amount));
        fromWallet.setDailySpent(fromWallet.getDailySpent().add(amount));
        fromWallet.setMonthlySpent(fromWallet.getMonthlySpent().add(amount));
        toWallet.setBalance(toWallet.getBalance().add(amount));
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);
        return "Chuyển tiền thành công";
    }

    // get balance wallet for user id
    public BalanceResponse getBalanceByUserId(String userId) {
        Wallet wallet = walletRepository.findByUserId(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        BalanceResponse balanceResponse = BalanceResponse.builder()
                .balance(wallet.getBalance())
                .userId(wallet.getUserId())
                .walletId(wallet.getWalletId())
                .build();
        return balanceResponse;
    }
}