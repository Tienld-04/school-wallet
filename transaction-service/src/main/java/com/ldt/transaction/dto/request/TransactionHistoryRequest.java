package com.ldt.transaction.dto.request;

import lombok.Data;

@Data
public class TransactionHistoryRequest {
    private int page = 0;
    private int size = 10;
}
