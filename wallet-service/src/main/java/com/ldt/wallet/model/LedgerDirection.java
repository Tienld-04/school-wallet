package com.ldt.wallet.model;

import lombok.Getter;

@Getter
public enum LedgerDirection {
    DEBIT("DEBIT", "Ghi nợ - tiền ra khỏi ví"),
    CREDIT("CREDIT", "Ghi có - tiền vào ví");

    private final String code;
    private final String description;

    LedgerDirection(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
