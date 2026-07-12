package com.ldt.wallet.grpc;

import com.ldt.wallet.exception.AppException;
import com.ldt.wallet.exception.ErrorCode;
import io.grpc.Status;
import net.devh.boot.grpc.server.advice.GrpcAdvice;
import net.devh.boot.grpc.server.advice.GrpcExceptionHandler;

@GrpcAdvice
public class GrpcExceptionAdvice {

    @GrpcExceptionHandler(AppException.class)
    public Status handleAppException(AppException ex) {
        ErrorCode ec = ex.getErrorCode();
        return statusFor(ec).withDescription(ec.getMessage());
    }

    @GrpcExceptionHandler(IllegalArgumentException.class)
    public Status handleIllegalArgument(IllegalArgumentException ex) {
        // UUID/BigDecimal/LedgerReason parse lỗi
        return Status.INVALID_ARGUMENT.withDescription("Dữ liệu không hợp lệ: " + ex.getMessage());
    }

    @GrpcExceptionHandler(Throwable.class)
    public Status handleUnknown(Throwable ex) {
        return Status.INTERNAL.withDescription("Lỗi hệ thống: " + ex.getMessage());
    }

    private static Status statusFor(ErrorCode ec) {
        return switch (ec) {
            case INVALID_AMOUNT, INVALID_REQUEST -> Status.INVALID_ARGUMENT;
            case WALLET_NOT_FOUND -> Status.NOT_FOUND;
            case INSUFFICIENT_BALANCE, WALLET_LOCKED,
                 DAILY_LIMIT_EXCEEDED, MONTHLY_LIMIT_EXCEEDED -> Status.FAILED_PRECONDITION;
            case UNAUTHENTICATED -> Status.UNAUTHENTICATED;
            default -> Status.INTERNAL;
        };
    }
}
