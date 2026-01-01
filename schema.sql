-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.employees (
  employee_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id text,
  full_name character varying NOT NULL,
  age integer CHECK (age >= 18),
  salary_paise bigint,
  isActive boolean DEFAULT true,
  sex character varying,
  phone_no bigint,
  experience text,
  image_url text,
  CONSTRAINT employees_pkey PRIMARY KEY (employee_id),
  CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.items (
  item_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  store_id text,
  item_name character varying NOT NULL,
  description text,
  quantity bigint NOT NULL CHECK (quantity >= 0),
  unit character varying NOT NULL,
  price_per_unit_paise bigint NOT NULL CHECK (price_per_unit_paise >= 0),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  categories ARRAY,
  CONSTRAINT items_pkey PRIMARY KEY (item_id),
  CONSTRAINT items_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.ledger_entries (
  entry_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  transaction_id text,
  entry_type character varying NOT NULL CHECK (entry_type::text = ANY (ARRAY['debit'::character varying::text, 'credit'::character varying::text])),
  account_type text NOT NULL CHECK (account_type = ANY (ARRAY['wallet'::text, 'store_revenue'::text])),
  account_id text NOT NULL,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  currency character NOT NULL DEFAULT 'INR'::bpchar,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ledger_entries_pkey PRIMARY KEY (entry_id),
  CONSTRAINT ledger_entries_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id)
);
CREATE TABLE public.qr_payment_tokens (
  qr_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  token_hash bytea NOT NULL UNIQUE,
  store_id text,
  user_id text,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  currency character NOT NULL DEFAULT 'INR'::bpchar,
  nonce text NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['issued'::character varying::text, 'consumed'::character varying::text, 'expired'::character varying::text, 'cancelled'::character varying::text])),
  issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp without time zone NOT NULL,
  consumed_at timestamp without time zone,
  consumed_transaction_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qr_payment_tokens_pkey PRIMARY KEY (qr_id),
  CONSTRAINT qr_payment_tokens_consumed_transaction_id_fkey FOREIGN KEY (consumed_transaction_id) REFERENCES public.transactions(transaction_id),
  CONSTRAINT qr_payment_tokens_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT qr_payment_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.store_employees (
  store_id text NOT NULL,
  employee_id text NOT NULL,
  joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT store_employees_pkey PRIMARY KEY (store_id, employee_id),
  CONSTRAINT store_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
  CONSTRAINT store_employees_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.stores (
  store_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  vendor_id text,
  store_code text NOT NULL,
  display_name character varying NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'inactive'::character varying::text])),
  location_text character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT stores_pkey PRIMARY KEY (store_id),
  CONSTRAINT stores_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id)
);
CREATE TABLE public.transactions (
  transaction_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  transaction_kind character varying NOT NULL CHECK (transaction_kind::text = ANY (ARRAY['credit'::character varying::text, 'debit'::character varying::text])),
  transaction_status character varying NOT NULL CHECK (transaction_status::text = ANY (ARRAY['pending'::character varying::text, 'completed'::character varying::text, 'failed'::character varying::text])),
  from_user_id text,
  store_id text,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  currency character NOT NULL DEFAULT 'INR'::bpchar,
  idempotency_key character varying NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  to_user_id text,
  CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id),
  CONSTRAINT transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT transactions_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(user_id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  isActive boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  firebase_uid character varying UNIQUE,
  email text NOT NULL UNIQUE,
  cashapp_id text,
  role character varying CHECK (role::text = ANY (ARRAY['user'::character varying::text, 'vendor'::character varying::text, 'employee'::character varying::text, 'admin'::character varying::text])),
  full_name text,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.vendors (
  vendor_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  vendor_name character varying NOT NULL,
  owner_user_id text NOT NULL,
  account_id character varying UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vendors_pkey PRIMARY KEY (vendor_id),
  CONSTRAINT vendors_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.wallet_accounts (
  wallet_account_id text NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id text,
  currency character NOT NULL DEFAULT 'INR'::bpchar,
  balance_cached bigint NOT NULL DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_accounts_pkey PRIMARY KEY (wallet_account_id),
  CONSTRAINT wallet_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);