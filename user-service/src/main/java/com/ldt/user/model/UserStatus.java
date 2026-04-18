package com.ldt.user.model;

import lombok.Getter;

@Getter
public enum UserStatus {
    ACTIVE("ACTIVE", "Tài khoản hoạt động"),
    LOCKED("LOCKED", "Tài khoản bị khóa");
    private final String code;
    private final String description;

    UserStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
