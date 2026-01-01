export const processWalletPayment = async ({
    client,
    from_user_id,
    amount_paise,
    idempotency_key,
    description,

    // debit side (always wallet for now)
    debit_wallet_account_id,

    // credit side (wallet OR store OR platform)
    credit_account_id,
    credit_account_type, // 'wallet' | 'store_revenue'

    // transaction linkage
    to_user_id = null,
    store_id = null,
}) => {
    /* --------------------------------------------------
       1. Create transaction
    -------------------------------------------------- */
    const txRes = await client.query(
        `
        INSERT INTO transactions (
            transaction_kind,
            transaction_status,
            from_user_id,
            to_user_id,
            store_id,
            amount_paise,
            currency,
            idempotency_key,
            description
        )
        VALUES (
            'debit',
            'pending',
            $1, $2, $3, $4,
            'INR',
            $5,
            $6
        )
        RETURNING transaction_id
        `,
        [
            from_user_id,
            to_user_id,
            store_id,
            amount_paise,
            idempotency_key,
            description,
        ]
    );

    const transaction_id = txRes.rows[0].transaction_id;

    /* --------------------------------------------------
       2. Ledger entries (double entry)
    -------------------------------------------------- */

    // Debit sender wallet
    await client.query(
        `
        INSERT INTO ledger_entries (
            transaction_id,
            entry_type,
            account_type,
            account_id,
            amount_paise
        )
        VALUES ($1, 'debit', 'wallet', $2, $3)
        `,
        [transaction_id, debit_wallet_account_id, amount_paise]
    );

    // Credit receiver (wallet / store / platform)
    await client.query(
        `
        INSERT INTO ledger_entries (
            transaction_id,
            entry_type,
            account_type,
            account_id,
            amount_paise
        )
        VALUES ($1, 'credit', $2, $3, $4)
        `,
        [transaction_id, credit_account_type, credit_account_id, amount_paise]
    );

    /* --------------------------------------------------
       3. Update wallet balances
    -------------------------------------------------- */
    // Debit sender wallet
    const balanceRes = await client.query(
        `
        UPDATE wallet_accounts
        SET balance_cached = balance_cached - $1
        WHERE wallet_account_id = $2
        RETURNING balance_cached
        `,
        [amount_paise, debit_wallet_account_id]
    );

    const updated_balance = balanceRes.rows[0].balance_cached;

    // Credit receiver wallet (only if credit side is also a wallet)
    if (credit_account_type === 'wallet') {
        await client.query(
            `
            UPDATE wallet_accounts
            SET balance_cached = balance_cached + $1
            WHERE wallet_account_id = $2
            `,
            [amount_paise, credit_account_id]
        );
    }

    /* --------------------------------------------------
       4. Complete transaction
    -------------------------------------------------- */
    await client.query(
        `
        UPDATE transactions
        SET transaction_status = 'completed'
        WHERE transaction_id = $1
        `,
        [transaction_id]
    );

    return {
        transaction_id,
        updated_balance,
    };
};

export const getAndLockSenderWallet = async (client, user_id, amount_paise) => {
    const res = await client.query(
        `
        SELECT wallet_account_id, balance_cached
        FROM wallet_accounts
        WHERE user_id = $1
        FOR UPDATE
        `,
        [user_id]
    );

    if (res.rows.length === 0) {
        throw new Error("SENDER_WALLET_NOT_FOUND");
    }

    if (res.rows[0].balance_cached < amount_paise) {
        throw new Error("INSUFFICIENT_BALANCE");
    }

    return res.rows[0];
};
