package com.ldt.user.model;

import lombok.Getter;

@Getter
public enum MerchantType {
    CANTEEN("Căn tin"),
    PARKING("Bãi gửi xe"),
    PRINTING("In ấn"),
    LIBRARY("Thư viện"),
    BOOKSTORE("Cửa hàng sách"),
    CLUB("Câu lạc bộ"),
    EVENT("Sự kiện trường"),
    OTHER("Loại khác");

    private final String description;

    MerchantType(String description) {
        this.description = description;
    }
}
