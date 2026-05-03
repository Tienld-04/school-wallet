package com.ldt.transaction.controller;

import com.ldt.transaction.context.UserContext;
import com.ldt.transaction.dto.response.PageResponse;
import com.ldt.transaction.dto.request.TransactionHistoryRequest;
import com.ldt.transaction.dto.response.RecentTransactionResponse;
import com.ldt.transaction.dto.response.StatsOverviewResponse;
import com.ldt.transaction.dto.response.TimeSeriesPoint;
import com.ldt.transaction.dto.response.TransactionDetailResponse;
import com.ldt.transaction.dto.response.TransactionHistoryResponse;
import com.ldt.transaction.dto.response.TransactionStatusHistoryResponse;
import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.dto.payment.PaymentRequest;
import com.ldt.transaction.dto.topup.InitiateTopupRequest;
import com.ldt.transaction.dto.topup.InitiateTopupResponse;
import com.ldt.transaction.dto.topup.TopupStatusResponse;
import com.ldt.transaction.dto.topup.VnPayIpnResponse;
import com.ldt.transaction.exception.AppException;
import com.ldt.transaction.exception.ErrorCode;
import com.ldt.transaction.model.TransactionType;
import com.ldt.transaction.service.topup.TopupService;
import com.ldt.transaction.service.TransactionService;
import com.ldt.transaction.service.TransactionService2;
import com.ldt.transaction.service.TransactionStatsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    private final TransactionService2 transactionService2;
    private final TransactionStatsService transactionStatsService;
    private final TopupService topupService;

    // V2: dùng TransactionService2 
    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(
            @Valid @RequestBody TransferRequest transferRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService2.transfer(transferRequest, fromPhone, TransactionType.TRANSFER));
    }

    @PostMapping("/merchant/payment")
    public ResponseEntity<TransactionResponse> merchantPayment(
            @Valid @RequestBody PaymentRequest paymentRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService2.merchantPayment(paymentRequest, fromPhone));
    }
    // TODO: FE chưa dùng — bỏ comment khi cần
    // @PostMapping("/payment")
    // public ResponseEntity<TransactionResponse> payment(
    //         @Valid @RequestBody TransferRequest transferRequest,
    //         @RequestHeader("X-User-Phone") String fromPhone) {
    //     return ResponseEntity.ok(transactionService2.transfer(transferRequest, fromPhone, TransactionType.PAYMENT));
    // }

    // TODO: FE chưa dùng — bỏ comment khi cần
    // @PostMapping("/topup")
    // public ResponseEntity<TransactionResponse> topup(
    //         @Valid @RequestBody TransferRequest transferRequest,
    //         @RequestHeader("X-User-Phone") String fromPhone) {
    //     return ResponseEntity.ok(transactionService2.transfer(transferRequest, fromPhone, TransactionType.TOPUP));
    // }

    // V1 code cũ - bỏ comment để revert
    /*
    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(
            @Valid @RequestBody TransferRequest transferRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.transfer(transferRequest, fromPhone, TransactionType.TRANSFER));
    }

    @PostMapping("/payment")
    public ResponseEntity<TransactionResponse> payment(
            @Valid @RequestBody TransferRequest transferRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.transfer(transferRequest, fromPhone, TransactionType.PAYMENT));
    }

    @PostMapping("/topup")
    public ResponseEntity<TransactionResponse> topup(
            @Valid @RequestBody TransferRequest transferRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.transfer(transferRequest, fromPhone, TransactionType.TOPUP));
    }

    @PostMapping("/merchant/payment")
    public ResponseEntity<TransactionResponse> merchantPayment(
            @Valid @RequestBody PaymentRequest paymentRequest,
            @RequestHeader("X-User-Phone") String fromPhone) {
        return ResponseEntity.ok(transactionService.merchantPayment(paymentRequest, fromPhone));
    }
    */

    @GetMapping("/recent")
    public ResponseEntity<List<RecentTransactionResponse>> getRecentTransactions() {
        String userId = UserContext.getUserId();
        return ResponseEntity.ok(transactionService.getRecentTransactions(userId));
    }

    @PostMapping("/history")
    public ResponseEntity<PageResponse<TransactionHistoryResponse>> getTransactionHistory(
            @RequestBody TransactionHistoryRequest request) {
        String userId = UserContext.getUserId();
        return ResponseEntity.ok(transactionService.getTransactionHistory(userId, request.getPage(), request.getSize()));
    }

    @GetMapping("/detail/{transactionId}")
    public ResponseEntity<TransactionDetailResponse> getTransactionDetail(
            @PathVariable UUID transactionId) {
        return ResponseEntity.ok(transactionService.getTransactionDetail(transactionId));
    }

    @GetMapping("/{transactionId}/status-history")
    public ResponseEntity<List<TransactionStatusHistoryResponse>> getStatusHistory(
            @PathVariable UUID transactionId) {
        return ResponseEntity.ok(transactionService.getStatusHistory(transactionId));
    }

    /**
     * Admin dashboard — số liệu tổng quan giao dịch trong [from, to].
     */
    @GetMapping("/dashboard/overview")
    public ResponseEntity<StatsOverviewResponse> getDashboardOverview(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (!"ADMIN".equals(UserContext.getRole())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        LocalDate today = LocalDate.now();
        LocalDate fromDate = from != null ? from : today.minusDays(29);
        LocalDate toDate = to != null ? to : today;
        //
        LocalDateTime fromDt = fromDate.atStartOfDay();
        LocalDateTime toDt = toDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(transactionStatsService.getOverview(fromDt, toDt));
    }

    /**
     * Admin dashboard — biểu đồ time-series giao dịch trong [from, to] theo granularity (day/week/month).
     */
    @GetMapping("/dashboard/timeseries")
    public ResponseEntity<List<TimeSeriesPoint>> getDashboardTimeSeries(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "day") String granularity) {
        if (!"ADMIN".equals(UserContext.getRole())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        LocalDate today = LocalDate.now();
        LocalDate fromDate = from != null ? from : today.minusDays(29);
        LocalDate toDate = to != null ? to : today;
        LocalDateTime fromDt = fromDate.atStartOfDay();
        LocalDateTime toDt = toDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(transactionStatsService.getTimeSeries(fromDt, toDt, granularity));
    }

    // VNPay TopUp endpoints
    @PostMapping("/topup/initiate")
    public ResponseEntity<InitiateTopupResponse> initiateTopup(
            @Valid @RequestBody InitiateTopupRequest request,
            HttpServletRequest httpRequest) {
        String userId = UserContext.getUserId();
        String userPhone = UserContext.getUserPhone();
        String ipAddr = resolveClientIp(httpRequest);
        return ResponseEntity.ok(topupService.initiateTopup(request, userId, userPhone, ipAddr));
    }

    @GetMapping("/topup/status")
    public ResponseEntity<TopupStatusResponse> getTopupStatus(@RequestParam String requestId) {
        String userId = UserContext.getUserId();
        return ResponseEntity.ok(topupService.getStatus(requestId, userId));
    }

    @GetMapping(value = "/topup/ipn", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VnPayIpnResponse> handleVnpayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(topupService.handleIpn(params));
    }

    private String resolveClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        String ip;
        if (xff != null && !xff.isBlank()) {
            // production - behind proxy
            int comma = xff.indexOf(',');
            ip = comma > 0 ? xff.substring(0, comma).trim() : xff.trim();
        } else {
            // Test local
            String remote = req.getRemoteAddr();
            ip = remote != null ? remote : "127.0.0.1";
        }
        if (ip.contains(":")) {
            return "127.0.0.1";
        }
        return ip;
    }
}
