-- =========================================================================
-- CDRMS Cloud Database Schema (Supabase / PostgreSQL)
-- Run this script in your Supabase project's SQL Editor to create all tables
-- =========================================================================

-- 1. Create students table
CREATE TABLE IF NOT EXISTS public.students (
    id BIGSERIAL PRIMARY KEY,
    matric_no TEXT NOT NULL UNIQUE,
    surname TEXT,
    firstname TEXT,
    other_name TEXT,
    fullname TEXT NOT NULL,
    batch TEXT DEFAULT 'U2022',
    student_type TEXT NOT NULL DEFAULT 'Full-Time',
    dob TEXT,
    sex TEXT,
    marital_status TEXT,
    gsm TEXT,
    sponsor_gsm TEXT,
    guardian_rel TEXT,
    email TEXT,
    state_of_origin TEXT,
    lga TEXT,
    faculty TEXT DEFAULT 'Management Sciences',
    department TEXT DEFAULT 'Management',
    entry_year TEXT,
    passport_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id BIGSERIAL PRIMARY KEY,
    course_code TEXT NOT NULL,
    course_title TEXT NOT NULL,
    credit_units INTEGER NOT NULL DEFAULT 3,
    level TEXT DEFAULT '100',
    semester TEXT DEFAULT 'First',
    status TEXT DEFAULT 'Compulsory',
    program TEXT DEFAULT 'Full-Time',
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_code, level, semester, program)
);

-- 3. Create results table
CREATE TABLE IF NOT EXISTS public.results (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT,
    course_id BIGINT,
    score NUMERIC DEFAULT 0,
    grade TEXT DEFAULT 'F',
    grade_point NUMERIC DEFAULT 0,
    session TEXT,
    semester TEXT DEFAULT 'First',
    is_carryover INTEGER DEFAULT 0,
    is_waived INTEGER DEFAULT 0,
    waiver_grade TEXT,
    remark TEXT,
    level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_results_student_course_session_sem UNIQUE (student_id, course_id, session, semester)
);

-- 4. Create result_queries table (HOD / Exam Officer Query Workflow)
CREATE TABLE IF NOT EXISTS public.result_queries (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    student_name TEXT,
    matric_no TEXT,
    course_id TEXT,
    course_code TEXT,
    course_title TEXT,
    original_score NUMERIC,
    proposed_score NUMERIC,
    approved_score NUMERIC,
    reason TEXT,
    requested_by TEXT,
    status TEXT DEFAULT 'PENDING',
    resolution_note TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    session TEXT,
    semester TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create audit_logs table (Permanent Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    title TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_students_matric ON public.students(matric_no);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch);
CREATE INDEX IF NOT EXISTS idx_students_program ON public.students(student_type);
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_level_sem ON public.courses(level, semester, program);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_course ON public.results(course_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write via Supabase Anon Key
CREATE POLICY "Allow public all access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on results" ON public.results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on result_queries" ON public.result_queries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 8. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.result_queries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
