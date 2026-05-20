-- =============================================================================
-- SCHOOL WALLET - UNIFIED ERD SCHEMA (MySQL 8.0+)
-- =============================================================================
-- Phiên bản MySQL của erd-full.sql, dùng để sinh sơ đồ ERD cho báo cáo.
--
-- Khác biệt so với bản PostgreSQL (erd-full.sql):
--   - UUID type → CHAR(36)
--   - gen_random_uuid() → UUID()
--   - BYTEA → LONGBLOB
--   - TIMESTAMP → DATETIME (tránh giới hạn năm 2038)
--   - COMMENT ON TABLE → inline COMMENT
--
-- CẢNH BÁO: Chỉ dùng cho mục đích sinh sơ đồ tài liệu.
--           Production thật chạy PostgreSQL, mỗi service có DB riêng.
--
-- Cách dùng:
--   mysql -u root -p -e "CREATE DATABASE school_wallet_docs CHARACTER SET utf8mb4;"
--   mysql -u root -p school_wallet_docs < erd-full-mysql.sql
--   Mở DataGrip → Generate ERD → Export PNG.
-- =============================================================================


-- =============================================================================
-- PHẦN 1: TẠO BẢNG
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    user_id              CHAR(36)     NOT NULL DEFAULT (UUID()),
    full_name            VARCHAR(100) NOT NULL,
    phone                VARCHAR(10)  NOT NULL,
    email                VARCHAR(100) NOT NULL,
    password             VARCHAR(255) NOT NULL,
    role                 VARCHAR(20)  NOT NULL DEFAULT 'USER',
    status               VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    kyc_status           VARCHAR(20)  NOT NULL DEFAULT 'UNVERIFIED',
    last_login_at        DATETIME,
    failed_login_count   INT          NOT NULL DEFAULT 0,
    transaction_pin_hash VARCHAR(255) NOT NULL,
    pin_failed_attempts  INT          NOT NULL DEFAULT 0,
    pin_locked_until     DATETIME,
    created_at           DATETIME     NOT NULL,
    updated_at           DATETIME     NOT NULL,
    create_by            VARCHAR(255),
    update_by            VARCHAR(255),

    CONSTRAINT pk_users       PRIMARY KEY (user_id),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role       CHECK (role IN ('USER','ADMIN')),
    CONSTRAINT chk_users_status     CHECK (status IN ('ACTIVE','LOCKED')),
    CONSTRAINT chk_users_kyc_status CHECK (kyc_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tài khoản người dùng (user-service)';


-- -----------------------------------------------------------------------------
-- 2. user_kyc
-- -----------------------------------------------------------------------------
CREATE TABLE user_kyc (
    kyc_id            CHAR(36)     NOT NULL DEFAULT (UUID()),
    user_id           CHAR(36)     NOT NULL,
    full_name         VARCHAR(100) NOT NULL,
    date_of_birth     DATE         NOT NULL,
    id_number         VARCHAR(20)  NOT NULL,
    id_issue_date     DATE         NOT NULL,
    id_issue_place    VARCHAR(255) NOT NULL,
    place_of_origin   VARCHAR(255),
    permanent_address VARCHAR(255),
    id_front_url      VARCHAR(500),
    id_back_url       VARCHAR(500),
    id_front_image    LONGBLOB,
    id_back_image     LONGBLOB,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    submitted_at      DATETIME     NOT NULL,
    verified_by       CHAR(36),
    verified_at       DATETIME,
    rejection_reason  VARCHAR(500),
    created_at        DATETIME     NOT NULL,
    updated_at        DATETIME     NOT NULL,

    CONSTRAINT pk_user_kyc         PRIMARY KEY (kyc_id),
    CONSTRAINT uq_user_kyc_user_id UNIQUE (user_id),
    CONSTRAINT chk_user_kyc_status CHECK (status IN ('PENDING','VERIFIED','REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Hồ sơ xác minh danh tính (user-service)';


-- -----------------------------------------------------------------------------
-- 3. merchants
-- -----------------------------------------------------------------------------
CREATE TABLE merchants (
    merchant_id CHAR(36)     NOT NULL DEFAULT (UUID()),
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    user_id     CHAR(36)     NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL,
    updated_at  DATETIME     NOT NULL,
    create_by   VARCHAR(255),
    update_by   VARCHAR(255),

    CONSTRAINT pk_merchants       PRIMARY KEY (merchant_id),
    CONSTRAINT chk_merchants_type CHECK (type IN
        ('CANTEEN','PARKING','PRINTING','LIBRARY','BOOKSTORE','CLUB','EVENT','OTHER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Nhà cung cấp dịch vụ trong trường';


-- -----------------------------------------------------------------------------
-- 4. invalidated_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE invalidated_tokens (
    jti         VARCHAR(255) NOT NULL,
    expiry_time DATETIME     NOT NULL,

    CONSTRAINT pk_invalidated_tokens PRIMARY KEY (jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='JWT blacklist sau logout';


-- -----------------------------------------------------------------------------
-- 5. wallets
-- -----------------------------------------------------------------------------
CREATE TABLE wallets (
    wallet_id          CHAR(36)      NOT NULL DEFAULT (UUID()),
    user_id            CHAR(36)      NOT NULL,
    balance            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    status             VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    wallet_type        VARCHAR(20)   NOT NULL DEFAULT 'USER_WALLET',
    daily_limit        DECIMAL(18,2)          DEFAULT 5000000.00,
    monthly_limit      DECIMAL(18,2)          DEFAULT 30000000.00,
    daily_spent        DECIMAL(18,2)          DEFAULT 0.00,
    last_daily_reset   DATE,
    monthly_spent      DECIMAL(18,2)          DEFAULT 0.00,
    last_monthly_reset DATE,
    currency           VARCHAR(3)    NOT NULL DEFAULT 'VND',
    created_at         DATETIME      NOT NULL,
    updated_at         DATETIME      NOT NULL,

    CONSTRAINT pk_wallets         PRIMARY KEY (wallet_id),
    CONSTRAINT uq_wallets_user_id UNIQUE (user_id),
    CONSTRAINT chk_wallets_status  CHECK (status IN ('ACTIVE','LOCKED')),
    CONSTRAINT chk_wallets_type    CHECK (wallet_type IN ('USER_WALLET','ADMIN_WALLET')),
    CONSTRAINT chk_wallets_balance CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Ví điện tử của người dùng';


-- -----------------------------------------------------------------------------
-- 6. transactions
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id   CHAR(36)      NOT NULL DEFAULT (UUID()),
    request_id       VARCHAR(255)  NOT NULL,
    from_user_id     CHAR(36)      NOT NULL,
    from_phone       VARCHAR(15),
    from_full_name   VARCHAR(100),
    to_user_id       CHAR(36)      NOT NULL,
    to_phone         VARCHAR(15),
    to_full_name     VARCHAR(100),
    amount           DECIMAL(18,2) NOT NULL,
    fee              DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    transaction_type VARCHAR(30)   NOT NULL,
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    merchant_id      CHAR(36),
    description      TEXT,
    created_at       DATETIME      NOT NULL,
    updated_at       DATETIME      NOT NULL,
    create_by        VARCHAR(255),
    update_by        VARCHAR(255),

    CONSTRAINT pk_transactions            PRIMARY KEY (transaction_id),
    CONSTRAINT uq_transactions_request_id UNIQUE (request_id),
    CONSTRAINT chk_transactions_type   CHECK (transaction_type IN ('TOPUP','TRANSFER','PAYMENT')),
    CONSTRAINT chk_transactions_status CHECK (status IN ('PENDING','SUCCESS','FAILED','CANCELLED')),
    CONSTRAINT chk_transactions_amount CHECK (amount > 0),
    CONSTRAINT chk_transactions_fee    CHECK (fee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Giao dịch tài chính';


-- -----------------------------------------------------------------------------
-- 7. wallet_ledger
-- -----------------------------------------------------------------------------
CREATE TABLE wallet_ledger (
    entry_id       CHAR(36)      NOT NULL DEFAULT (UUID()),
    wallet_id      CHAR(36)      NOT NULL,
    transaction_id CHAR(36),
    direction      VARCHAR(10)   NOT NULL,
    amount         DECIMAL(18,2) NOT NULL,
    balance_before DECIMAL(18,2) NOT NULL,
    balance_after  DECIMAL(18,2) NOT NULL,
    reason         VARCHAR(20)   NOT NULL,
    note           VARCHAR(255),
    created_at     DATETIME      NOT NULL,

    CONSTRAINT pk_wallet_ledger     PRIMARY KEY (entry_id),
    CONSTRAINT chk_ledger_direction CHECK (direction IN ('DEBIT','CREDIT')),
    CONSTRAINT chk_ledger_reason    CHECK (reason IN
        ('PAYMENT','TRANSFER_IN','TRANSFER_OUT','TOP_UP','REFUND','PLATFORM_FEE')),
    CONSTRAINT chk_ledger_amount    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sổ sao kê biến động số dư';


-- -----------------------------------------------------------------------------
-- 8. transaction_status_history
-- -----------------------------------------------------------------------------
CREATE TABLE transaction_status_history (
    history_id     CHAR(36)    NOT NULL DEFAULT (UUID()),
    transaction_id CHAR(36)    NOT NULL,
    from_status    VARCHAR(20),
    to_status      VARCHAR(20) NOT NULL,
    reason         VARCHAR(500),
    changed_at     DATETIME    NOT NULL,

    CONSTRAINT pk_transaction_status_history PRIMARY KEY (history_id),
    CONSTRAINT chk_tsh_from_status CHECK (from_status IN ('PENDING','SUCCESS','FAILED','CANCELLED')),
    CONSTRAINT chk_tsh_to_status   CHECK (to_status   IN ('PENDING','SUCCESS','FAILED','CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit lịch sử trạng thái giao dịch';


-- -----------------------------------------------------------------------------
-- 9. notification
-- -----------------------------------------------------------------------------
CREATE TABLE notification (
    id                 CHAR(36)      NOT NULL DEFAULT (UUID()),
    user_id            CHAR(36)      NOT NULL,
    title              VARCHAR(255)  NOT NULL,
    description        VARCHAR(500),
    type               VARCHAR(20)   NOT NULL,
    transaction_id     CHAR(36),
    transaction_type   VARCHAR(50),
    amount             DECIMAL(19,2),
    direction          VARCHAR(10),
    counterparty_name  VARCHAR(255),
    counterparty_phone VARCHAR(20),
    transaction_status VARCHAR(30),
    is_read            BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at         DATETIME      NOT NULL,

    CONSTRAINT pk_notification            PRIMARY KEY (id),
    CONSTRAINT chk_notification_type      CHECK (type IN ('TRANSACTION','SYSTEM')),
    CONSTRAINT chk_notification_direction CHECK (direction IS NULL OR direction IN ('DEBIT','CREDIT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Thông báo in-app';


-- -----------------------------------------------------------------------------
-- 10. notification_log
-- -----------------------------------------------------------------------------
CREATE TABLE notification_log (
    id               CHAR(36)      NOT NULL DEFAULT (UUID()),
    channel          VARCHAR(10)   NOT NULL,
    recipient        VARCHAR(255)  NOT NULL,
    user_id          CHAR(36),
    transaction_id   CHAR(36),
    transaction_type VARCHAR(50),
    amount           DECIMAL(19,2),
    direction        VARCHAR(10),
    source           VARCHAR(20)   NOT NULL,
    status           VARCHAR(10)   NOT NULL,
    error_message    VARCHAR(500),
    created_at       DATETIME      NOT NULL,

    CONSTRAINT pk_notification_log PRIMARY KEY (id),
    CONSTRAINT chk_nlog_channel   CHECK (channel   IN ('EMAIL','SMS')),
    CONSTRAINT chk_nlog_direction CHECK (direction IS NULL OR direction IN ('DEBIT','CREDIT')),
    CONSTRAINT chk_nlog_source    CHECK (source    IN ('TRANSACTION','INTERNAL')),
    CONSTRAINT chk_nlog_status    CHECK (status    IN ('SENT','FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Log gửi email/SMS';


-- =============================================================================
-- PHẦN 2: INDEX
-- =============================================================================

CREATE INDEX idx_wallet_ledger_wallet_id      ON wallet_ledger (wallet_id);
CREATE INDEX idx_wallet_ledger_transaction_id ON wallet_ledger (transaction_id);
CREATE INDEX idx_wallet_ledger_created_at     ON wallet_ledger (created_at);

CREATE INDEX idx_transactions_from_user_id ON transactions (from_user_id);
CREATE INDEX idx_transactions_to_user_id   ON transactions (to_user_id);
CREATE INDEX idx_transactions_created_at   ON transactions (created_at);

CREATE INDEX idx_tsh_transaction_id ON transaction_status_history (transaction_id);
CREATE INDEX idx_tsh_changed_at     ON transaction_status_history (changed_at);

CREATE INDEX idx_notification_user_id    ON notification (user_id);
CREATE INDEX idx_notification_created_at ON notification (created_at);

CREATE INDEX idx_nlog_transaction_id ON notification_log (transaction_id);
CREATE INDEX idx_nlog_user_id        ON notification_log (user_id);
CREATE INDEX idx_nlog_created_at     ON notification_log (created_at);


-- =============================================================================
-- PHẦN 3: FOREIGN KEY CONSTRAINTS
-- =============================================================================


-- -----------------------------------------------------------------------------
-- NHÓM A: FK CỨNG — tồn tại thật trong production (cùng database)
-- -----------------------------------------------------------------------------

ALTER TABLE user_kyc
    ADD CONSTRAINT fk_user_kyc_user
    FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE user_kyc
    ADD CONSTRAINT fk_user_kyc_verifier
    FOREIGN KEY (verified_by) REFERENCES users (user_id);

ALTER TABLE merchants
    ADD CONSTRAINT fk_merchants_user
    FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE wallet_ledger
    ADD CONSTRAINT fk_wallet_ledger_wallet
    FOREIGN KEY (wallet_id) REFERENCES wallets (wallet_id);

ALTER TABLE transaction_status_history
    ADD CONSTRAINT fk_tsh_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id);


-- -----------------------------------------------------------------------------
-- NHÓM B: FK ẢO — chỉ tồn tại trong sơ đồ tài liệu
-- Production = UUID reference, không FK cứng (do khác database)
-- -----------------------------------------------------------------------------

ALTER TABLE wallets
    ADD CONSTRAINT fk_doc_wallets_user
    FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE wallet_ledger
    ADD CONSTRAINT fk_doc_wallet_ledger_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id);

ALTER TABLE transactions
    ADD CONSTRAINT fk_doc_transactions_from_user
    FOREIGN KEY (from_user_id) REFERENCES users (user_id);

ALTER TABLE transactions
    ADD CONSTRAINT fk_doc_transactions_to_user
    FOREIGN KEY (to_user_id) REFERENCES users (user_id);

ALTER TABLE transactions
    ADD CONSTRAINT fk_doc_transactions_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id);

ALTER TABLE notification
    ADD CONSTRAINT fk_doc_notification_user
    FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE notification
    ADD CONSTRAINT fk_doc_notification_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id);

ALTER TABLE notification_log
    ADD CONSTRAINT fk_doc_notification_log_user
    FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE notification_log
    ADD CONSTRAINT fk_doc_notification_log_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id);


-- =============================================================================
-- KIỂM TRA: Chạy câu này để xác minh 14 FK đã tạo
-- =============================================================================
-- SELECT
--     CONSTRAINT_NAME,
--     TABLE_NAME,
--     REFERENCED_TABLE_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE CONSTRAINT_SCHEMA = 'school_wallet_docs'
--   AND REFERENCED_TABLE_NAME IS NOT NULL
-- ORDER BY CONSTRAINT_NAME;
-- =============================================================================
