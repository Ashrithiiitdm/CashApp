-- Fix currency column to support 3-character currency codes like 'INR'
ALTER TABLE public.wallet_transactions 
ALTER COLUMN currency TYPE character(3);

-- Update the default value properly
ALTER TABLE public.wallet_transactions 
ALTER COLUMN currency SET DEFAULT 'INR'::bpchar;
