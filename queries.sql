-- ============================================================================
-- ESSENTIAL BACKEND QUERIES FOR CASHAPP (CAMPUS PAY)
-- ============================================================================

-- ============================================================================
-- WALLET OPERATIONS
-- ============================================================================   

-- 1. Get user wallet balance
-- Returns the current balance for a user's wallet in a specific currency
SELECT 
    wallet_account_id,
    user_id,
    currency,
    balance_cached,
    created_at,
    updated_at
FROM Wallet_accounts
WHERE user_id = $1 AND currency = COALESCE($2, 'INR');

-- 2. Get or create wallet account for user
-- Ensures a wallet exists for the user, creates one if it doesn't
INSERT INTO Wallet_accounts (user_id, currency, balance_cached)
VALUES ($1, COALESCE($2, 'INR'), 0)
ON CONFLICT (user_id, currency) 
DO UPDATE SET updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- 3. Update wallet balance (used after ledger entries are created)
-- Updates the cached balance for a wallet account
UPDATE Wallet_accounts
SET balance_cached = $1,
    updated_at = CURRENT_TIMESTAMP
WHERE wallet_account_id = $2
RETURNING *;

-- ============================================================================
-- TRANSACTION OPERATIONS
-- ============================================================================

-- 4. Create a payment transaction (debit from user, credit to store)
-- This creates a transaction record with idempotency check
-- Returns the transaction_id if successful, or existing transaction if idempotency_key exists
INSERT INTO Transactions (
    transaction_kind,
    transaction_status,
    user_id,
    store_id,
    amount_paise,
    currency,
    idempotency_key,
    description,
    metadata
)
VALUES (
    'debit',
    'pending',
    $1,  -- user_id
    $2,  -- store_id
    $3,  -- amount_paise
    COALESCE($4, 'INR'),
    $5,  -- idempotency_key
    $6,  -- description
    COALESCE($7, '{}'::jsonb)
)
ON CONFLICT (user_id, idempotency_key) 
DO UPDATE SET updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- 5. Create ledger entries for a transaction (double-entry bookkeeping)
-- Debits user wallet and credits store revenue account
-- This should be called in a transaction to ensure atomicity
-- First entry: Debit user wallet
INSERT INTO Ledger_entries (
    transaction_id,
    entry_type,
    account_type,
    account_id,
    amount_paise,
    currency
)
VALUES (
    $1,  -- transaction_id
    'debit',
    'wallet',
    $2,  -- wallet_account_id
    $3,  -- amount_paise
    COALESCE($4, 'INR')
);

-- Second entry: Credit store revenue
INSERT INTO Ledger_entries (
    transaction_id,
    entry_type,
    account_type,
    account_id,
    amount_paise,
    currency
)
VALUES (
    $1,  -- transaction_id
    'credit',
    'store_revenue',
    $5,  -- store_id
    $3,  -- amount_paise
    COALESCE($4, 'INR')
);

-- 6. Complete a transaction (update status and recalculate balances)
-- Updates transaction status and recalculates wallet balance
UPDATE Transactions
SET transaction_status = 'completed',
    updated_at = CURRENT_TIMESTAMP
WHERE transaction_id = $1
RETURNING *;

-- 7. Fail a transaction
UPDATE Transactions
SET transaction_status = 'failed',
    updated_at = CURRENT_TIMESTAMP
WHERE transaction_id = $1
RETURNING *;

-- 8. Recalculate wallet balance from ledger entries
-- This ensures balance_cached matches actual ledger entries
UPDATE Wallet_accounts wa
SET balance_cached = COALESCE((
    SELECT 
        SUM(CASE 
            WHEN le.entry_type = 'credit' THEN le.amount_paise
            WHEN le.entry_type = 'debit' THEN -le.amount_paise
            ELSE 0
        END)
    FROM Ledger_entries le
    WHERE le.account_id = wa.wallet_account_id
      AND le.account_type = 'wallet'
      AND le.currency = wa.currency
), 0),
    updated_at = CURRENT_TIMESTAMP
WHERE wa.wallet_account_id = $1
RETURNING *;

-- ============================================================================
-- TRANSACTION HISTORY & QUERIES
-- ============================================================================

-- 9. Get user transaction history
-- Returns all transactions for a user with pagination
SELECT 
    t.transaction_id,
    t.transaction_kind,
    t.transaction_status,
    t.amount_paise,
    t.currency,
    t.description,
    t.metadata,
    t.created_at,
    s.store_id,
    s.display_name as store_name,
    s.store_code
FROM Transactions t
LEFT JOIN Stores s ON t.store_id = s.store_id
WHERE t.user_id = $1
ORDER BY t.created_at DESC
LIMIT $2 OFFSET $3;

-- 10. Get transaction details with ledger entries
-- Returns full transaction details including all ledger entries
SELECT 
    t.*,
    json_agg(
        json_build_object(
            'entry_id', le.entry_id,
            'entry_type', le.entry_type,
            'account_type', le.account_type,
            'account_id', le.account_id,
            'amount_paise', le.amount_paise,
            'currency', le.currency,
            'created_at', le.created_at
        )
    ) as ledger_entries
FROM Transactions t
LEFT JOIN Ledger_entries le ON t.transaction_id = le.transaction_id
WHERE t.transaction_id = $1
GROUP BY t.transaction_id;

-- 11. Get transactions by store (for vendor analytics)
SELECT 
    t.transaction_id,
    t.transaction_kind,
    t.transaction_status,
    t.amount_paise,
    t.currency,
    t.description,
    t.created_at,
    u.user_id,
    u.username
FROM Transactions t
JOIN Users u ON t.user_id = u.user_id
WHERE t.store_id = $1
  AND t.transaction_status = 'completed'
ORDER BY t.created_at DESC
LIMIT $2 OFFSET $3;

-- ============================================================================
-- QR PAYMENT TOKEN OPERATIONS
-- ============================================================================

-- 12. Create QR payment token
-- Generates a new QR payment token for a store
INSERT INTO Qr_payment_tokens (
    token_hash,
    store_id,
    user_id,
    amount_paise,
    currency,
    nonce,
    status,
    expires_at,
    metadata
)
VALUES (
    $1,  -- token_hash (hashed token)
    $2,  -- store_id
    $3,  -- user_id (can be NULL for open QR codes)
    $4,  -- amount_paise
    COALESCE($5, 'INR'),
    $6,  -- nonce
    'issued',
    $7,  -- expires_at (e.g., CURRENT_TIMESTAMP + INTERVAL '15 minutes')
    COALESCE($8, '{}'::jsonb)
)
RETURNING *;

-- 13. Validate and consume QR payment token
-- Checks if token is valid and marks it as consumed
UPDATE Qr_payment_tokens
SET status = 'consumed',
    consumed_at = CURRENT_TIMESTAMP,
    consumed_transaction_id = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE qr_id = $1
  AND status = 'issued'
  AND expires_at > CURRENT_TIMESTAMP
RETURNING *;

-- 14. Get QR token by hash
-- Used to validate QR code when scanned
SELECT *
FROM Qr_payment_tokens
WHERE token_hash = $1
  AND status = 'issued'
  AND expires_at > CURRENT_TIMESTAMP;

-- 15. Expire old QR tokens (cleanup job)
-- Marks expired tokens as expired
UPDATE Qr_payment_tokens
SET status = 'expired',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'issued'
  AND expires_at <= CURRENT_TIMESTAMP;

-- ============================================================================
-- STORE & VENDOR OPERATIONS
-- ============================================================================

-- 16. Get store revenue balance
-- Calculates total revenue for a store from ledger entries
SELECT 
    s.store_id,
    s.display_name,
    s.store_code,
    COALESCE(SUM(
        CASE 
            WHEN le.entry_type = 'credit' THEN le.amount_paise
            WHEN le.entry_type = 'debit' THEN -le.amount_paise
            ELSE 0
        END
    ), 0) as total_revenue_paise,
    COALESCE($1, 'INR') as currency
FROM Stores s
LEFT JOIN Ledger_entries le ON le.account_id = s.store_id 
    AND le.account_type = 'store_revenue'
    AND le.currency = COALESCE($1, 'INR')
WHERE s.store_id = $2
GROUP BY s.store_id, s.display_name, s.store_code;

-- 17. Get all stores for a vendor
SELECT 
    s.store_id,
    s.vendor_id,
    s.store_code,
    s.display_name,
    s.status,
    s.location_text,
    s.created_at
FROM Stores s
WHERE s.vendor_id = $1
  AND s.status = 'active'
ORDER BY s.display_name;

-- 18. Get vendor details with store count
SELECT 
    v.vendor_id,
    v.vendor_name,
    v.account_id,
    v.created_at,
    COUNT(s.store_id) as store_count
FROM Vendors v
LEFT JOIN Stores s ON v.vendor_id = s.vendor_id AND s.status = 'active'
WHERE v.vendor_id = $1
GROUP BY v.vendor_id, v.vendor_name, v.account_id, v.created_at;

-- ============================================================================
-- ANALYTICS & REPORTING QUERIES
-- ============================================================================

-- 19. Get daily transaction summary for a user
SELECT 
    DATE(t.created_at) as transaction_date,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN t.transaction_kind = 'debit' THEN t.amount_paise ELSE 0 END) as total_debit_paise,
    SUM(CASE WHEN t.transaction_kind = 'credit' THEN t.amount_paise ELSE 0 END) as total_credit_paise
FROM Transactions t
WHERE t.user_id = $1
  AND t.transaction_status = 'completed'
  AND t.created_at >= $2  -- start_date
  AND t.created_at <= $3  -- end_date
GROUP BY DATE(t.created_at)
ORDER BY transaction_date DESC;

-- 20. Get store revenue by date range
SELECT 
    DATE(t.created_at) as transaction_date,
    COUNT(*) as transaction_count,
    SUM(t.amount_paise) as total_revenue_paise,
    AVG(t.amount_paise) as avg_transaction_paise
FROM Transactions t
WHERE t.store_id = $1
  AND t.transaction_status = 'completed'
  AND t.created_at >= $2  -- start_date
  AND t.created_at <= $3  -- end_date
GROUP BY DATE(t.created_at)
ORDER BY transaction_date DESC;

-- 21. Get top stores by revenue (for admin analytics)
SELECT 
    s.store_id,
    s.display_name,
    s.store_code,
    COUNT(t.transaction_id) as transaction_count,
    SUM(t.amount_paise) as total_revenue_paise,
    AVG(t.amount_paise) as avg_transaction_paise
FROM Stores s
JOIN Transactions t ON s.store_id = t.store_id
WHERE t.transaction_status = 'completed'
  AND t.created_at >= $1  -- start_date
  AND t.created_at <= $2  -- end_date
GROUP BY s.store_id, s.display_name, s.store_code
ORDER BY total_revenue_paise DESC
LIMIT $3;  -- limit

-- 22. Get user spending statistics
SELECT 
    u.user_id,
    u.username,
    COUNT(t.transaction_id) as total_transactions,
    SUM(t.amount_paise) as total_spent_paise,
    AVG(t.amount_paise) as avg_transaction_paise,
    MIN(t.amount_paise) as min_transaction_paise,
    MAX(t.amount_paise) as max_transaction_paise
FROM Users u
JOIN Transactions t ON u.user_id = t.user_id
WHERE t.transaction_status = 'completed'
  AND t.transaction_kind = 'debit'
  AND t.created_at >= $1  -- start_date
  AND t.created_at <= $2  -- end_date
GROUP BY u.user_id, u.username
ORDER BY total_spent_paise DESC
LIMIT $3;  -- limit

-- ============================================================================
-- COMPLETE PAYMENT FLOW (Transaction with all steps)
-- ============================================================================

-- 23. Complete payment transaction (use in a database transaction)
-- This is a multi-step process that should be wrapped in BEGIN/COMMIT
-- Step 1: Check wallet balance
SELECT balance_cached 
FROM Wallet_accounts 
WHERE user_id = $1 AND currency = COALESCE($2, 'INR')
FOR UPDATE;  -- Lock the row

-- Step 2: Verify sufficient balance (application logic)
-- IF balance_cached >= amount_paise THEN proceed

-- Step 3: Create transaction record
-- Use query #4 above

-- Step 4: Create ledger entries
-- Use query #5 above (both INSERT statements)

-- Step 5: Update wallet balance
-- Use query #8 above to recalculate, or:
UPDATE Wallet_accounts
SET balance_cached = balance_cached - $1,  -- amount_paise
    updated_at = CURRENT_TIMESTAMP
WHERE wallet_account_id = $2;

-- Step 6: Mark transaction as completed
-- Use query #6 above

-- ============================================================================
-- USER OPERATIONS
-- ============================================================================

-- 24. Get user details with wallet balance
SELECT 
    u.user_id,
    u.username,
    u.role,
    u.isActive,
    u.created_at,
    json_agg(
        json_build_object(
            'wallet_account_id', wa.wallet_account_id,
            'currency', wa.currency,
            'balance_cached', wa.balance_cached
        )
    ) as wallets
FROM Users u
LEFT JOIN Wallet_accounts wa ON u.user_id = wa.user_id
WHERE u.user_id = $1
GROUP BY u.user_id, u.username, u.role, u.isActive, u.created_at;

-- 25. Add funds to wallet (credit transaction)
-- This would typically be used for wallet top-ups
-- Step 1: Create credit transaction
INSERT INTO Transactions (
    transaction_kind,
    transaction_status,
    user_id,
    amount_paise,
    currency,
    idempotency_key,
    description,
    metadata
)
VALUES (
    'credit',
    'pending',
    $1,  -- user_id
    $2,  -- amount_paise
    COALESCE($3, 'INR'),
    $4,  -- idempotency_key
    $5,  -- description (e.g., 'Wallet Top-up')
    COALESCE($6, '{}'::jsonb)
)
RETURNING *;

-- Step 2: Create ledger entry (credit wallet)
INSERT INTO Ledger_entries (
    transaction_id,
    entry_type,
    account_type,
    account_id,
    amount_paise,
    currency
)
VALUES (
    $1,  -- transaction_id
    'credit',
    'wallet',
    $2,  -- wallet_account_id
    $3,  -- amount_paise
    COALESCE($4, 'INR')
);

-- Step 3: Update wallet balance
UPDATE Wallet_accounts
SET balance_cached = balance_cached + $1,  -- amount_paise
    updated_at = CURRENT_TIMESTAMP
WHERE wallet_account_id = $2;

-- Step 4: Mark transaction as completed
UPDATE Transactions
SET transaction_status = 'completed',
    updated_at = CURRENT_TIMESTAMP
WHERE transaction_id = $1;

