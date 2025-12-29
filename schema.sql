CREATE TABLE Users (

    user_id text primary key default gen_random_uuid()::text,
    username varchar(50) not null unique,
    password_hash varchar(255) not null,

    role varchar(20) not null check (role in ('student', 'vendor', 'employee', 'admin')),
    isActive boolean default true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE Vendors (

    vendor_id text primary key default gen_random_uuid()::text,
    vendor_name varchar(100) not null,
    owner_user_id text not null references Users(user_id) on delete cascade,

    account_id varchar(255) unique not null,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE Stores (

    store_id text primary key default gen_random_uuid()::text,
    vendor_id text references Vendors(vendor_id) on delete cascade,
    store_code text not null,
    display_name varchar(100) not null,
    status varchar(20) not null check (status in ('active', 'inactive')),
    location_text varchar(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(vendor_id, store_code)

);

CREATE TABLE Wallet_accounts (
    
    wallet_account_id text primary key default gen_random_uuid()::text,
    user_id text references Users(user_id) on delete cascade,
    currency char(3) not null default 'INR',
    balance_cached bigint not null default 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, currency)

);

CREATE TABLE Transactions (

    transaction_id text primary key default gen_random_uuid()::text,
    transaction_kind varchar(20) not null check (transaction_kind in ('credit', 'debit')),
    transaction_status varchar(20) not null check (transaction_status in ('pending', 'completed', 'failed')),

    user_id text references Users(user_id) on delete cascade,
    store_id text references Stores(store_id) on delete set null,


    amount_paise bigint not null check (amount_paise > 0),
    currency char(3) not null default 'INR',


    idempotency_key varchar(100) not null,
    description text,
    metadata jsonb not null default '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, idempotency_key)

);


CREATE TABLE Items (

    item_id text primary key default gen_random_uuid()::text,
    store_id text references Stores(store_id) on delete cascade,

    item_name varchar(100) not null,
    description text,
    quantity bigint not null check (quantity >= 0),
    unit varchar(20) not null,
    price_per_unit_paise bigint not null check (price_per_unit_paise >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE Ledger_entries (

    entry_id text primary key default gen_random_uuid()::text,
    transaction_id text references Transactions(transaction_id) on delete cascade,

    entry_type varchar(20) not null check (entry_type in ('debit', 'credit')),
    account_type text not null check (account_type in ('wallet', 'store_revenue')),
    account_id text not null,


    amount_paise bigint not null check (amount_paise > 0),
    currency char(3) not null default 'INR',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE INDEX idx_ledger_transaction ON Ledger_entries(transaction_id);
CREATE INDEX idx_ledger_account ON Ledger_entries(account_id, account_type);

-- Additional indexes for performance
CREATE INDEX idx_wallet_user_id ON Wallet_accounts(user_id);
CREATE INDEX idx_transactions_user_id ON Transactions(user_id);
CREATE INDEX idx_transactions_store_id ON Transactions(store_id);
CREATE INDEX idx_transactions_status ON Transactions(transaction_status);
CREATE INDEX idx_transactions_created_at ON Transactions(created_at DESC);
CREATE INDEX idx_qr_tokens_store_id ON Qr_payment_tokens(store_id);
CREATE INDEX idx_qr_tokens_user_id ON Qr_payment_tokens(user_id);
CREATE INDEX idx_qr_tokens_status ON Qr_payment_tokens(status);
CREATE INDEX idx_qr_tokens_token_hash ON Qr_payment_tokens(token_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON Vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON Stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_accounts_updated_at BEFORE UPDATE ON Wallet_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON Transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ledger_entries_updated_at BEFORE UPDATE ON Ledger_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Qr_payment_tokens (

    qr_id text primary key default gen_random_uuid()::text,
    token_hash bytea not null unique,
    
    store_id text references Stores(store_id) on delete cascade,
    user_id text references Users(user_id) on delete set null,

    amount_paise bigint not null check (amount_paise > 0),
    currency char(3) not null default 'INR',

    nonce text not null,
    status varchar(20) not null check (status in ('issued', 'consumed', 'expired', 'cancelled')),

    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP not null,
    consumed_at TIMESTAMP,

    consumed_transaction_id text references Transactions(transaction_id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


CREATE TRIGGER update_qr_payment_tokens_updated_at BEFORE UPDATE ON Qr_payment_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();