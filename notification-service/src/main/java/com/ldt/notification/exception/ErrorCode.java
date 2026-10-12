package com.ldt.notification.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "error.UNCATEGORIZED_EXCEPTION", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST(2000, "error.INVALID_REQUEST", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(2001, "error.OTP_EXPIRED", HttpStatus.BAD_REQUEST),
    OTP_INVALID(2002, "error.OTP_INVALID", HttpStatus.BAD_REQUEST),
    OTP_MAX_ATTEMPTS(2003, "error.OTP_MAX_ATTEMPTS", HttpStatus.BAD_REQUEST),
    OTP_RESEND_TOO_SOON(2004, "error.OTP_RESEND_TOO_SOON", HttpStatus.TOO_MANY_REQUESTS),
    OTP_SEND_FAILED(2005, "error.OTP_SEND_FAILED", HttpStatus.INTERNAL_SERVER_ERROR),
    NOTIFICATION_NOT_FOUND(3001, "error.NOTIFICATION_NOT_FOUND", HttpStatus.NOT_FOUND),
    FORBIDDEN(3002, "error.FORBIDDEN", HttpStatus.FORBIDDEN);

    ErrorCode(int code, String messageKey, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.messageKey = messageKey;
        this.httpStatusCode = httpStatusCode;
    }

    private final int code;
    private final String messageKey;
    private final HttpStatusCode httpStatusCode;
}
