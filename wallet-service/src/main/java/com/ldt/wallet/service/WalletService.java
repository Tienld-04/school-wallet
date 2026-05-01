package com.ldt.wallet.service;

import com.ldt.wallet.dto.request.WalletCreateRequest;
import com.ldt.wallet.dto.request.WalletTransferRequest;
import com.ldt.wallet.dto.request.WalletTransferWithFeeRequest;
import com.ldt.wallet.dto.response.BalanceResponse;
import com.ldt.wallet.dto.response.LedgerEntryResponse;
import com.ldt.wallet.dto.response.PageResponse;
import com.ldt.wallet.exception.AppException;
import com.ldt.wallet.exception.ErrorCode;
import com.ldt.wallet.model.LedgerDirection;
import com.ldt.wallet.model.LedgerReason;
import com.ldt.wallet.model.Wallet;
import com.ldt.wallet.model.WalletLedger;
import com.ldt.wallet.model.WalletStatus;
import com.ldt.wallet.model.WalletType;
import com.ldt.wallet.repository.WalletLedgerRepository;
import com.ldt.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;
    private final WalletLedgerRepository walletLedgerRepository;

    @Transactional
    public void createWallet(WalletCreateRequest walletCreateRequest) {
        Wallet wallet = new Wallet();
        wallet.setUserId(walletCreateRequest.getUserId());
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setWalletType(WalletType.USER_WALLET);
        wallet.setStatus(WalletStatus.ACTIVE);
        walletRepository.save(wallet);
    }

    @Transactional
    public String transfer(WalletTransferRequest walletTransferRequest) {
        if (walletTransferRequest.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }
        // Idempotency: nếu transactionId đã được xử lý thì bỏ qua
        UUID transactionId = walletTransferRequest.getTransactionId();
        if (transactionId != null && !walletLedgerRepository.findByTransactionId(transactionId).isEmpty()) {
            return "Chuyển tiền thành công";
        }
        // Lock theo thứ tự UUID nhỏ trước để tránh deadlock khi 2 transfer đồng thời đổi chiều nhau
        UUID fromUserId = walletTransferRequest.getFromUserId();
        UUID toUserId = walletTransferRequest.getToUserId();
        boolean lockFromFirst = fromUserId.compareTo(toUserId) < 0;
        Wallet firstLocked = walletRepository.findByUserIdForUpdate(lockFromFirst ? fromUserId : toUserId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        Wallet secondLocked = walletRepository.findByUserIdForUpdate(lockFromFirst ? toUserId : fromUserId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        Wallet fromWallet = lockFromFirst ? firstLocked : secondLocked;
        Wallet toWallet   = lockFromFirst ? secondLocked : firstLocked;
        if (fromWallet.getStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }
        if (toWallet.getStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }
        // Reset daily/monthly spent nếu sang ngày/tháng mới
        LocalDate today = LocalDate.now();
        if (fromWallet.getLastDailyReset() == null || !fromWallet.getLastDailyReset().equals(today)) {
            fromWallet.setDailySpent(BigDecimal.ZERO);
            fromWallet.setLastDailyReset(today);
        }
        if (fromWallet.getLastMonthlyReset() == null || fromWallet.getLastMonthlyReset().getMonth() != today.getMonth()
                || fromWallet.getLastMonthlyReset().getYear() != today.getYear()) {
            fromWallet.setMonthlySpent(BigDecimal.ZERO);
            fromWallet.setLastMonthlyReset(today);
        }
        // Check hạn mức
        BigDecimal amount = walletTransferRequest.getAmount();
        if (fromWallet.getDailySpent().add(amount).compareTo(fromWallet.getDailyLimit()) > 0) {
            throw new AppException(ErrorCode.DAILY_LIMIT_EXCEEDED);
        }
        if (fromWallet.getMonthlySpent().add(amount).compareTo(fromWallet.getMonthlyLimit()) > 0) {
            throw new AppException(ErrorCode.MONTHLY_LIMIT_EXCEEDED);
        }
        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
        // Snapshot balance trước khi đổi để ghi ledger
        BigDecimal fromBalanceBefore = fromWallet.getBalance();
        BigDecimal toBalanceBefore = toWallet.getBalance();
        BigDecimal fromBalanceAfter = fromBalanceBefore.subtract(amount);
        BigDecimal toBalanceAfter = toBalanceBefore.add(amount);
        // Cập nhật số dư + hạn mức đã dùng
        fromWallet.setBalance(fromBalanceAfter);
        fromWallet.setDailySpent(fromWallet.getDailySpent().add(amount));
        fromWallet.setMonthlySpent(fromWallet.getMonthlySpent().add(amount));
        toWallet.setBalance(toBalanceAfter);
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);
        // Ghi ledger cho cả 2 ví trong cùng DB transaction
        LedgerReason fromReason = walletTransferRequest.getReason() != null
                ? walletTransferRequest.getReason()
                : LedgerReason.TRANSFER_OUT;
        LedgerReason toReason = resolveCounterpartReason(fromReason);
        writeLedger(fromWallet, walletTransferRequest.getTransactionId(), LedgerDirection.DEBIT,
                amount, fromBalanceBefore, fromBalanceAfter, fromReason, walletTransferRequest.getNote());
        writeLedger(toWallet, walletTransferRequest.getTransactionId(), LedgerDirection.CREDIT,
                amount, toBalanceBefore, toBalanceAfter, toReason, walletTransferRequest.getNote());
        return "Chuyển tiền thành công";
    }

    /**
     * Atomic 3-party split: customer DEBIT amount, merchant CREDIT (amount - fee),
     * platform CREDIT fee. Tất cả ghi cùng transactionId trong 1 DB transaction.
     * Edge: nếu platform trùng customer hoặc merchant → skip fee, đi luồng transfer thường.
     */
    @Transactional
    public String transferWithFee(WalletTransferWithFeeRequest req) {
        BigDecimal amount = req.getAmount();
        BigDecimal fee = req.getFee();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }
        if (fee.compareTo(BigDecimal.ZERO) < 0 || fee.compareTo(amount) >= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        UUID transactionId = req.getTransactionId();
        // Idempotency: nếu transactionId đã có ledger thì coi như xong
        if (transactionId != null && !walletLedgerRepository.findByTransactionId(transactionId).isEmpty()) {
            return "Thanh toán thành công";
        }

        UUID fromId = req.getFromUserId();
        UUID toId = req.getToUserId();
        UUID platformId = req.getPlatformUserId();

        // Edge: platform == merchant hoặc platform == customer → skip fee, đi 2-party transfer thường
        if (platformId.equals(toId) || platformId.equals(fromId) || fee.compareTo(BigDecimal.ZERO) == 0) {
            WalletTransferRequest plain = new WalletTransferRequest();
            plain.setFromUserId(fromId);
            plain.setToUserId(toId);
            plain.setAmount(amount);
            plain.setTransactionId(transactionId);
            plain.setReason(LedgerReason.PAYMENT);
            plain.setNote(req.getNote());
            return transfer(plain);
        }

        // 3 ví distinct → lock theo thứ tự UUID ascending
        List<UUID> sortedIds = Stream.of(fromId, toId, platformId).sorted().toList();
        Map<UUID, Wallet> walletMap = new HashMap<>();
        for (UUID id : sortedIds) {
            Wallet w = walletRepository.findByUserIdForUpdate(id)
                    .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
            walletMap.put(id, w);
        }
        Wallet fromWallet = walletMap.get(fromId);
        Wallet toWallet = walletMap.get(toId);
        Wallet platformWallet = walletMap.get(platformId);

        if (fromWallet.getStatus() == WalletStatus.LOCKED
                || toWallet.getStatus() == WalletStatus.LOCKED
                || platformWallet.getStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }

        // Reset daily/monthly cho fromWallet nếu sang ngày/tháng mới
        LocalDate today = LocalDate.now();
        if (fromWallet.getLastDailyReset() == null || !fromWallet.getLastDailyReset().equals(today)) {
            fromWallet.setDailySpent(BigDecimal.ZERO);
            fromWallet.setLastDailyReset(today);
        }
        if (fromWallet.getLastMonthlyReset() == null
                || fromWallet.getLastMonthlyReset().getMonth() != today.getMonth()
                || fromWallet.getLastMonthlyReset().getYear() != today.getYear()) {
            fromWallet.setMonthlySpent(BigDecimal.ZERO);
            fromWallet.setLastMonthlyReset(today);
        }

        // Hạn mức + balance dùng FULL amount (customer chi 100, không phải 90)
        if (fromWallet.getDailySpent().add(amount).compareTo(fromWallet.getDailyLimit()) > 0) {
            throw new AppException(ErrorCode.DAILY_LIMIT_EXCEEDED);
        }
        if (fromWallet.getMonthlySpent().add(amount).compareTo(fromWallet.getMonthlyLimit()) > 0) {
            throw new AppException(ErrorCode.MONTHLY_LIMIT_EXCEEDED);
        }
        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        BigDecimal merchantAmount = amount.subtract(fee);

        BigDecimal fromBefore = fromWallet.getBalance();
        BigDecimal toBefore = toWallet.getBalance();
        BigDecimal platformBefore = platformWallet.getBalance();
        BigDecimal fromAfter = fromBefore.subtract(amount);
        BigDecimal toAfter = toBefore.add(merchantAmount);
        BigDecimal platformAfter = platformBefore.add(fee);

        fromWallet.setBalance(fromAfter);
        fromWallet.setDailySpent(fromWallet.getDailySpent().add(amount));
        fromWallet.setMonthlySpent(fromWallet.getMonthlySpent().add(amount));
        toWallet.setBalance(toAfter);
        platformWallet.setBalance(platformAfter);
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);
        walletRepository.save(platformWallet);

        // 3 ledger entries cùng transactionId
        writeLedger(fromWallet, transactionId, LedgerDirection.DEBIT,
                amount, fromBefore, fromAfter, LedgerReason.PAYMENT, req.getNote());
        writeLedger(toWallet, transactionId, LedgerDirection.CREDIT,
                merchantAmount, toBefore, toAfter, LedgerReason.PAYMENT, req.getNote());
        writeLedger(platformWallet, transactionId, LedgerDirection.CREDIT,
                fee, platformBefore, platformAfter, LedgerReason.PLATFORM_FEE,
                "Phí nền tảng giao dịch " + transactionId);

        return "Thanh toán thành công";
    }

    public PageResponse<LedgerEntryResponse> getMyLedger(String userId, int page, int size) {
        Wallet wallet = walletRepository.findByUserId(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        Page<WalletLedger> ledgerPage = walletLedgerRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getWalletId(), PageRequest.of(page, size));
        List<LedgerEntryResponse> content = ledgerPage.getContent().stream()
                .map(entry -> toLedgerEntryResponse(entry, wallet.getCurrency()))
                .toList();
        return PageResponse.<LedgerEntryResponse>builder()
                .content(content)
                .page(ledgerPage.getNumber())
                .size(ledgerPage.getSize())
                .totalElements(ledgerPage.getTotalElements())
                .totalPages(ledgerPage.getTotalPages())
                .first(ledgerPage.isFirst())
                .last(ledgerPage.isLast())
                .build();
    }

    // get balance wallet for user id
    public BalanceResponse getBalanceByUserId(String userId) {
        Wallet wallet = walletRepository.findByUserId(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        BalanceResponse balanceResponse = BalanceResponse.builder()
                .balance(wallet.getBalance())
                .userId(wallet.getUserId())
                .walletId(wallet.getWalletId())
                .build();
        return balanceResponse;
    }

    private static final Map<LedgerReason, String> REASON_LABELS = Map.of(
            LedgerReason.PAYMENT,       "Thanh toán",
            LedgerReason.TRANSFER_IN,   "Nhận tiền chuyển khoản",
            LedgerReason.TRANSFER_OUT,  "Chuyển tiền đi",
            LedgerReason.TOP_UP,        "Nạp tiền",
            LedgerReason.REFUND,        "Hoàn tiền",
            LedgerReason.PLATFORM_FEE,  "Phí nền tảng"
    );

    private LedgerEntryResponse toLedgerEntryResponse(WalletLedger entry, String currency) {
        boolean isDebit = entry.getDirection() == LedgerDirection.DEBIT;
        BigDecimal signedAmount = isDebit
                ? entry.getAmount().negate()
                : entry.getAmount();
        return LedgerEntryResponse.builder()
                .entryId(entry.getEntryId())
                .transactionId(entry.getTransactionId())
                .direction(entry.getDirection().name())
                .amount(entry.getAmount())
                .signedAmount(signedAmount)
                .currency(currency)
                .balanceBefore(entry.getBalanceBefore())
                .balanceAfter(entry.getBalanceAfter())
                .reason(entry.getReason().name())
                .reasonLabel(REASON_LABELS.getOrDefault(entry.getReason(), entry.getReason().name()))
                .note(entry.getNote())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private void writeLedger(Wallet wallet, UUID transactionId, LedgerDirection direction,
                             BigDecimal amount, BigDecimal balanceBefore, BigDecimal balanceAfter,
                             LedgerReason reason, String note) {
        WalletLedger entry = WalletLedger.builder()
                .walletId(wallet.getWalletId())
                .transactionId(transactionId)
                .direction(direction)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .reason(reason)
                .note(note)
                .build();
        walletLedgerRepository.save(entry);
    }

    /**
     * Từ reason của ví trừ tiền → suy ra reason cho ví nhận tiền.
     * TRANSFER_OUT → TRANSFER_IN (P2P).
     * PAYMENT → PAYMENT (merchant nhận tiền thanh toán).
     */
    private LedgerReason resolveCounterpartReason(LedgerReason fromReason) {
        return switch (fromReason) {
            case TRANSFER_OUT -> LedgerReason.TRANSFER_IN;
            case PAYMENT      -> LedgerReason.PAYMENT;
            case TOP_UP       -> LedgerReason.TOP_UP;
            default           -> LedgerReason.TRANSFER_IN;
        };
    }
}
