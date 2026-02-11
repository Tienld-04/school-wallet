package com.ldt.wallet.service;

import com.ldt.wallet.dto.request.WalletCreateRequest;
import com.ldt.wallet.dto.request.WalletTransferRequest;
import com.ldt.wallet.model.Wallet;
import com.ldt.wallet.model.WalletStatus;
import com.ldt.wallet.model.WalletType;
import com.ldt.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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
        if(walletTransferRequest.getAmount().compareTo(BigDecimal.ZERO) <= 0){
            throw new RuntimeException("Số tiền phải lớn hơn 0");
        }
        Wallet fromWallet = walletRepository.findByUserId(walletTransferRequest.getFromUserId())
                .orElseThrow(() -> new RuntimeException("Ví nguồn không tồn tại"));
        Wallet toWallet = walletRepository.findByUserId(walletTransferRequest.getToUserId())
                .orElseThrow(() -> new RuntimeException("Ví đich không tồn tại"));
        if(fromWallet.getBalance().compareTo(walletTransferRequest.getAmount()) < 0){
            throw new RuntimeException("Số dư không đủ");
        }
        fromWallet.setBalance(fromWallet.getBalance().subtract(walletTransferRequest.getAmount()));
        toWallet.setBalance(toWallet.getBalance().add(walletTransferRequest.getAmount()));
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);
        return "Chuyển tiền thành công";
    }

}
