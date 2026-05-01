package com.ldt.transaction.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;


@Data
@Builder
@AllArgsConstructor
public class TimeSeriesPoint {
    private String period;      
    private long count;           
    private BigDecimal volume;    
}
