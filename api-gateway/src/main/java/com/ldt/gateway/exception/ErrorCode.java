package com.ldt.gateway.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
@Getter
public enum ErrorCode {
    UNCATEGORIZEO_EXCEPTION(9999, "error.UNCATEGORIZEO_EXCEPTION", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "error.UNAUTHENTICATED", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID(1002, "error.TOKEN_INVALID", HttpStatus.UNAUTHORIZED),
    SERVICE_UNAVAILABLE(1003, "error.SERVICE_UNAVAILABLE", HttpStatus.SERVICE_UNAVAILABLE);

    private final int code;
    private final String messageKey;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(int code, String messageKey, HttpStatusCode httpStatusCode) {
        this.messageKey = messageKey;
        this.code = code;
        this.httpStatusCode = httpStatusCode;
    }
}
