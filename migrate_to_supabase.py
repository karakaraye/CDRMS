"""
migrate_to_supabase.py
Migrates all students, courses, and results from local cdrms.db to Supabase PostgreSQL.
"""
import sqlite3
import psycopg2
from psycopg2.extras import execute_values

SQLITE_PATH = "cdrms.db"
PG_URL = "postgresql://postgres.fqvmfkpknsaquayjlkwk:IWILLCHANGETHEWORLD@aws-0-eu-west-2.pooler.supabase.com:6543/postgres"

def migrate():
    print("Connecting to SQLite...")
    s_conn = sqlite3.connect(SQLITE_PATH)
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    print("Connecting to Supabase PostgreSQL...")
    p_conn = psycopg2.connect(PG_URL, sslmode="require")
    p_cur = p_conn.cursor()

    # 1. Migrate courses
    print("Fetching courses from SQLite...")
    s_cur.execute("SELECT * FROM courses")
    courses = [dict(r) for r in s_cur.fetchall()]
    print(f"Found {len(courses)} courses in SQLite.")

    if courses:
        insert_course_sql = """
            INSERT INTO public.courses (course_code, course_title, credit_units, level, semester, status, program, remark)
            VALUES %s
            ON CONFLICT (course_code, level, semester, program) DO UPDATE SET
                course_title = EXCLUDED.course_title,
                credit_units = EXCLUDED.credit_units,
                status = EXCLUDED.status,
                remark = EXCLUDED.remark;
        """
        course_values = [
            (
                c["course_code"],
                c["course_title"],
                int(c["credit_units"] or 3),
                str(c["level"] or "100"),
                str(c["semester"] or "First"),
                str(c["status"] or "Compulsory"),
                str(c["program"] or "Full-Time"),
                c.get("remark") or None,
            )
            for c in courses
        ]
        execute_values(p_cur, insert_course_sql, course_values)
        p_conn.commit()
        print(f"Successfully migrated {len(courses)} courses to Supabase!")

    # 2. Migrate students
    print("Fetching students from SQLite...")
    s_cur.execute("SELECT * FROM students")
    students = [dict(r) for r in s_cur.fetchall()]
    print(f"Found {len(students)} students in SQLite.")

    # We also keep a mapping of old sqlite student_id -> new pg student_id for results
    student_id_map = {}

    if students:
        for s in students:
            insert_student_sql = """
                INSERT INTO public.students (
                    matric_no, surname, firstname, other_name, fullname, batch, student_type,
                    dob, sex, marital_status, gsm, sponsor_gsm, guardian_rel, email,
                    state_of_origin, lga, faculty, department, entry_year, passport_path
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (matric_no) DO UPDATE SET
                    fullname = EXCLUDED.fullname,
                    student_type = EXCLUDED.student_type,
                    department = EXCLUDED.department
                RETURNING id, matric_no;
            """
            p_cur.execute(
                insert_student_sql,
                (
                    s["matric_no"],
                    s.get("surname"),
                    s.get("firstname"),
                    s.get("other_name"),
                    s["fullname"],
                    s.get("batch") or "U2022",
                    s.get("student_type") or "Full-Time",
                    s.get("dob"),
                    s.get("sex"),
                    s.get("marital_status"),
                    s.get("gsm"),
                    s.get("sponsor_gsm"),
                    s.get("guardian_rel"),
                    s.get("email"),
                    s.get("state_of_origin"),
                    s.get("lga"),
                    s.get("faculty") or "Management Sciences",
                    s.get("department") or "Management",
                    s.get("entry_year"),
                    s.get("passport_path"),
                ),
            )
            new_id, matric = p_cur.fetchone()
            student_id_map[s["id"]] = new_id

        p_conn.commit()
        print(f"Successfully migrated {len(students)} students to Supabase!")

    # Build course_code -> new pg course_id mapping
    p_cur.execute("SELECT id, course_code, level, semester, program FROM public.courses")
    pg_courses = p_cur.fetchall()
    pg_course_map = {}
    for r in pg_courses:
        # map (code, level, sem, prog) -> id
        pg_course_map[(r[1], str(r[2]), str(r[3]), str(r[4]))] = r[0]

    # Map sqlite course_id -> (code, level, sem, prog)
    s_course_map = {}
    for c in courses:
        s_course_map[c["id"]] = (c["course_code"], str(c["level"]), str(c["semester"]), str(c["program"]))

    # 3. Migrate results
    print("Fetching results from SQLite...")
    s_cur.execute("SELECT * FROM results")
    results = [dict(r) for r in s_cur.fetchall()]
    print(f"Found {len(results)} results in SQLite.")

    if results:
        insert_result_sql = """
            INSERT INTO public.results (
                student_id, course_id, score, grade, grade_point, session, semester,
                is_carryover, is_waived, waiver_grade, remark, level
            )
            VALUES %s;
        """
        result_values = []
        for r in results:
            new_student_id = student_id_map.get(r["student_id"])
            if not new_student_id:
                continue

            course_key = s_course_map.get(r["course_id"])
            new_course_id = pg_course_map.get(course_key) if course_key else None
            if not new_course_id:
                continue

            result_values.append((
                new_student_id,
                new_course_id,
                float(r["score"] or 0),
                r.get("grade") or "F",
                float(r["grade_point"] or 0),
                r.get("session") or "2022/2023",
                r.get("semester") or "First",
                int(r.get("is_carryover") or 0),
                int(r.get("is_waived") or 0),
                r.get("waiver_grade"),
                r.get("remark"),
                str(r.get("level") or "100"),
            ))

        if result_values:
            # Clear previous results if any to avoid duplicates
            p_cur.execute("TRUNCATE TABLE public.results RESTART IDENTITY;")
            execute_values(p_cur, insert_result_sql, result_values)
            p_conn.commit()
            print(f"Successfully migrated {len(result_values)} results to Supabase!")

    # Verify counts in Supabase
    p_cur.execute("SELECT count(*) FROM public.students")
    c_students = p_cur.fetchone()[0]
    p_cur.execute("SELECT count(*) FROM public.courses")
    c_courses = p_cur.fetchone()[0]
    p_cur.execute("SELECT count(*) FROM public.results")
    c_results = p_cur.fetchone()[0]

    print("\n=== SUPABASE CLOUD DATABASE SUMMARY ===")
    print(f"Students in Cloud: {c_students}")
    print(f"Courses in Cloud:  {c_courses}")
    print(f"Results in Cloud:  {c_results}")
    print("========================================")

    p_cur.close()
    p_conn.close()
    s_cur.close()
    s_conn.close()

if __name__ == "__main__":
    migrate()
