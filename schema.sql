-- =============================================================================
-- SCHOOL WALLET - DATABASE SCHEMA
-- Sinh từ các JPA Entity, PostgreSQL syntax
-- Mỗi service có database riêng, không có cross-service FK
-- =============================================================================


-- =============================================================================
-- USER-SERVICE DATABASE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bảng users: Tài khoản người dùng trong hệ thống
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    user_id         UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    full_name       VARCHAR(100)    NOT NULL,                            -- Họ và tên đầy đủ
    phone           VARCHAR(10)     NOT NULL,                            -- Số điện thoại (10 chữ số), unique
    email           VARCHAR(100)    NOT NULL,                            -- Địa chỉ email, unique
    password        VARCHAR(255)    NOT NULL,                            -- Mật khẩu đã hash (BCrypt)
    role            VARCHAR(20)     NOT NULL DEFAULT 'USER',             -- Vai trò: USER | ADMIN
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',           -- Trạng thái: ACTIVE | LOCKED
    last_login_at   TIMESTAMP,                                           -- Thời điểm đăng nhập gần nhất
    failed_login_count INT          NOT NULL DEFAULT 0,                  -- Số lần đăng nhập sai liên tiếp

    -- Bảo mật PIN giao dịch
    transaction_pin_hash VARCHAR(255) NOT NULL,                          -- PIN giao dịch đã hash (BCrypt)
    pin_failed_attempts  INT        NOT NULL DEFAULT 0,                  -- Số lần nhập PIN sai liên tiếp
    pin_locked_until     TIMESTAMP,                                      -- Thời điểm mở khóa PIN (null = chưa khóa)

    -- Audit
    created_at      TIMESTAMP       NOT NULL,                            -- Thời điểm tạo bản ghi (tự động)
    updated_at      TIMESTAMP       NOT NULL,                            -- Thời điểm cập nhật gần nhất (tự động)
    create_by       VARCHAR(255),                                        -- ID người tạo (Spring Security context)
    update_by       VARCHAR(255),                                        -- ID người cập nhật gần nhất

    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED'))
);

COMMENT ON TABLE users IS 'Tài khoản người dùng trong hệ thống school wallet';


-- -----------------------------------------------------------------------------
-- Bảng merchants: Nhà cung cấp dịch vụ trong trường (căn tin, thư viện...)
-- Mỗi merchant thuộc về 1 user (người quản lý)
-- -----------------------------------------------------------------------------
CREATE TABLE merchants (
    merchant_id     UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    name            VARCHAR(100)    NOT NULL,                            -- Tên merchant / cơ sở dịch vụ
    type            VARCHAR(50)     NOT NULL,                            -- Loại hình: CANTEEN | PARKING | PRINTING | LIBRARY | BOOKSTORE | CLUB | EVENT | OTHER
    user_id         UUID            NOT NULL,                            -- FK → users.user_id (người quản lý merchant)
    active          BOOLEAN         NOT NULL DEFAULT TRUE,               -- Trạng thái hoạt động (true = đang mở)

    -- Audit
    created_at      TIMESTAMP       NOT NULL,                            -- Thời điểm tạo bản ghi (tự động)
    updated_at      TIMESTAMP       NOT NULL,                            -- Thời điểm cập nhật gần nhất (tự động)
    create_by       VARCHAR(255),                                        -- ID người tạo
    update_by       VARCHAR(255),                                        -- ID người cập nhật gần nhất

    CONSTRAINT pk_merchants PRIMARY KEY (merchant_id),
    CONSTRAINT fk_merchants_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT chk_merchants_type CHECK (type IN ('CANTEEN','PARKING','PRINTING','LIBRARY','BOOKSTORE','CLUB','EVENT','OTHER'))
);

COMMENT ON TABLE merchants IS 'Nhà cung cấp dịch vụ trong trường học';


-- -----------------------------------------------------------------------------
-- Bảng invalidated_tokens: Danh sách JWT token đã bị thu hồi (blacklist)
-- Dùng để xử lý logout trước khi token hết hạn
-- -----------------------------------------------------------------------------
CREATE TABLE invalidated_tokens (
    jti             VARCHAR(255)    NOT NULL,                            -- JWT ID (jti claim) - khóa chính
    expiry_time     TIMESTAMP       NOT NULL,                            -- Thời điểm hết hạn của token gốc (để dọn dẹp cron)

    CONSTRAINT pk_invalidated_tokens PRIMARY KEY (jti)
);

COMMENT ON TABLE invalidated_tokens IS 'Blacklist JWT token đã logout, xóa bản ghi khi quá expiry_time';


-- =============================================================================
-- WALLET-SERVICE DATABASE
-- (Không có FK sang user-service, chỉ lưu user_id dạng UUID reference)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bảng wallets: Ví điện tử của từng người dùng
-- Mỗi user có đúng 1 ví (UNIQUE user_id)
-- -----------------------------------------------------------------------------
CREATE TABLE wallets (
    wallet_id       UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    user_id         UUID            NOT NULL,                            -- Tham chiếu tới users.user_id (không FK cross-service)
    balance         NUMERIC(18,2)   NOT NULL DEFAULT 0.00,               -- Số dư hiện tại (VND), không âm
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',           -- Trạng thái ví: ACTIVE | LOCKED
    wallet_type     VARCHAR(20)     NOT NULL DEFAULT 'USER_WALLET',      -- Loại ví: USER_WALLET | ADMIN_WALLET | MERCHANT_WALLET

    -- Giới hạn chi tiêu
    daily_limit     NUMERIC(18,2)   DEFAULT 5000000.00,                  -- Hạn mức chi tiêu trong ngày (VND)
    monthly_limit   NUMERIC(18,2)   DEFAULT 30000000.00,                 -- Hạn mức chi tiêu trong tháng (VND)

    -- Theo dõi chi tiêu thực tế
    daily_spent     NUMERIC(18,2)   DEFAULT 0.00,                        -- Số tiền đã chi trong ngày hiện tại
    last_daily_reset DATE,                                               -- Ngày reset daily_spent gần nhất
    monthly_spent   NUMERIC(18,2)   DEFAULT 0.00,                        -- Số tiền đã chi trong tháng hiện tại
    last_monthly_reset DATE,                                             -- Tháng reset monthly_spent gần nhất

    currency        VARCHAR(3)      NOT NULL DEFAULT 'VND',              -- Đơn vị tiền tệ (mặc định VND)

    -- Audit
    created_at      TIMESTAMP       NOT NULL,                            -- Thời điểm tạo ví (tự động)
    updated_at      TIMESTAMP       NOT NULL,                            -- Thời điểm cập nhật gần nhất (tự động)

    CONSTRAINT pk_wallets PRIMARY KEY (wallet_id),
    CONSTRAINT uq_wallets_user_id UNIQUE (user_id),
    CONSTRAINT chk_wallets_status CHECK (status IN ('ACTIVE', 'LOCKED')),
    CONSTRAINT chk_wallets_type CHECK (wallet_type IN ('USER_WALLET', 'ADMIN_WALLET', 'MERCHANT_WALLET')),
    CONSTRAINT chk_wallets_balance CHECK (balance >= 0)
);

COMMENT ON TABLE wallets IS 'Ví điện tử của người dùng, mỗi user có đúng 1 ví';


-- -----------------------------------------------------------------------------
-- Bảng wallet_ledger: Sổ cái kép (double-entry) cho mọi biến động số dư
-- Ghi lại từng lần tiền vào/ra, dùng để đối soát và audit trail
-- -----------------------------------------------------------------------------
CREATE TABLE wallet_ledger (
    entry_id        UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    wallet_id       UUID            NOT NULL,                            -- Ví bị ảnh hưởng (FK → wallets.wallet_id)
    transaction_id  UUID,                                                -- Tham chiếu giao dịch (nullable: TOP_UP/ADJUSTMENT có thể không có)
    direction       VARCHAR(10)     NOT NULL,                            -- Chiều tiền: DEBIT (tiền ra) | CREDIT (tiền vào)
    amount          NUMERIC(18,2)   NOT NULL,                            -- Số tiền biến động (luôn dương)
    balance_before  NUMERIC(18,2)   NOT NULL,                            -- Số dư ví trước khi thực hiện
    balance_after   NUMERIC(18,2)   NOT NULL,                            -- Số dư ví sau khi thực hiện
    reason          VARCHAR(20)     NOT NULL,                            -- Lý do: PAYMENT | TRANSFER_IN | TRANSFER_OUT | TOP_UP | REFUND
    note            VARCHAR(255),                                        -- Ghi chú tự do (tuỳ chọn)
    created_at      TIMESTAMP       NOT NULL,                            -- Thời điểm ghi sổ (tự động, không sửa được)

    CONSTRAINT pk_wallet_ledger PRIMARY KEY (entry_id),
    CONSTRAINT fk_ledger_wallet FOREIGN KEY (wallet_id) REFERENCES wallets (wallet_id),
    CONSTRAINT chk_ledger_direction CHECK (direction IN ('DEBIT', 'CREDIT')),
    CONSTRAINT chk_ledger_reason CHECK (reason IN ('PAYMENT','TRANSFER_IN','TRANSFER_OUT','TOP_UP','REFUND')),
    CONSTRAINT chk_ledger_amount CHECK (amount > 0)
);

COMMENT ON TABLE wallet_ledger IS 'Sổ cái kép ghi lại mọi biến động số dư ví, dùng cho audit và đối soát';

-- Index wallet_ledger
CREATE INDEX idx_wallet_ledger_wallet_id      ON wallet_ledger (wallet_id);
CREATE INDEX idx_wallet_ledger_transaction_id ON wallet_ledger (transaction_id);
CREATE INDEX idx_wallet_ledger_created_at     ON wallet_ledger (created_at);


-- =============================================================================
-- TRANSACTION-SERVICE DATABASE
-- (Không có FK cross-service, lưu user_id/merchant_id dạng UUID reference)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bảng transactions: Bảng chính lưu toàn bộ giao dịch
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id  UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    request_id      VARCHAR(255)    NOT NULL,                            -- ID idempotency do FE gửi, mỗi hành động chuyển tiền là 1 giá trị duy nhất

    -- Bên gửi
    from_user_id    UUID            NOT NULL,                            -- UUID người gửi (tham chiếu users.user_id)
    from_phone      VARCHAR(15),                                         -- SĐT người gửi (snapshot tại thời điểm giao dịch)
    from_full_name  VARCHAR(100),                                        -- Họ tên người gửi (snapshot)

    -- Bên nhận
    to_user_id      UUID            NOT NULL,                            -- UUID người nhận (tham chiếu users.user_id)
    to_phone        VARCHAR(15),                                         -- SĐT người nhận (snapshot)
    to_full_name    VARCHAR(100),                                        -- Họ tên người nhận (snapshot)

    amount          NUMERIC(18,2)   NOT NULL,                            -- Số tiền giao dịch (VND)
    transaction_type VARCHAR(30)    NOT NULL,                            -- Loại giao dịch: TOPUP | TRANSFER | PAYMENT
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',          -- Trạng thái: PENDING | SUCCESS | FAILED | CANCELLED

    -- Thanh toán merchant
    merchant_id     UUID,                                                -- UUID merchant (chỉ dùng khi type = PAYMENT, nullable)

    description     TEXT,                                                -- Nội dung / ghi chú giao dịch

    -- Audit
    created_at      TIMESTAMP       NOT NULL,                            -- Thời điểm khởi tạo giao dịch (tự động)
    updated_at      TIMESTAMP       NOT NULL,                            -- Thời điểm cập nhật gần nhất (tự động)
    create_by       VARCHAR(255),                                        -- ID người tạo
    update_by       VARCHAR(255),                                        -- ID người cập nhật gần nhất

    CONSTRAINT pk_transactions PRIMARY KEY (transaction_id),
    CONSTRAINT uq_transactions_request_id UNIQUE (request_id),
    CONSTRAINT chk_transactions_type CHECK (transaction_type IN ('TOPUP', 'TRANSFER', 'PAYMENT')),
    CONSTRAINT chk_transactions_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
    CONSTRAINT chk_transactions_amount CHECK (amount > 0)
);

COMMENT ON TABLE transactions IS 'Bảng chính lưu toàn bộ giao dịch tài chính trong hệ thống';

-- Index transactions
CREATE INDEX idx_from_user_id ON transactions (from_user_id);
CREATE INDEX idx_to_user_id   ON transactions (to_user_id);
CREATE INDEX idx_created_at   ON transactions (created_at);


-- -----------------------------------------------------------------------------
-- Bảng transaction_status_history: Lịch sử chuyển trạng thái của giao dịch
-- Audit trail cho mọi lần status thay đổi
-- -----------------------------------------------------------------------------
CREATE TABLE transaction_status_history (
    history_id      UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    transaction_id  UUID            NOT NULL,                            -- Giao dịch liên quan (FK → transactions.transaction_id)
    from_status     VARCHAR(20),                                         -- Trạng thái cũ (null nếu là bản ghi đầu tiên)
    to_status       VARCHAR(20)     NOT NULL,                            -- Trạng thái mới: PENDING | SUCCESS | FAILED | CANCELLED
    reason          VARCHAR(500),                                        -- Lý do chuyển trạng thái (tuỳ chọn)
    changed_at      TIMESTAMP       NOT NULL,                            -- Thời điểm chuyển trạng thái (@PrePersist)

    CONSTRAINT pk_transaction_status_history PRIMARY KEY (history_id),
    CONSTRAINT fk_tsh_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id),
    CONSTRAINT chk_tsh_from_status CHECK (from_status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
    CONSTRAINT chk_tsh_to_status CHECK (to_status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'))
);

COMMENT ON TABLE transaction_status_history IS 'Audit trail lịch sử thay đổi trạng thái giao dịch';

-- Index transaction_status_history
CREATE INDEX idx_tsh_transaction_id ON transaction_status_history (transaction_id);
CREATE INDEX idx_tsh_changed_at     ON transaction_status_history (changed_at);


-- =============================================================================
-- NOTIFICATION-SERVICE DATABASE
-- (Không có FK cross-service)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bảng notification: Thông báo hiển thị trong app cho người dùng
-- -----------------------------------------------------------------------------
CREATE TABLE notification (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    user_id             UUID            NOT NULL,                            -- UUID người nhận thông báo

    title               VARCHAR(255)    NOT NULL,                            -- Tiêu đề thông báo
    description         VARCHAR(500),                                        -- Nội dung chi tiết thông báo

    type                VARCHAR(20)     NOT NULL,                            -- Loại thông báo: TRANSACTION | SYSTEM

    -- Thông tin giao dịch liên quan (nullable nếu type = SYSTEM)
    transaction_id      UUID,                                                -- UUID giao dịch liên quan
    transaction_type    VARCHAR(50),                                         -- Loại giao dịch (TOPUP/TRANSFER/PAYMENT)
    amount              NUMERIC(19,2),                                       -- Số tiền giao dịch
    direction           VARCHAR(10),                                         -- Chiều tiền: DEBIT (tiền ra) | CREDIT (tiền vào)
    counterparty_name   VARCHAR(255),                                        -- Tên đối tác giao dịch (người gửi/nhận)
    counterparty_phone  VARCHAR(20),                                         -- SĐT đối tác giao dịch
    transaction_status  VARCHAR(30),                                         -- Trạng thái giao dịch tại thời điểm notify

    is_read             BOOLEAN         NOT NULL DEFAULT FALSE,              -- Trạng thái đọc: false = chưa đọc
    created_at          TIMESTAMP       NOT NULL,                            -- Thời điểm tạo thông báo (@PrePersist)

    CONSTRAINT pk_notification PRIMARY KEY (id),
    CONSTRAINT chk_notification_type CHECK (type IN ('TRANSACTION', 'SYSTEM')),
    CONSTRAINT chk_notification_direction CHECK (direction IN ('DEBIT', 'CREDIT'))
);

COMMENT ON TABLE notification IS 'Thông báo in-app hiển thị cho người dùng';

-- Index notification
CREATE INDEX idx_notification_user_id    ON notification (user_id);
CREATE INDEX idx_notification_created_at ON notification (created_at);


-- -----------------------------------------------------------------------------
-- Bảng notification_log: Log kỹ thuật cho việc gửi thông báo qua Email/SMS
-- Ghi lại kết quả của từng lần gửi (thành công / thất bại)
-- -----------------------------------------------------------------------------
CREATE TABLE notification_log (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),  -- Khóa chính, UUID tự sinh
    channel         VARCHAR(10)     NOT NULL,                            -- Kênh gửi: EMAIL | SMS
    recipient       VARCHAR(255)    NOT NULL,                            -- Địa chỉ nhận (email hoặc số điện thoại)
    user_id         UUID,                                                -- UUID người dùng liên quan (tuỳ chọn)

    -- Thông tin giao dịch liên quan
    transaction_id  UUID,                                                -- UUID giao dịch liên quan
    transaction_type VARCHAR(50),                                        -- Loại giao dịch
    amount          NUMERIC(19,2),                                       -- Số tiền giao dịch
    direction       VARCHAR(10),                                         -- Chiều tiền: DEBIT | CREDIT

    source          VARCHAR(20)     NOT NULL,                            -- Nguồn kích hoạt: TRANSACTION | INTERNAL
    status          VARCHAR(10)     NOT NULL,                            -- Kết quả gửi: SENT | FAILED
    error_message   VARCHAR(500),                                        -- Chi tiết lỗi nếu gửi thất bại
    created_at      TIMESTAMP       NOT NULL,                            -- Thời điểm ghi log (@PrePersist)

    CONSTRAINT pk_notification_log PRIMARY KEY (id),
    CONSTRAINT chk_nlog_channel CHECK (channel IN ('EMAIL', 'SMS')),
    CONSTRAINT chk_nlog_direction CHECK (direction IN ('DEBIT', 'CREDIT')),
    CONSTRAINT chk_nlog_source CHECK (source IN ('TRANSACTION', 'INTERNAL')),
    CONSTRAINT chk_nlog_status CHECK (status IN ('SENT', 'FAILED'))
);

COMMENT ON TABLE notification_log IS 'Log kỹ thuật ghi lại kết quả gửi thông báo qua Email/SMS';

-- Index notification_log
CREATE INDEX idx_nlog_transaction_id ON notification_log (transaction_id);
CREATE INDEX idx_nlog_user_id        ON notification_log (user_id);
CREATE INDEX idx_nlog_created_at     ON notification_log (created_at);
