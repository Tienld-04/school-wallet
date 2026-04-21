package com.ldt.wallet.model;

import lombok.Getter;

@Getter
public enum LedgerReason {
    PAYMENT("PAYMENT", "Thanh toán cho merchant"),
    TRANSFER_IN("TRANSFER_IN", "Nhận tiền chuyển khoản"),
    TRANSFER_OUT("TRANSFER_OUT", "Chuyển tiền đi"),
    TOP_UP("TOP_UP", "Nạp tiền vào ví"),
    REFUND("REFUND", "Hoàn tiền");

    private final String code;
    private final String description;

    LedgerReason(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
