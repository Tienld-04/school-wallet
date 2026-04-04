package com.ldt.user.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZEO_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "Người dùng chưa được xác thực.", HttpStatus.UNAUTHORIZED),
    INVALID_REQUEST(1002, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    PHONE_ALREADY_EXISTS(1003, "Số điện thoại đã được đăng ký", HttpStatus.BAD_REQUEST),
    EMAIL_ALREADY_EXISTS(1004, "Email đã được đăng ký", HttpStatus.BAD_REQUEST),
    REGISTRATION_FAILED(1005, "Đăng ký thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_NOT_FOUND(1006, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    ACCOUNT_LOCKED(1007, "Tài khoản bị khóa", HttpStatus.FORBIDDEN),
    INVALID_CREDENTIALS(1008, "SĐT hoặc mật khẩu không đúng", HttpStatus.BAD_REQUEST),
    INVALID_PIN(1009, "Mã PIN không đúng", HttpStatus.BAD_REQUEST),
    PIN_LOCKED(1010, "Chức năng chuyển tiền tạm khóa", HttpStatus.FORBIDDEN),
    RECIPIENT_LOCKED(1011, "Tài khoản người nhận đã bị khóa", HttpStatus.BAD_REQUEST),
    QR_INVALID(1012, "Mã QR không hợp lệ", HttpStatus.BAD_REQUEST),
    QR_EXPIRED(1013, "Mã QR đã hết hạn", HttpStatus.BAD_REQUEST),
    QR_INVALID_SYSTEM(1014, "Mã QR không thuộc hệ thống School Wallet", HttpStatus.BAD_REQUEST),
    QR_FORMAT_ERROR(1015, "Định dạng QR không đúng", HttpStatus.BAD_REQUEST),
    QR_SIGN_ERROR(1016, "Lỗi tạo chữ ký QR", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_VERIFICATION_TOKEN(1017, "Token xác thực không hợp lệ", HttpStatus.BAD_REQUEST),
    PHONE_MISMATCH(1018, "Số điện thoại không khớp với token xác thực", HttpStatus.BAD_REQUEST),
    VERIFICATION_EXPIRED(1019, "Phiên xác thực đã hết hạn, vui lòng xác thực lại", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_FOUND(1020, "Email không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    SEND_EMAIL_FAILED(1021, "Gửi email thất bại, vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR);

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.message = message;
        this.code = code;
        this.httpStatusCode = httpStatusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;

}