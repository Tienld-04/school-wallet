package com.ldt.wallet.service;

import com.ldt.wallet.dto.request.WalletCreateRequest;
import com.ldt.wallet.model.Wallet;
import com.ldt.wallet.model.WalletStatus;
import com.ldt.wallet.model.WalletType;
import com.ldt.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;
    public void createWallet(WalletCreateRequest walletCreateRequest) {
        Wallet wallet = new Wallet();
        wallet.setUserId(walletCreateRequest.getUserId());
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setWalletType(WalletType.USER_WALLET);
        wallet.setStatus(WalletStatus.ACTIVE);
        walletRepository.save(wallet);
    }

}
