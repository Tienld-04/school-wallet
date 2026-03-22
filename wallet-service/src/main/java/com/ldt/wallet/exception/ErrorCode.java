package com.ldt.wallet.exception;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZEO_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "Người dùng chưa được xác thực.", HttpStatus.UNAUTHORIZED),

    INVALID_AMOUNT(1002, "Số tiền phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    WALLET_NOT_FOUND(1003, "Ví không tồn tại", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE(1004, "Số dư không đủ", HttpStatus.BAD_REQUEST);
    ;
    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.message = message;
        this.code = code;
        this.httpStatusCode = httpStatusCode;
    }
    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;

}