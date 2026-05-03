package com.ldt.transaction.service.topup;

import com.ldt.transaction.dto.topup.VnPayIpnResponse;

public enum VnPayIpnCode {
    SUCCESS("00", "Confirm Success"),
    ORDER_NOT_FOUND("01", "Order not found"),
    ALREADY_CONFIRMED("02", "Order already confirmed"),
    INVALID_AMOUNT("04", "Invalid amount"),
    INVALID_SIGNATURE("97", "Invalid Signature"),
    CREDIT_WALLET_FAILED("99", "Credit wallet failed");

    private final String code;
    private final String message;

    VnPayIpnCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public VnPayIpnResponse toResponse() {
        return VnPayIpnResponse.of(code, message);
    }
}
