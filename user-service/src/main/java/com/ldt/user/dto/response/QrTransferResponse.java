package com.ldt.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Response trả về cho FE, chứa chuỗi JSON đã ký.
 * FE dùng qrContent để render thành ảnh QR (thư viện qrcode.js / qr_flutter).
 */
@Getter
@AllArgsConstructor
public class QrTransferResponse {
    private String qrContent;
}
