package com.ldt.transaction.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST(1002, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    SELF_TRANSFER(2001, "Bạn không thể tự chuyển tiền cho chính mình!", HttpStatus.BAD_REQUEST),
    PIN_VERIFICATION_FAILED(2002, "Không thể xác thực PIN", HttpStatus.BAD_REQUEST),
    DUPLICATE_TRANSACTION(2003, "Giao dịch đang được xử lí", HttpStatus.CONFLICT),
    RECIPIENT_LOCKED(2004, "Ví bị khóa. Vui lòng nhập lại số điện thoại", HttpStatus.BAD_REQUEST),
    TRANSFER_FAILED(2005, "Chuyển tiền thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    ;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;
}
