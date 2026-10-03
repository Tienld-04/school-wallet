package com.ldt.wallet.exception;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZEO_EXCEPTION(9999, "error.UNCATEGORIZEO_EXCEPTION", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "error.UNAUTHENTICATED", HttpStatus.UNAUTHORIZED),

    INVALID_AMOUNT(1002, "error.INVALID_AMOUNT", HttpStatus.BAD_REQUEST),
    WALLET_NOT_FOUND(1003, "error.WALLET_NOT_FOUND", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE(1004, "error.INSUFFICIENT_BALANCE", HttpStatus.BAD_REQUEST),
    WALLET_LOCKED(1005, "error.WALLET_LOCKED", HttpStatus.BAD_REQUEST),
    DAILY_LIMIT_EXCEEDED(1006, "error.DAILY_LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST),
    MONTHLY_LIMIT_EXCEEDED(1007, "error.MONTHLY_LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1008, "error.INVALID_REQUEST", HttpStatus.BAD_REQUEST);
    ErrorCode(int code, String messageKey, HttpStatusCode httpStatusCode) {
        this.messageKey = messageKey;
        this.code = code;
        this.httpStatusCode = httpStatusCode;
    }
    private int code;
    private String messageKey;
    private HttpStatusCode httpStatusCode;

}