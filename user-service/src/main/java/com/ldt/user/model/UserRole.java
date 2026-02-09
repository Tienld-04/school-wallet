package com.ldt.user.model;

import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN("ADMIN", "Quản trị viên"),
    USER("USER", "Người dùng");

    private final String code;
    private final String description;

    UserRole(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
