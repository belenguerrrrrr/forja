-- ============================================================
-- FORJA — Schema SQL completo
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================

-- ─── EXTENSIONES ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  plan            TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status    TEXT DEFAULT 'inactive',
  subscription_ends_at   TIMESTAMPTZ,
  onboarding_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_data (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal            TEXT,
  goal_description       TEXT,
  current_weight         NUMERIC(5,1),
  target_weight          NUMERIC(5,1),
  target_date            DATE,
  height                 NUMERIC(5,1),
  age                    INTEGER,
  gender                 TEXT,
  activity_level         TEXT,
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
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  version         INTEGER NOT NULL DEFAULT 1,
  health_score    INTEGER,
  daily_calories  INTEGER,
  protein_grams   INTEGER,
  carbs_grams     INTEGER,
  fat_grams       INTEGER,
  training_plan   JSONB,
  summary         TEXT,
  key_tips        TEXT[] DEFAULT '{}',
  adjustment_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_plans_user_active ON public.plans (user_id, is_active);


-- ============================================================
-- TABLA: daily_logs
-- Registro diario: check-in matutino + totales macro + IA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date              DATE NOT NULL,
  -- Check-in matutino
  weight_morning        NUMERIC(5,1),
  sleep_hours           NUMERIC(3,1),
  sleep_quality         INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  energy_level          INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  -- Totales nutricionales (calculados desde food_entries)
  calories_consumed     INTEGER DEFAULT 0,
  protein_consumed      NUMERIC(6,1) DEFAULT 0,
  carbs_consumed        NUMERIC(6,1) DEFAULT 0,
  fat_consumed          NUMERIC(6,1) DEFAULT 0,
  -- Actividad (calculado desde workout_entries)
  calories_burned       INTEGER DEFAULT 0,
  -- Legacy workout fields (mantenidos por compatibilidad)
  workout_done          BOOLEAN DEFAULT FALSE,
  workout_type          TEXT,
  workout_duration_minutes INTEGER,
  -- Notas y feedback IA
  notes                 TEXT,
  ai_feedback_realtime  TEXT,
  ai_summary_night      TEXT,
  summary_generated_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs (user_id, log_date DESC);


-- ============================================================
-- TABLA: food_entries
-- Entradas individuales de alimentos por comida y día
-- ============================================================
CREATE TABLE IF NOT EXISTS public.food_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  meal_type       TEXT NOT NULL DEFAULT 'lunch',  -- 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner'
  food_name       TEXT NOT NULL,
  quantity_grams  NUMERIC(6,1),
  calories        INTEGER NOT NULL,
  protein         NUMERIC(5,1) DEFAULT 0,
  carbs           NUMERIC(5,1) DEFAULT 0,
  fat             NUMERIC(5,1) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries (user_id, log_date DESC);


-- ============================================================
-- TABLA: workout_entries
-- Entrenamientos individuales por día (múltiples por día)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workout_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date         DATE NOT NULL,
  workout_type     TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned  INTEGER DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_entries_user_date ON public.workout_entries (user_id, log_date DESC);


-- ============================================================
-- TABLA: weight_logs (legacy, mantenida por compatibilidad)
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
  report_text          TEXT,
  badges               TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON public.weekly_reports (user_id, week_start DESC);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: select own"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: update own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_data
CREATE POLICY "user_data: select own"  ON public.user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_data: insert own"  ON public.user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_data: update own"  ON public.user_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_data: delete own"  ON public.user_data FOR DELETE USING (auth.uid() = user_id);

-- plans
CREATE POLICY "plans: select own"  ON public.plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "plans: insert own"  ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plans: update own"  ON public.plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "plans: delete own"  ON public.plans FOR DELETE USING (auth.uid() = user_id);

-- daily_logs
CREATE POLICY "daily_logs: select own"  ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_logs: insert own"  ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_logs: update own"  ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_logs: delete own"  ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- food_entries
CREATE POLICY "food_entries: select own"  ON public.food_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "food_entries: insert own"  ON public.food_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_entries: update own"  ON public.food_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_entries: delete own"  ON public.food_entries FOR DELETE USING (auth.uid() = user_id);

-- workout_entries
CREATE POLICY "workout_entries: select own"  ON public.workout_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workout_entries: insert own"  ON public.workout_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workout_entries: update own"  ON public.workout_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workout_entries: delete own"  ON public.workout_entries FOR DELETE USING (auth.uid() = user_id);

-- weight_logs
CREATE POLICY "weight_logs: select own"  ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weight_logs: insert own"  ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight_logs: update own"  ON public.weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weight_logs: delete own"  ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);

-- coach_messages
CREATE POLICY "coach_messages: select own"  ON public.coach_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coach_messages: insert own"  ON public.coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach_messages: delete own"  ON public.coach_messages FOR DELETE USING (auth.uid() = user_id);

-- weekly_reports
CREATE POLICY "weekly_reports: select own"  ON public.weekly_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weekly_reports: insert own"  ON public.weekly_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_reports: update own"  ON public.weekly_reports FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- PERMISOS service_role
-- ============================================================
GRANT ALL ON public.profiles        TO service_role;
GRANT ALL ON public.user_data       TO service_role;
GRANT ALL ON public.plans           TO service_role;
GRANT ALL ON public.daily_logs      TO service_role;
GRANT ALL ON public.food_entries    TO service_role;
GRANT ALL ON public.workout_entries TO service_role;
GRANT ALL ON public.weight_logs     TO service_role;
GRANT ALL ON public.coach_messages  TO service_role;
GRANT ALL ON public.weekly_reports  TO service_role;


-- ============================================================
-- MIGRACIONES — Para bases de datos existentes
-- Ejecutar solo si ya tienes datos en producción
-- ============================================================

-- daily_logs: añadir nuevas columnas
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS weight_morning        NUMERIC(5,1);
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS sleep_hours           NUMERIC(3,1);
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS sleep_quality         INTEGER CHECK (sleep_quality BETWEEN 1 AND 5);
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS energy_level          INTEGER CHECK (energy_level BETWEEN 1 AND 5);
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS ai_feedback_realtime  TEXT;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS ai_summary_night      TEXT;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS summary_generated_at  TIMESTAMPTZ;

-- food_entries: renombrar columnas legacy (ejecutar si tienes la tabla antigua)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_entries' AND column_name = 'meal'
  ) THEN
    ALTER TABLE public.food_entries RENAME COLUMN meal TO meal_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_entries' AND column_name = 'grams'
  ) THEN
    ALTER TABLE public.food_entries RENAME COLUMN grams TO quantity_grams;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_entries' AND column_name = 'kcal'
  ) THEN
    ALTER TABLE public.food_entries RENAME COLUMN kcal TO calories;
  END IF;
END $$;
