-- ============================================================
-- FORJA — Schema SQL completo
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================

-- ─── EXTENSIONES ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Creada automáticamente al registrarse (via trigger)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  plan            TEXT NOT NULL DEFAULT 'free',         -- 'free' | 'pro_monthly' | 'pro_annual' | 'lifetime'
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status    TEXT DEFAULT 'inactive',       -- 'active' | 'past_due' | 'canceled' | 'inactive'
  subscription_ends_at   TIMESTAMPTZ,
  onboarding_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: crear perfil al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TABLA: user_data
-- Datos del formulario de onboarding
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_data (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal            TEXT,                -- 'lose_weight' | 'gain_muscle' | 'run_marathon' | 'get_fit' | 'custom'
  goal_description       TEXT,
  current_weight         NUMERIC(5,1),  -- kg
  target_weight          NUMERIC(5,1),  -- kg (opcional)
  target_date            DATE,
  height                 NUMERIC(5,1),  -- cm
  age                    INTEGER,
  gender                 TEXT,          -- 'male' | 'female' | 'other'
  activity_level         TEXT,          -- 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
  training_days_per_week INTEGER,
  training_duration_minutes INTEGER,
  gym_access             BOOLEAN DEFAULT FALSE,
  injuries               TEXT[] DEFAULT '{}',
  dietary_restrictions   TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TRIGGER user_data_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- TABLA: plans
-- Plan generado por Claude AI para el usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  version         INTEGER NOT NULL DEFAULT 1,
  health_score    INTEGER,             -- 1-100
  daily_calories  INTEGER,
  protein_grams   INTEGER,
  carbs_grams     INTEGER,
  fat_grams       INTEGER,
  training_plan   JSONB,               -- { monday: {...}, tuesday: {...}, ... }
  summary         TEXT,
  key_tips        TEXT[] DEFAULT '{}',
  adjustment_reason TEXT,             -- motivo del último ajuste automático
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índice para obtener el plan activo rápidamente
CREATE INDEX IF NOT EXISTS idx_plans_user_active ON public.plans (user_id, is_active);


-- ============================================================
-- TABLA: daily_logs
-- Registro diario de totales (calorías, macros, entrenamiento)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date            DATE NOT NULL,
  calories_consumed   INTEGER DEFAULT 0,
  protein_consumed    NUMERIC(6,1) DEFAULT 0,
  carbs_consumed      NUMERIC(6,1) DEFAULT 0,
  fat_consumed        NUMERIC(6,1) DEFAULT 0,
  calories_burned     INTEGER DEFAULT 0,
  workout_done        BOOLEAN DEFAULT FALSE,
  workout_type        TEXT,
  workout_duration_minutes INTEGER,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs (user_id, log_date DESC);


-- ============================================================
-- TABLA: food_entries
-- Entradas individuales de alimentos por día
-- ============================================================
CREATE TABLE IF NOT EXISTS public.food_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  meal            TEXT NOT NULL DEFAULT 'other',  -- 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
  food_name       TEXT NOT NULL,
  grams           NUMERIC(6,1),
  kcal            INTEGER NOT NULL,
  protein         NUMERIC(5,1) DEFAULT 0,
  carbs           NUMERIC(5,1) DEFAULT 0,
  fat             NUMERIC(5,1) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries (user_id, log_date DESC);


-- ============================================================
-- TABLA: weight_logs
-- Registros de peso corporal
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  weight_kg       NUMERIC(5,1) NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs (user_id, log_date DESC);


-- ============================================================
-- TABLA: coach_messages
-- Historial de conversación con el AI Coach (solo Pro)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON public.coach_messages (user_id, created_at DESC);


-- ============================================================
-- TABLA: weekly_reports
-- Informes semanales generados automáticamente
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start           DATE NOT NULL,
  week_end             DATE NOT NULL,
  workouts_completed   INTEGER DEFAULT 0,
  workouts_planned     INTEGER DEFAULT 0,
  avg_calories         INTEGER,
  total_calories       INTEGER,
  adherence_percent    INTEGER,
  weight_start         NUMERIC(5,1),
  weight_end           NUMERIC(5,1),
  weight_change        NUMERIC(4,1),
  report_text          TEXT,           -- texto generado por Claude
  badges               TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON public.weekly_reports (user_id, week_start DESC);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo ve y modifica sus propios datos
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports  ENABLE ROW LEVEL SECURITY;


-- ─── profiles ───────────────────────────────────────────────
CREATE POLICY "profiles: select own"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: update own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- INSERT lo gestiona el trigger handle_new_user con SECURITY DEFINER

-- ─── user_data ──────────────────────────────────────────────
CREATE POLICY "user_data: select own"  ON public.user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_data: insert own"  ON public.user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_data: update own"  ON public.user_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_data: delete own"  ON public.user_data FOR DELETE USING (auth.uid() = user_id);

-- ─── plans ──────────────────────────────────────────────────
CREATE POLICY "plans: select own"  ON public.plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "plans: insert own"  ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plans: update own"  ON public.plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "plans: delete own"  ON public.plans FOR DELETE USING (auth.uid() = user_id);

-- ─── daily_logs ─────────────────────────────────────────────
CREATE POLICY "daily_logs: select own"  ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_logs: insert own"  ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_logs: update own"  ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_logs: delete own"  ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- ─── food_entries ───────────────────────────────────────────
CREATE POLICY "food_entries: select own"  ON public.food_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "food_entries: insert own"  ON public.food_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_entries: update own"  ON public.food_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_entries: delete own"  ON public.food_entries FOR DELETE USING (auth.uid() = user_id);

-- ─── weight_logs ────────────────────────────────────────────
CREATE POLICY "weight_logs: select own"  ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weight_logs: insert own"  ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight_logs: update own"  ON public.weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weight_logs: delete own"  ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);

-- ─── coach_messages ─────────────────────────────────────────
CREATE POLICY "coach_messages: select own"  ON public.coach_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coach_messages: insert own"  ON public.coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_messages: delete own"  ON public.coach_messages FOR DELETE USING (auth.uid() = user_id);

-- ─── weekly_reports ─────────────────────────────────────────
CREATE POLICY "weekly_reports: select own"  ON public.weekly_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weekly_reports: insert own"  ON public.weekly_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_reports: update own"  ON public.weekly_reports FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- PERMISOS para service_role (usado en webhooks de Stripe y cron jobs)
-- El service_role bypasa RLS por defecto, pero lo dejamos explícito
-- ============================================================
GRANT ALL ON public.profiles        TO service_role;
GRANT ALL ON public.user_data       TO service_role;
GRANT ALL ON public.plans           TO service_role;
GRANT ALL ON public.daily_logs      TO service_role;
GRANT ALL ON public.food_entries    TO service_role;
GRANT ALL ON public.weight_logs     TO service_role;
GRANT ALL ON public.coach_messages  TO service_role;
GRANT ALL ON public.weekly_reports  TO service_role;
