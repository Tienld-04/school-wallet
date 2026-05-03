package com.ldt.transaction.enums;

public enum VnPayTransactionCode {
    SUCCESS("00"),
    NOT_REGISTERED_INTERNET_BANKING("09"),
    AUTH_FAILED_3_TIMES("10"),
    PAYMENT_EXPIRED("11"),
    CARD_BLOCKED("12"),
    WRONG_OTP("13"),
    CANCELLED_BY_USER("24"),
    INSUFFICIENT_BALANCE("51"),
    EXCEEDED_DAILY_LIMIT("65"),
    BANK_MAINTENANCE("75"),
    WRONG_PASSWORD_EXCEEDED("79");

    private final String code;

    VnPayTransactionCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static VnPayTransactionCode fromCode(String code) {
        if (code == null) return null;
        for (VnPayTransactionCode v : values()) {
            if (v.code.equals(code)) return v;
        }
        return null;
    }
}
