package com.ldt.wallet.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LedgerEntryResponse {
    private UUID entryId;

    /** Tham chiếu sang transaction-service để FE drill-down chi tiết giao dịch. */
    private UUID transactionId;

    /** DEBIT (tiền ra) hoặc CREDIT (tiền vào). */
    private String direction;

    /** Số tiền luôn dương — dùng để hiển thị giá trị tuyệt đối. */
    private BigDecimal amount;

    /**
     * Số tiền có dấu: âm nếu DEBIT, dương nếu CREDIT.
     * FE dùng để render màu đỏ/xanh và dấu +/- mà không cần logic phía client.
     */
    private BigDecimal signedAmount;

    private String currency;

    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;

    /** Mã lý do giao dịch (PAYMENT, TRANSFER_IN, TRANSFER_OUT, TOP_UP, REFUND, ADJUSTMENT). */
    private String reason;

    /** Nhãn tiếng Việt tương ứng — FE hiển thị trực tiếp, không cần map lại. */
    private String reasonLabel;

    /** Mô tả do người dùng hoặc hệ thống điền, có thể null. */
    private String note;

    private LocalDateTime createdAt;
}
