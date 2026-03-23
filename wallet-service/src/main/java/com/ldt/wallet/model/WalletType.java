package com.ldt.wallet.model;

import lombok.Getter;

@Getter
public enum WalletType {
    ADMIN_WALLET("ADMIN_WALLET", "Ví quản trị viên"),
    USER_WALLET("USER_WALLET", "Ví người dùng"),
    MERCHANT_WALLET("MERCHANT_WALLET", "Ví nhà cung cấp dịch vụ");

    private final String code;
    private final String description;

    WalletType(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
