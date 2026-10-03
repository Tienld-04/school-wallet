package com.ldt.transaction.grpc;

import com.ldt.wallet.grpc.TopupRequest;
import com.ldt.wallet.grpc.TransferRequest;
import com.ldt.wallet.grpc.TransferWithFeeRequest;
import com.ldt.wallet.grpc.WalletInternalServiceGrpc;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Client gRPC call wallet-service.
 */
@Component
public class WalletGrpcClient {

    private static final long DEADLINE_SECONDS = 10;

    @GrpcClient("wallet")
    private WalletInternalServiceGrpc.WalletInternalServiceBlockingStub stub;

    private WalletInternalServiceGrpc.WalletInternalServiceBlockingStub stub() {
        return stub.withDeadlineAfter(DEADLINE_SECONDS, TimeUnit.SECONDS);
    }

    public String transfer(UUID fromUserId, UUID toUserId, BigDecimal amount,
                           UUID transactionId, String reason, String note) {
        TransferRequest req = TransferRequest.newBuilder()
                .setFromUserId(fromUserId.toString())
                .setToUserId(toUserId.toString())
                .setAmount(amount.toPlainString())
                .setTransactionId(transactionId.toString())
                .setReason(nullToEmpty(reason))
                .setNote(nullToEmpty(note))
                .build();
        return stub().transfer(req).getStatus();
    }

    public String transferWithFee(UUID fromUserId, UUID toUserId, UUID platformUserId,
                                  BigDecimal amount, BigDecimal fee, UUID transactionId, String note) {
        TransferWithFeeRequest req = TransferWithFeeRequest.newBuilder()
                .setFromUserId(fromUserId.toString())
                .setToUserId(toUserId.toString())
                .setPlatformUserId(platformUserId.toString())
                .setAmount(amount.toPlainString())
                .setFee(fee.toPlainString())
                .setTransactionId(transactionId.toString())
                .setNote(nullToEmpty(note))
                .build();
        return stub().transferWithFee(req).getStatus();
    }

    public String topup(UUID toUserId, BigDecimal amount, UUID transactionId, String note) {
        TopupRequest req = TopupRequest.newBuilder()
                .setToUserId(toUserId.toString())
                .setAmount(amount.toPlainString())
                .setTransactionId(transactionId.toString())
                .setNote(nullToEmpty(note))
                .build();
        return stub().topup(req).getStatus();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
