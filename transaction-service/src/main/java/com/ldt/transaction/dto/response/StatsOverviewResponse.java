package com.ldt.transaction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
public class StatsOverviewResponse {
    private long totalTransactions;       
    private BigDecimal totalVolume;       
    private BigDecimal totalFee;          
    private long successCount;            
    private long failedCount;             
    private double successRate;          

    private Map<String, Long> byType;     
    private Map<String, Long> byStatus;   
}
