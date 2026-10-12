package com.ldt.user.enums;

import lombok.Getter;

@Getter
public enum QrCodeType {
    SCHOOL_WALLET_STATIC_QR("SCHOOL_WALLET_STATIC"),
    SCHOOL_WALLET_DYNAMIC_QR("SCHOOL_WALLET_DYNAMIC");

    private final String value;

    QrCodeType(String value) {
        this.value = value;
    }
}
