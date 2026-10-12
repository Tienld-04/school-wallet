package com.ldt.wallet.grpc;

import com.ldt.wallet.exception.AppException;
import com.ldt.wallet.exception.ErrorCode;
import com.ldt.wallet.config.i18n.Messages;
import io.grpc.Status;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.advice.GrpcAdvice;
import net.devh.boot.grpc.server.advice.GrpcExceptionHandler;

@GrpcAdvice
@RequiredArgsConstructor
public class GrpcExceptionAdvice {
    private final Messages messages;

    @GrpcExceptionHandler(AppException.class)
    public Status handleAppException(AppException ex) {
        ErrorCode ec = ex.getErrorCode();
        return statusFor(ec).withDescription(messages.getVi(ec.getMessageKey()));
    }

    @GrpcExceptionHandler(IllegalArgumentException.class)
    public Status handleIllegalArgument(IllegalArgumentException ex) {
        // UUID/BigDecimal/LedgerReason parse lỗi
        return Status.INVALID_ARGUMENT.withDescription(messages.getVi("grpc.error.invalid_argument", ex.getMessage()));
    }

    @GrpcExceptionHandler(Throwable.class)
    public Status handleUnknown(Throwable ex) {
        return Status.INTERNAL.withDescription(messages.getVi("grpc.error.internal", ex.getMessage()));
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
