-- -----------------------------------------------------------------------------
-- Thimbly CP1 Foundation Migration
-- Creates foundational schema for users, credits, transactions, and projects.
-- Includes strict Row Level Security (RLS) and idempotent credit handling.
-- -----------------------------------------------------------------------------

-- 1. Create Enums and Tables

CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'ops');
CREATE TYPE public.craft_type_enum AS ENUM ('cross-stitch', 'quilting');

CREATE TABLE public.user_roles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_credits (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    reference_id TEXT NOT NULL, -- external reference for idempotency (e.g. stripe_pi_xxx)
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- the user/admin resolving it
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_credit_reference UNIQUE (reference_id)
);

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    craft_type public.craft_type_enum NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read own balance" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins/Ops can read all transactions" ON public.credit_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE id = auth.uid() AND role IN ('admin', 'ops')
        )
    );

CREATE POLICY "Users can manage their own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

-- 4. Automatically setup new users via Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_roles (id, role) VALUES (new.id, 'user');
    -- Give 1 free export credit to start as per CP1 goals
    INSERT INTO public.user_credits (user_id, balance) VALUES (new.id, 1);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RPC functions to manage transaction states and atomic increments
CREATE OR REPLACE FUNCTION public.grant_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_reference_id TEXT,
    p_transaction_type TEXT
) RETURNS JSONB AS $$
DECLARE
    v_is_super BOOLEAN;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    IF p_amount > 0 AND auth.role() = 'authenticated' THEN
        SELECT (role IN ('admin', 'ops')) INTO v_is_super FROM public.user_roles WHERE id = auth.uid();
        IF NOT COALESCE(v_is_super, false) THEN
            RAISE EXCEPTION 'Unauthorized: Only admins/ops can grant credits via API';
        END IF;
    END IF;

    -- Directly complete the positive deposit
    BEGIN
        INSERT INTO public.credit_transactions (user_id, amount, transaction_type, reference_id, status)
        VALUES (p_user_id, p_amount, p_transaction_type, p_reference_id, 'completed');
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('status', 'success', 'message', 'Idempotent request ignored (reference already exists)');
    END;

    SELECT balance INTO v_current_balance FROM public.user_credits WHERE user_id = p_user_id FOR UPDATE;
    v_new_balance := coalesce(v_current_balance, 0) + p_amount;
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits.';
    END IF;

    UPDATE public.user_credits SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;
    RETURN jsonb_build_object('status', 'success', 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.finalize_transaction(
    p_reference_id TEXT,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_tx public.credit_transactions;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    SELECT * INTO v_tx FROM public.credit_transactions WHERE reference_id = p_reference_id AND user_id = p_user_id;

    IF v_tx IS NULL THEN RAISE EXCEPTION 'Transaction not found'; END IF;
    IF v_tx.status != 'pending' THEN RAISE EXCEPTION 'Transaction already %', v_tx.status; END IF;
    IF v_tx.amount >= 0 THEN RAISE EXCEPTION 'Only deduction transactions can be finalized here'; END IF;

    -- Update to completed
    UPDATE public.credit_transactions SET status = 'completed' WHERE id = v_tx.id;

    -- Deduct balance atomically
    SELECT balance INTO v_current_balance FROM public.user_credits WHERE user_id = p_user_id FOR UPDATE;
    v_new_balance := coalesce(v_current_balance, 0) + v_tx.amount;
    
    IF v_new_balance < 0 THEN RAISE EXCEPTION 'Insufficient credits.'; END IF;

    UPDATE public.user_credits SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;
    RETURN jsonb_build_object('status', 'success', 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.refund_transaction(
    p_reference_id TEXT,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_tx public.credit_transactions;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    SELECT * INTO v_tx FROM public.credit_transactions WHERE reference_id = p_reference_id AND user_id = p_user_id;

    IF v_tx IS NULL THEN RAISE EXCEPTION 'Transaction not found'; END IF;
    IF v_tx.status = 'refunded' THEN RETURN jsonb_build_object('status', 'success', 'message', 'Already refunded'); END IF;
    IF v_tx.status = 'completed' AND v_tx.amount < 0 THEN
       -- Need to refund the deducted amount
       SELECT balance INTO v_current_balance FROM public.user_credits WHERE user_id = p_user_id FOR UPDATE;
       v_new_balance := coalesce(v_current_balance, 0) - v_tx.amount;
       UPDATE public.user_credits SET balance = v_new_balance, updated_at = now() WHERE user_id = p_user_id;
    END IF;

    UPDATE public.credit_transactions SET status = 'refunded' WHERE id = v_tx.id;
    RETURN jsonb_build_object('status', 'success');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Indexes for Performance
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_credit_transactions_user_id_created_at ON public.credit_transactions(user_id, created_at);
CREATE INDEX idx_projects_user_id_craft_type ON public.projects(user_id, craft_type);
