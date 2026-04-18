package com.ldt.wallet.model;

public enum WalletStatus {
    ACTIVE("ACTIVE", "Ví hoạt động"),
    LOCKED("LOCKED", "Ví bị khóa");

    private final String code;
    private final String description;

    WalletStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
