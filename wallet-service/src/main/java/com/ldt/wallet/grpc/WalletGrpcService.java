package com.ldt.wallet.grpc;

import com.ldt.wallet.dto.request.WalletTopupRequest;
import com.ldt.wallet.dto.request.WalletTransferRequest;
import com.ldt.wallet.dto.request.WalletTransferWithFeeRequest;
import com.ldt.wallet.model.LedgerReason;
import com.ldt.wallet.service.WalletService;
import com.ldt.wallet.service.WalletTopupService;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * gRPC endpoint InternalService
 */
@GrpcService
@RequiredArgsConstructor
public class WalletGrpcService extends WalletInternalServiceGrpc.WalletInternalServiceImplBase {

    private final WalletService walletService;
    private final WalletTopupService walletTopupService;

    @Override
    public void transfer(TransferRequest request, StreamObserver<WalletOpReply> responseObserver) {
        WalletTransferRequest dto = new WalletTransferRequest();
        dto.setFromUserId(UUID.fromString(request.getFromUserId()));
        dto.setToUserId(UUID.fromString(request.getToUserId()));
        dto.setAmount(new BigDecimal(request.getAmount()));
        dto.setTransactionId(UUID.fromString(request.getTransactionId()));
        dto.setReason(parseReason(request.getReason()));
        dto.setNote(emptyToNull(request.getNote()));
        reply(responseObserver, walletService.transfer(dto));
    }

    @Override
    public void transferWithFee(TransferWithFeeRequest request, StreamObserver<WalletOpReply> responseObserver) {
        WalletTransferWithFeeRequest dto = new WalletTransferWithFeeRequest();
        dto.setFromUserId(UUID.fromString(request.getFromUserId()));
        dto.setToUserId(UUID.fromString(request.getToUserId()));
        dto.setPlatformUserId(UUID.fromString(request.getPlatformUserId()));
        dto.setAmount(new BigDecimal(request.getAmount()));
        dto.setFee(new BigDecimal(request.getFee()));
        dto.setTransactionId(UUID.fromString(request.getTransactionId()));
        dto.setNote(emptyToNull(request.getNote()));
        reply(responseObserver, walletService.transferWithFee(dto));
    }

    @Override
    public void topup(TopupRequest request, StreamObserver<WalletOpReply> responseObserver) {
        WalletTopupRequest dto = new WalletTopupRequest();
        dto.setToUserId(UUID.fromString(request.getToUserId()));
        dto.setAmount(new BigDecimal(request.getAmount()));
        dto.setTransactionId(UUID.fromString(request.getTransactionId()));
        dto.setNote(emptyToNull(request.getNote()));
        reply(responseObserver, walletTopupService.topup(dto));
    }

    private void reply(StreamObserver<WalletOpReply> observer, String status) {
        observer.onNext(WalletOpReply.newBuilder().setStatus(status).build());
        observer.onCompleted();
    }

    private static LedgerReason parseReason(String reason) {
        return (reason == null || reason.isBlank()) ? null : LedgerReason.valueOf(reason);
    }

    private static String emptyToNull(String value) {
        return (value == null || value.isEmpty()) ? null : value;
    }
}
