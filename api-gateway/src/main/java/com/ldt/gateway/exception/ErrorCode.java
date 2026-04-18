package com.ldt.gateway.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
@Getter
public enum ErrorCode {
    UNCATEGORIZEO_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "Người dùng chưa được xác thực hoặc token không hợp lệ.", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID(1002, "Token không hợp lệ hoặc đã bị vô hiệu hóa.", HttpStatus.UNAUTHORIZED),
    SERVICE_UNAVAILABLE(1003, "Service tạm thời không khả dụng", HttpStatus.SERVICE_UNAVAILABLE);

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.message = message;
        this.code = code;
        this.httpStatusCode = httpStatusCode;
    }
}
