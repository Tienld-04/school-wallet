package com.ldt.user.model;

import lombok.Getter;

@Getter
public enum KycStatus {
    UNVERIFIED("UNVERIFIED", "Chưa nộp KYC"),
    PENDING("PENDING", "Đã nộp, chờ admin duyệt"),
    VERIFIED("VERIFIED", "Đã được xác minh"),
    REJECTED("REJECTED", "Bị từ chối");

    private final String code;
    private final String description;

    KycStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
