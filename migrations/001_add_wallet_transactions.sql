-- Migration: Add wallet_transactions table for Add Money and Withdraw features
-- Run this migration to add the wallet_transactions table to your database

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  wallet_transaction_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id text NOT NULL,
  transaction_type character varying NOT NULL CHECK (transaction_type::text = ANY (ARRAY['ADD_MONEY'::character varying::text, 'WITHDRAW'::character varying::text])),
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  currency character NOT NULL DEFAULT 'INR'::bpchar,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['PENDING'::character varying::text, 'SUCCESS'::character varying::text, 'FAILED'::character varying::text])),
  stripe_payment_intent_id text,
  stripe_refund_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (wallet_transaction_id),
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_stripe_payment_intent_id ON public.wallet_transactions(stripe_payment_intent_id);
