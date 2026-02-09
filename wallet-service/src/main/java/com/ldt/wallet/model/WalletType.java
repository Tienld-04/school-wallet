package com.ldt.wallet.model;

import lombok.Getter;

@Getter
public enum WalletStatus {
    ADMIN_WALLET("ADMIN_WALLET", "Ví quản trị viên"),
    USER_WALLET("USER_WALLET", "Ví người dùng");

    private final String code;
    private final String description;

    WalletStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
