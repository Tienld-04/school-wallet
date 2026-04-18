package com.ldt.notification.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST(2000, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(2001, "Mã OTP đã hết hạn", HttpStatus.BAD_REQUEST),
    OTP_INVALID(2002, "Mã OTP không đúng", HttpStatus.BAD_REQUEST),
    OTP_MAX_ATTEMPTS(2003, "Nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới", HttpStatus.BAD_REQUEST),
    OTP_RESEND_TOO_SOON(2004, "Vui lòng chờ trước khi yêu cầu mã mới", HttpStatus.TOO_MANY_REQUESTS),
    OTP_SEND_FAILED(2005, "Gửi mã OTP thất bại", HttpStatus.INTERNAL_SERVER_ERROR);

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;
}
