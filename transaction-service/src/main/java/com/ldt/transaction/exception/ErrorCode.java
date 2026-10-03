package com.ldt.transaction.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "error.UNCATEGORIZED_EXCEPTION", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST(1002, "error.INVALID_REQUEST", HttpStatus.BAD_REQUEST),
    SELF_TRANSFER(2001, "error.SELF_TRANSFER", HttpStatus.BAD_REQUEST),
    PIN_VERIFICATION_FAILED(2002, "error.PIN_VERIFICATION_FAILED", HttpStatus.BAD_REQUEST),
    DUPLICATE_TRANSACTION(2003, "error.DUPLICATE_TRANSACTION", HttpStatus.CONFLICT),
    SENDER_LOCKED(2004, "error.SENDER_LOCKED", HttpStatus.FORBIDDEN),
    RECIPIENT_LOCKED(2008, "error.RECIPIENT_LOCKED", HttpStatus.BAD_REQUEST),
    TRANSFER_FAILED(2005, "error.TRANSFER_FAILED", HttpStatus.INTERNAL_SERVER_ERROR),
    TRANSACTION_NOT_FOUND(2006, "error.TRANSACTION_NOT_FOUND", HttpStatus.NOT_FOUND),
    ACCESS_DENIED(2009, "error.ACCESS_DENIED", HttpStatus.FORBIDDEN),
    TOPUP_INVALID_SIGNATURE(2010, "error.TOPUP_INVALID_SIGNATURE", HttpStatus.BAD_REQUEST),
    TOPUP_AMOUNT_MISMATCH(2011, "error.TOPUP_AMOUNT_MISMATCH", HttpStatus.BAD_REQUEST),
    TOPUP_FAILED(2012, "error.TOPUP_FAILED", HttpStatus.INTERNAL_SERVER_ERROR),
    KYC_NOT_VERIFIED(2013, "error.KYC_NOT_VERIFIED", HttpStatus.FORBIDDEN),
    ;

    ErrorCode(int code, String messageKey, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.messageKey = messageKey;
        this.httpStatusCode = httpStatusCode;
    }

    private int code;
    private String messageKey;
    private HttpStatusCode httpStatusCode;
}
