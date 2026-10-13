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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_students_matric ON public.students(matric_no);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch);
CREATE INDEX IF NOT EXISTS idx_students_program ON public.students(student_type);
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_level_sem ON public.courses(level, semester, program);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_course ON public.results(course_id);

-- 5. Enable Row Level Security (RLS) and grant anon access
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Allow public read/write via Supabase Anon Key
CREATE POLICY "Allow public all access on students" ON public.students
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access on courses" ON public.courses
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access on results" ON public.results
    FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
