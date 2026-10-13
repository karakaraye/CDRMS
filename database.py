"""
database.py
------------
Data access layer for the CGPA & Degree Result Management System (CDRMS).

Wraps a local SQLite database with three tables:
    students  - comprehensive biodata & contact info for each student
    courses   - the course catalogue (per level/semester)
    results   - a student's score/grade for a given course in a given session/semester
"""

import datetime
import sqlite3
import sys
from pathlib import Path

if getattr(sys, "frozen", False):
    APP_DIR = Path(sys.executable).resolve().parent
else:
    APP_DIR = Path(__file__).resolve().parent

DB_FILE = APP_DIR / "cdrms.db"

# 5-point Nigerian university grading scale
GRADE_SCALE = [
    (70, 100, "A", 5.0),
    (60, 69, "B", 4.0),
    (50, 59, "C", 3.0),
    (45, 49, "D", 2.0),
    (40, 44, "E", 1.0),
    (0, 39, "F", 0.0),
]


def score_to_grade(score: float, is_repeat: bool = False):
    """
    Return (letter_grade, grade_point) for a numeric score.
    If is_repeat is True (repeat/carryover attempt):
      Grades A (70-100), B (60-69), C (50-59) have their grade point capped at 3.0 GP.
      Grades D (2.0), E (1.0), F (0.0) remain normal.
    """
    try:
        score = float(score)
    except (ValueError, TypeError):
        return "F", 0.0
    for low, high, letter, point in GRADE_SCALE:
        if low <= score <= high:
            if is_repeat and letter in ("A", "B", "C"):
                return letter, 3.0
            return letter, point
    return "F", 0.0


def get_degree_class(cgpa: float, numeric: bool = True) -> str:
    """Return degree classification string based on 5.0 CGPA scale."""
    if cgpa >= 4.50:
        return "1st Class" if numeric else "FIRST CLASS HONOURS"
    elif cgpa >= 3.50:
        return "2¹" if numeric else "SECOND CLASS (UPPER DIVISION)"
    elif cgpa >= 2.40:
        return "2²" if numeric else "SECOND CLASS (LOWER DIVISION)"
    elif cgpa >= 1.50:
        return "3rd Class" if numeric else "THIRD CLASS"
    elif cgpa >= 1.00:
        return "Pass" if numeric else "PASS"
    elif cgpa > 0:
        return "Fail" if numeric else "FAIL"
    return "N/A"


DEFAULT_COURSES = [
    # 100 LEVEL - FIRST SEMESTER (16 Units)
    ("GES 111.1", "Communication in English", 2, "100", "First", "Compulsory"),
    ("AMS 101.1", "Principles of Management", 2, "100", "First", "Compulsory"),
    ("MGT 101.1", "Introduction to Business I", 2, "100", "First", "Compulsory"),
    ("AMS 103.1", "Introduction to Computers for Management Sciences", 2, "100", "First", "Compulsory"),
    ("MKT 111.1", "Elements of Marketing", 2, "100", "First", "Required"),
    ("MGT 117.1", "Business, Government and Society", 3, "100", "First", "Required"),
    ("ACC 101.1", "Introduction to Financial Accounting I", 3, "100", "First", "Required"),

    # 100 LEVEL - SECOND SEMESTER (20 Units)
    ("GES 112.2", "Nigerian Peoples and Culture", 2, "100", "Second", "Compulsory"),
    ("AMS 102.2", "Basic Mathematics for Management Sciences", 2, "100", "Second", "Compulsory"),
    ("AMS 104.2", "Principles of Project Management", 2, "100", "Second", "Compulsory"),
    ("MGT 102.2", "Introduction to Business II", 2, "100", "Second", "Compulsory"),
    ("FIN 101.2", "Introduction to Finance", 3, "100", "Second", "Required"),
    ("MGT 118.2", "Business Communication", 3, "100", "Second", "Required"),
    ("MGT 106.2", "Elements of Administration", 2, "100", "Second", "Required"),
    ("MGT 114.2", "Introduction to Business Economics", 2, "100", "Second", "Required"),
    ("MGT 116.2", "Introduction to Procurement Management", 2, "100", "Second", "Required"),

    # 200 LEVEL - FIRST SEMESTER (17 Units)
    ("GES 211.1", "Entrepreneurship and Business Innovation", 2, "200", "First", "Compulsory"),
    ("MGT 201.1", "Principles of Business Administration I", 3, "200", "First", "Compulsory"),
    ("MGT 203.1", "Business Statistics", 3, "200", "First", "Compulsory"),
    ("MGT 205.1", "Leadership and Governance (Corporate Governance)", 2, "200", "First", "Compulsory"),
    ("HMT 203.1", "Introduction to Hospitality and Tourism Management", 2, "200", "First", "Required"),
    ("MGT 215.1", "Non-Profit Management", 3, "200", "First", "Required"),
    ("MGT 213.1", "Family Business Management & Succession Planning", 2, "200", "First", "Required"),

    # 200 LEVEL - SECOND SEMESTER (16 Units)
    ("GES 212.2", "Philosophy, Logic, and Human Existence", 2, "200", "Second", "Compulsory"),
    ("MGT 202.2", "Principles of Business Administration II", 3, "200", "Second", "Compulsory"),
    ("MGT 204.2", "Quantitative Analysis in Management", 3, "200", "Second", "Compulsory"),
    ("MGT 216.2", "Introduction to Financial Management", 3, "200", "Second", "Compulsory"),
    ("MGT 218.2", "Green Management", 2, "200", "Second", "Compulsory"),
    ("FMS 201.1", "Community Service", 1, "200", "Second", "Required"),
    ("MGT 214.2", "Employment Relations and Conflict Management", 2, "200", "Second", "Required"),

    # 300 LEVEL - FIRST SEMESTER (18 Units)
    ("GES 312.1", "Peace and Conflict Resolution", 2, "300", "First", "Compulsory"),
    ("MGT 303.1", "Management Theory", 3, "300", "First", "Compulsory"),
    ("MGT 305.1", "Financial Management", 3, "300", "First", "Compulsory"),
    ("MGT 313.1", "Innovation Management", 2, "300", "First", "Compulsory"),
    ("MGT 319.1", "E-Commerce (E-Business)", 2, "300", "First", "Compulsory"),
    ("MGT 321.1", "Business Start-up", 2, "300", "First", "Compulsory"),
    ("MGT 323.1", "Supply Chain Management", 2, "300", "First", "Compulsory"),
    ("MGT 315.1", "Business Research Methods", 2, "300", "First", "Required"),

    # 300 LEVEL - SECOND SEMESTER (15 Units)
    ("GES 300.2", "Venture Creation", 2, "300", "Second", "Compulsory"),
    ("MGT 310.2", "Production and Operation Management", 3, "300", "Second", "Compulsory"),
    ("MGT 302.2", "Human Behaviour in Organisations", 3, "300", "Second", "Compulsory"),
    ("MGT 304.2", "Human Resource Management", 3, "300", "Second", "Compulsory"),
    ("MGT 312.2", "Small Business Management", 2, "300", "Second", "Compulsory"),
    ("MGT 320.2", "Fundamentals of Business Data Analytics", 2, "300", "Second", "Required"),
    ("MGT 355.2", "Business Law", 2, "300", "Second", "Required"),

    # 400 LEVEL - FIRST SEMESTER (19 Units)
    ("MGT 401.1", "Business Policy and Strategic Management", 3, "400", "First", "Compulsory"),
    ("MGT 409.1", "Management Information System", 2, "400", "First", "Compulsory"),
    ("MGT 411.1", "Analysis for Business Decision", 3, "400", "First", "Compulsory"),
    ("MGT 420.1", "Internship (Industrial Exposure Programme)", 3, "400", "First", "Compulsory"),
    ("MGT 415.1", "Service Sector Management", 2, "400", "First", "Required"),
    ("MGT 417.1", "Feasibilities and Business Planning", 2, "400", "First", "Required"),
    ("MGT 405.1", "Public Sector Management", 2, "400", "First", "Required"),
    ("MGT 403.1", "Labour Economics", 2, "400", "First", "Required"),

    # 400 LEVEL - SECOND SEMESTER (19 Units)
    ("MGT 402.2", "Strategic Thinking and Problem Solving", 3, "400", "Second", "Compulsory"),
    ("MGT 406.2", "International Business", 3, "400", "Second", "Compulsory"),
    ("MGT 418.2", "Public Project Analysis and Management", 3, "400", "Second", "Required"),
    ("MGT 414.2", "Comparative Management", 2, "400", "Second", "Required"),
    ("MGT 400.2", "Entrepreneurial Project", 2, "400", "Second", "Required"),
    ("MGT 498.2", "Research Project", 6, "400", "Second", "Required"),
]

DEFAULT_COURSES_PART_TIME = [
    # 100 LEVEL - First Term (13 Credits)
    ("GES 111.1", "Communication in English", 2, "100", "First", "Compulsory", "Part-Time"),
    ("AMS 101.1", "Principles of Management", 2, "100", "First", "Compulsory", "Part-Time"),
    ("MGT 101.1", "Introduction to Business I", 2, "100", "First", "Compulsory", "Part-Time"),
    ("AMS 103.1", "Introduction to Computers for Management Sciences", 2, "100", "First", "Compulsory", "Part-Time"),
    ("FIN 101.1", "Introduction to Finance", 3, "100", "First", "Required", "Part-Time"),
    ("MKT 111.1", "Elements of Marketing", 2, "100", "First", "Required", "Part-Time"),

    # 100 LEVEL - Second Term (12 Credits)
    ("MGT 117.2", "Business, Government and Society", 3, "100", "Second", "Required", "Part-Time"),
    ("ACC 101.2", "Introduction to Financial Accounting I", 3, "100", "Second", "Required", "Part-Time"),
    ("GES 112.2", "Nigerian Peoples and Culture", 2, "100", "Second", "Compulsory", "Part-Time"),
    ("AMS 102.2", "Basic Mathematics for Management Sciences", 2, "100", "Second", "Compulsory", "Part-Time"),
    ("AMS 104.2", "Principles of Project Management", 2, "100", "Second", "Compulsory", "Part-Time"),

    # 100 LEVEL - Third Term (11 Credits)
    ("MGT 102.3", "Introduction to Business II", 2, "100", "Third", "Compulsory", "Part-Time"),
    ("MGT 118.3", "Business Communication", 3, "100", "Third", "Required", "Part-Time"),
    ("MGT 106.3", "Elements of Administration", 2, "100", "Third", "Required", "Part-Time"),
    ("MGT 114.3", "Introduction to Business Economics", 2, "100", "Third", "Required", "Part-Time"),
    ("MGT 116.3", "Introduction to Procurement Management", 2, "100", "Third", "Required", "Part-Time"),

    # 200 LEVEL - First Term (10 Credits)
    ("HMT 203.1", "Introduction to Hospitality and Tourism Management", 2, "200", "First", "Required", "Part-Time"),
    ("GES 211.1", "Entrepreneurship and Business Innovation", 2, "200", "First", "Compulsory", "Part-Time"),
    ("MGT 201.1", "Principles of Business Administration I", 3, "200", "First", "Compulsory", "Part-Time"),
    ("MGT 203.1", "Business Statistics", 3, "200", "First", "Compulsory", "Part-Time"),

    # 200 LEVEL - Second Term (12 Credits)
    ("MGT 215.2", "Non-Profit Management", 3, "200", "Second", "Required", "Part-Time"),
    ("MGT 213.2", "Family Business Management & Succession Planning", 2, "200", "Second", "Required", "Part-Time"),
    ("MGT 205.2", "Leadership and Governance (Corporate Governance)", 2, "200", "Second", "Compulsory", "Part-Time"),
    ("GES 212.2", "Philosophy, Logic, and Human Existence", 2, "200", "Second", "Compulsory", "Part-Time"),
    ("MGT 202.2", "Principles of Business Administration II", 3, "200", "Second", "Compulsory", "Part-Time"),

    # 200 LEVEL - Third Term (11 Credits)
    ("MGT 204.3", "Quantitative Analysis in Management", 3, "200", "Third", "Compulsory", "Part-Time"),
    ("MGT 216.3", "Introduction to Financial Management", 3, "200", "Third", "Compulsory", "Part-Time"),
    ("MGT 218.3", "Green Management", 2, "200", "Third", "Compulsory", "Part-Time"),
    ("MGT 214.3", "Employment Relations and Conflict Management", 2, "200", "Third", "Required", "Part-Time"),
    ("FMS 201.3", "Community Service", 1, "200", "Third", "Required", "Part-Time"),

    # 300 LEVEL - First Term (12 Credits)
    ("GES 312.1", "Peace and Conflict Resolution", 2, "300", "First", "Compulsory", "Part-Time"),
    ("MGT 303.1", "Management Theory", 3, "300", "First", "Compulsory", "Part-Time"),
    ("MGT 305.1", "Financial Management", 3, "300", "First", "Compulsory", "Part-Time"),
    ("MGT 313.1", "Innovation Management", 2, "300", "First", "Compulsory", "Part-Time"),
    ("MGT 355.1", "Business Law", 2, "300", "First", "Required", "Part-Time"),

    # 300 LEVEL - Second Term (10 Credits)
    ("MGT 319.2", "E-Commerce (E-Business)", 2, "300", "Second", "Compulsory", "Part-Time"),
    ("MGT 321.2", "Business Start-up", 2, "300", "Second", "Compulsory", "Part-Time"),
    ("MGT 323.2", "Supply Chain Management", 2, "300", "Second", "Compulsory", "Part-Time"),
    ("MGT 315.2", "Business Research Methods", 2, "300", "Second", "Required", "Part-Time"),
    ("GES 300.2", "Venture Creation", 2, "300", "Second", "Compulsory", "Part-Time"),

    # 300 LEVEL - Third Term (13 Credits)
    ("MGT 310.3", "Production and Operation Management", 3, "300", "Third", "Compulsory", "Part-Time"),
    ("MGT 302.3", "Human Behaviour in Organisations", 3, "300", "Third", "Compulsory", "Part-Time"),
    ("MGT 304.3", "Human Resource Management", 3, "300", "Third", "Compulsory", "Part-Time"),
    ("MGT 320.3", "Fundamentals of Business Data Analytics", 2, "300", "Third", "Required", "Part-Time"),
    ("MGT 312.3", "Small Business Management", 2, "300", "Third", "Compulsory", "Part-Time"),

    # 400 LEVEL - First Term (15 Credits)
    ("MGT 401.1", "Business Policy and Strategic Management", 3, "400", "First", "Compulsory", "Part-Time"),
    ("MGT 409.1", "Management Information System", 2, "400", "First", "Compulsory", "Part-Time"),
    ("MGT 411.1", "Analysis for Business Decision", 3, "400", "First", "Compulsory", "Part-Time"),
    ("MGT 415.1", "Service Sector Management", 2, "400", "First", "Required", "Part-Time"),
    ("MGT 405.1", "Public Sector Management", 2, "400", "First", "Required", "Part-Time"),
    ("MGT 420.1", "Internship (Industrial Exposure Programme)", 3, "400", "First", "Compulsory", "Part-Time"),

    # 400 LEVEL - Second Term (12 Credits)
    ("MGT 417.2", "Feasibilities and Business Planning", 2, "400", "Second", "Required", "Part-Time"),
    ("MGT 400.2", "Entrepreneurship Project", 2, "400", "Second", "Required", "Part-Time"),
    ("MGT 403.2", "Labour Economics", 2, "400", "Second", "Required", "Part-Time"),
    ("MGT 402.2", "Strategic Thinking and Problem Solving", 3, "400", "Second", "Compulsory", "Part-Time"),
    ("MGT 406.2", "International Business", 3, "400", "Second", "Compulsory", "Part-Time"),

    # 400 LEVEL - Third Term (11 Credits)
    ("MGT 418.3", "Public Project Analysis and Management", 3, "400", "Third", "Required", "Part-Time"),
    ("MGT 414.3", "Comparative Management", 2, "400", "Third", "Required", "Part-Time"),
    ("MGT 498.3", "Research Project", 6, "400", "Third", "Required", "Part-Time"),
]


class Database:
    """Thin wrapper around a single SQLite connection for the app."""

    def __init__(self, db_path=DB_FILE):
        self.conn = sqlite3.connect(str(db_path))
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.row_factory = sqlite3.Row
        self._create_tables()

    # ------------------------------------------------------------------
    # Schema
    # ------------------------------------------------------------------
    def _create_tables(self):
        cur = self.conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                faculty TEXT,
                department TEXT,
                entry_year TEXT,
                passport_path TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime'))
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_code TEXT NOT NULL,
                course_title TEXT NOT NULL,
                credit_units INTEGER NOT NULL DEFAULT 3,
                level TEXT DEFAULT '100',
                semester TEXT DEFAULT 'First',
                status TEXT DEFAULT 'Compulsory',
                program TEXT DEFAULT 'Full-Time',
                remark TEXT,
                UNIQUE(course_code, level, semester, program)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                score REAL DEFAULT 0,
                grade TEXT DEFAULT 'F',
                grade_point REAL DEFAULT 0,
                session TEXT,
                semester TEXT DEFAULT 'First',
                is_carryover INTEGER DEFAULT 0,
                FOREIGN KEY(course_id) REFERENCES courses(id),
                FOREIGN KEY(student_id) REFERENCES students(id),
                UNIQUE(student_id, course_id, session, semester)
            )
            """
        )

        # Dynamic migration for missing columns
        columns_to_add = [
            ("surname", "TEXT"),
            ("firstname", "TEXT"),
            ("other_name", "TEXT"),
            ("dob", "TEXT"),
            ("sex", "TEXT"),
            ("marital_status", "TEXT"),
            ("gsm", "TEXT"),
            ("sponsor_gsm", "TEXT"),
            ("guardian_rel", "TEXT"),
            ("email", "TEXT"),
            ("state_of_origin", "TEXT"),
            ("lga", "TEXT"),
            ("passport_path", "TEXT"),
            ("created_at", "TEXT DEFAULT (datetime('now', 'localtime'))"),
        ]
        for col_name, col_type in columns_to_add:
            try:
                cur.execute(f"ALTER TABLE students ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError:
                pass  # Already exists

        courses_cols_to_add = [
            ("program", "TEXT DEFAULT 'Full-Time'"),
        ]
        for col_name, col_type in courses_cols_to_add:
            try:
                cur.execute(f"ALTER TABLE courses ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError:
                pass

        results_cols_to_add = [
            ("is_waived", "INTEGER DEFAULT 0"),
            ("waiver_grade", "TEXT"),
            ("remark", "TEXT"),
            ("level", "TEXT"),
        ]
        for col_name, col_type in results_cols_to_add:
            try:
                cur.execute(f"ALTER TABLE results ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError:
                pass  # Already exists

        # Check if courses table needs migration to include 'program' in UNIQUE constraint
        schema_row = cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='courses'").fetchone()
        if schema_row and schema_row[0]:
            sql_text = schema_row[0].replace(" ", "").upper()
            if "UNIQUE(COURSE_CODE,LEVEL,SEMESTER)" in sql_text and "PROGRAM" not in sql_text.split("UNIQUE(")[1]:
                cur.execute("PRAGMA legacy_alter_table = ON")
                cur.execute("ALTER TABLE courses RENAME TO courses_old")
                cur.execute(
                    """
                    CREATE TABLE courses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        course_code TEXT NOT NULL,
                        course_title TEXT NOT NULL,
                        credit_units INTEGER NOT NULL DEFAULT 3,
                        level TEXT DEFAULT '100',
                        semester TEXT DEFAULT 'First',
                        status TEXT DEFAULT 'Compulsory',
                        program TEXT DEFAULT 'Full-Time',
                        remark TEXT,
                        UNIQUE(course_code, level, semester, program)
                    )
                    """
                )
                cur.execute(
                    """
                    INSERT OR IGNORE INTO courses (id, course_code, course_title, credit_units, level, semester, status, program, remark)
                    SELECT id, course_code, course_title, credit_units, level, semester, status, COALESCE(program, 'Full-Time'), remark
                    FROM courses_old
                    """
                )
                cur.execute("DROP TABLE courses_old")
                cur.execute("PRAGMA legacy_alter_table = OFF")

        # Check if results table references courses_old or needs fix
        res_schema_row = cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='results'").fetchone()
        if res_schema_row and res_schema_row[0]:
            if "courses_old" in res_schema_row[0]:
                cur.execute("PRAGMA legacy_alter_table = ON")
                cur.execute("ALTER TABLE results RENAME TO results_old")
                cur.execute(
                    """
                    CREATE TABLE results (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_id INTEGER NOT NULL,
                        course_id INTEGER NOT NULL,
                        score REAL DEFAULT 0,
                        grade TEXT DEFAULT 'F',
                        grade_point REAL DEFAULT 0,
                        session TEXT,
                        semester TEXT DEFAULT 'First',
                        is_carryover INTEGER DEFAULT 0,
                        is_waived INTEGER DEFAULT 0,
                        waiver_grade TEXT,
                        remark TEXT,
                        level TEXT,
                        FOREIGN KEY(course_id) REFERENCES courses(id),
                        FOREIGN KEY(student_id) REFERENCES students(id),
                        UNIQUE(student_id, course_id, session, semester)
                    )
                    """
                )
                cur.execute(
                    """
                    INSERT INTO results (id, student_id, course_id, score, grade, grade_point, session, semester, is_carryover, is_waived, waiver_grade, remark, level)
                    SELECT id, student_id, course_id, score, grade, grade_point, session, semester, is_carryover, COALESCE(is_waived, 0), waiver_grade, remark, level
                    FROM results_old
                    """
                )
                cur.execute("DROP TABLE results_old")
                cur.execute("PRAGMA legacy_alter_table = OFF")

        # Auto-seed default Full-Time courses
        for code, title, units, level, semester, status in DEFAULT_COURSES:
            cur.execute(
                """
                INSERT OR IGNORE INTO courses
                    (course_code, course_title, credit_units, level, semester, status, program, remark)
                VALUES (?, ?, ?, ?, ?, ?, 'Full-Time', NULL)
                """,
                (code, title, units, level, semester, status),
            )

        # Auto-seed default Part-Time courses
        for code, title, units, level, semester, status, program in DEFAULT_COURSES_PART_TIME:
            cur.execute(
                """
                INSERT OR IGNORE INTO courses
                    (course_code, course_title, credit_units, level, semester, status, program, remark)
                VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
                """,
                (code, title, units, level, semester, status, program),
            )

        # Update course statuses in database to match current official curriculum
        for code, title, units, level, semester, status in DEFAULT_COURSES:
            cur.execute(
                """
                UPDATE courses SET status=?, course_title=?, credit_units=?
                WHERE course_code=? AND level=? AND semester=? AND program='Full-Time'
                """,
                (status, title, units, code, level, semester),
            )

        for code, title, units, level, semester, status, program in DEFAULT_COURSES_PART_TIME:
            cur.execute(
                """
                UPDATE courses SET status=?, course_title=?, credit_units=?
                WHERE course_code=? AND level=? AND semester=? AND program=?
                """,
                (status, title, units, code, level, semester, program),
            )

        # Migrate any existing MOT course codes to MGT
        cur.execute("UPDATE courses SET course_code = 'MGT ' || SUBSTR(course_code, 5) WHERE course_code LIKE 'MOT %'")

        self.conn.commit()
        self.sync_repeat_grade_points()

    # ------------------------------------------------------------------
    # Students
    # ------------------------------------------------------------------
    def save_student(self, data: dict, student_id=None):
        """Insert or update a comprehensive student profile."""
        surname = data.get("surname", "").strip()
        firstname = data.get("firstname", "").strip()
        other_name = data.get("other_name", "").strip()

        # Build combined fullname
        parts = [p for p in [surname, firstname, other_name] if p]
        fullname = " ".join(parts) if parts else data.get("fullname", "").strip()

        matric_no = data.get("matric_no", "").strip().upper()
        batch = data.get("batch", "U2022").strip().upper()
        student_type = data.get("student_type", "Full-Time").strip()

        dob = data.get("dob", "").strip()
        sex = data.get("sex", "").strip()
        marital_status = data.get("marital_status", "").strip()
        gsm = data.get("gsm", "").strip()
        sponsor_gsm = data.get("sponsor_gsm", "").strip()
        guardian_rel = data.get("guardian_rel", "").strip()
        email = data.get("email", "").strip()
        state_of_origin = data.get("state_of_origin", "").strip()
        lga = data.get("lga", "").strip()
        faculty = data.get("faculty", "").strip()
        department = data.get("department", "").strip()
        entry_year = data.get("entry_year", "").strip()
        passport_path = data.get("passport_path", "").strip()

        cur = self.conn.cursor()
        if student_id:
            cur.execute(
                """
                UPDATE students SET
                    matric_no=?, surname=?, firstname=?, other_name=?, fullname=?,
                    batch=?, student_type=?, dob=?, sex=?, marital_status=?,
                    gsm=?, sponsor_gsm=?, guardian_rel=?, email=?,
                    state_of_origin=?, lga=?, faculty=?, department=?, entry_year=?,
                    passport_path=?
                WHERE id=?
                """,
                (matric_no, surname, firstname, other_name, fullname,
                 batch, student_type, dob, sex, marital_status,
                 gsm, sponsor_gsm, guardian_rel, email,
                 state_of_origin, lga, faculty, department, entry_year,
                 passport_path, student_id),
            )
            self.conn.commit()
            return student_id
        else:
            created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cur.execute(
                """
                INSERT INTO students (
                    matric_no, surname, firstname, other_name, fullname,
                    batch, student_type, dob, sex, marital_status,
                    gsm, sponsor_gsm, guardian_rel, email,
                    state_of_origin, lga, faculty, department, entry_year,
                    passport_path, created_at
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (matric_no, surname, firstname, other_name, fullname,
                 batch, student_type, dob, sex, marital_status,
                 gsm, sponsor_gsm, guardian_rel, email,
                 state_of_origin, lga, faculty, department, entry_year,
                 passport_path, created_at),
            )
            self.conn.commit()
            return cur.lastrowid

    def add_student(self, matric_no, fullname, batch, student_type,
                    department, faculty, entry_year):
        return self.save_student({
            "matric_no": matric_no,
            "fullname": fullname,
            "batch": batch,
            "student_type": student_type,
            "department": department,
            "faculty": faculty,
            "entry_year": entry_year,
        })

    def update_student(self, student_id, matric_no, fullname, batch,
                       student_type, department, faculty, entry_year):
        return self.save_student({
            "matric_no": matric_no,
            "fullname": fullname,
            "batch": batch,
            "student_type": student_type,
            "department": department,
            "faculty": faculty,
            "entry_year": entry_year,
        }, student_id=student_id)

    def delete_student(self, student_id):
        self.conn.execute("DELETE FROM results WHERE student_id=?", (student_id,))
        self.conn.execute("DELETE FROM students WHERE id=?", (student_id,))
        self.conn.commit()

    def get_all_students(self, student_type=None, batch=None, search_term=None):
        query = "SELECT * FROM students WHERE 1=1"
        params = []
        if student_type:
            query += " AND student_type=?"
            params.append(student_type)
        if batch:
            query += " AND batch=?"
            params.append(batch)
        if search_term:
            like = f"%{search_term.strip()}%"
            query += " AND (matric_no LIKE ? OR fullname LIKE ? OR surname LIKE ? OR firstname LIKE ? OR department LIKE ?)"
            params.extend([like, like, like, like, like])
        query += " ORDER BY matric_no ASC"
        rows = self.conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def get_all_student_ids(self):
        """Returns sorted list of all student IDs for dialog navigation."""
        rows = self.conn.execute("SELECT id FROM students ORDER BY id ASC").fetchall()
        return [r["id"] for r in rows]

    def get_recent_students(self, student_type=None, limit=25):
        query = "SELECT * FROM students WHERE 1=1"
        params = []
        if student_type:
            query += " AND student_type=?"
            params.append(student_type)
        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        rows = self.conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def get_student_by_id(self, student_id):
        row = self.conn.execute(
            "SELECT * FROM students WHERE id=?", (student_id,)
        ).fetchone()
        return dict(row) if row else None

    def get_student_by_matric(self, matric_no):
        row = self.conn.execute(
            "SELECT * FROM students WHERE matric_no=?", (matric_no,)
        ).fetchone()
        return dict(row) if row else None

    def get_student_count(self, student_type=None):
        if student_type:
            return self.conn.execute(
                "SELECT COUNT(*) as cnt FROM students WHERE student_type=?", (student_type,)
            ).fetchone()["cnt"]
        return self.conn.execute(
            "SELECT COUNT(*) as cnt FROM students"
        ).fetchone()["cnt"]

    def get_distinct_batches_with_counts(self):
        """Returns dict of {batch: count} and ensures U2022-U2025 default sets exist."""
        base_batches = ["U2022", "U2023", "U2024", "U2025"]
        rows = self.conn.execute(
            "SELECT batch, COUNT(*) as cnt FROM students WHERE batch IS NOT NULL AND batch != '' GROUP BY batch"
        ).fetchall()
        counts = {r["batch"]: r["cnt"] for r in rows}
        for b in base_batches:
            if b not in counts:
                counts[b] = 0
        # Return sorted list of tuples: [('U2022', 1), ('U2023', 0), ...]
        return sorted(counts.items(), key=lambda x: x[0])

    def get_distinct_batches(self):
        batch_counts = self.get_distinct_batches_with_counts()
        return [b[0] for b in batch_counts]

    # ------------------------------------------------------------------
    # Courses
    # ------------------------------------------------------------------
    def add_course(self, course_code, course_title, credit_units, level,
                   semester, status="Compulsory", program="Full-Time", remark=None):
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT OR IGNORE INTO courses
                (course_code, course_title, credit_units, level, semester, status, program, remark)
            VALUES (?,?,?,?,?,?,?,?)
            """,
            (course_code, course_title, credit_units, level, semester, status, program, remark),
        )
        self.conn.commit()
        return cur.lastrowid

    def update_course(self, course_id, course_code, course_title,
                      credit_units, level, semester, status=None, program=None, remark=None):
        self.conn.execute(
            """
            UPDATE courses SET course_code=?, course_title=?, credit_units=?,
                level=?, semester=?, status=?, program=COALESCE(?, program), remark=?
            WHERE id=?
            """,
            (course_code, course_title, credit_units, level, semester,
             status, program, remark, course_id),
        )
        self.conn.commit()

    def delete_course(self, course_id):
        self.conn.execute("DELETE FROM results WHERE course_id=?", (course_id,))
        self.conn.execute("DELETE FROM courses WHERE id=?", (course_id,))
        self.conn.commit()

    def get_all_courses(self, level=None, semester=None, program=None):
        query = "SELECT * FROM courses WHERE 1=1"
        params = []
        if level:
            query += " AND level=?"
            params.append(level)
        if semester:
            query += " AND semester=?"
            params.append(semester)
        if program:
            query += " AND (program=? OR program='Both' OR program IS NULL)"
            params.append(program)
        query += " ORDER BY level, semester, course_code"
        rows = self.conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def get_course_by_id(self, course_id):
        row = self.conn.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
        return dict(row) if row else None

    # ------------------------------------------------------------------
    # Results
    # ------------------------------------------------------------------
    def is_repeat_course(self, student_id, course_id, session=None, semester=None, result_id=None):
        """
        Check if taking this course is a second/repeat attempt for the student.
        Returns True if:
        - An earlier result exists for this student and course (by earlier session, earlier id, etc.), OR
        - The course's catalogue level is lower than the student's level for this session.
        """
        # 1. Check for earlier result records in DB
        if result_id:
            earlier = self.conn.execute(
                """
                SELECT id, session, semester FROM results
                WHERE student_id=? AND course_id=? AND id != ?
                ORDER BY session, id
                """,
                (student_id, course_id, result_id),
            ).fetchall()
            for row in earlier:
                if session and row["session"]:
                    if str(row["session"]) < str(session):
                        return True
                    elif str(row["session"]) == str(session):
                        if row["id"] < result_id:
                            return True
                elif row["id"] < result_id:
                    return True
        elif session:
            earlier = self.conn.execute(
                """
                SELECT id, session, semester FROM results
                WHERE student_id=? AND course_id=?
                """,
                (student_id, course_id),
            ).fetchall()
            for row in earlier:
                if str(row["session"]) < str(session):
                    return True
                elif str(row["session"]) == str(session):
                    if semester and row["semester"] and row["semester"] != semester:
                        return True

        # 2. Check if course level is lower than session level based on student entry year
        student = self.get_student_by_id(student_id)
        if student and session and "/" in session:
            try:
                sess_start = int(session.split("/")[0])
                entry_yr = int(student["entry_year"] or "2022")
                current_lvl = (sess_start - entry_yr + 1) * 100
                course = self.get_course_by_id(course_id)
                if course and course["level"]:
                    course_lvl = int(course["level"])
                    if course_lvl < current_lvl:
                        return True
            except (ValueError, TypeError, IndexError):
                pass

        return False

    def sync_repeat_grade_points(self):
        """
        Scans all results in the database and ensures that any repeat/carryover
        attempts have grades A, B, C capped at 3.0 GP as per academic policy.
        """
        try:
            rows = self.conn.execute("SELECT * FROM results WHERE is_waived = 0 OR is_waived IS NULL").fetchall()
            for r in rows:
                is_rep = self.is_repeat_course(
                    r["student_id"], r["course_id"],
                    session=r["session"], semester=r["semester"], result_id=r["id"]
                )
                grade, expected_gp = score_to_grade(r["score"], is_repeat=is_rep)
                if r["grade_point"] != expected_gp or r["grade"] != grade:
                    self.conn.execute(
                        "UPDATE results SET grade=?, grade_point=? WHERE id=?",
                        (grade, expected_gp, r["id"])
                    )
            self.conn.commit()
        except sqlite3.OperationalError:
            pass

    def add_result(self, student_id, course_id, score, session, semester, level=None):
        is_repeat = self.is_repeat_course(student_id, course_id, session=session, semester=semester)
        grade, grade_point = score_to_grade(score, is_repeat=is_repeat)
        is_carryover = 1 if grade in ("D", "E", "F") else 0
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT INTO results
                (student_id, course_id, score, grade, grade_point, session, semester, is_carryover, level)
            VALUES (?,?,?,?,?,?,?,?,?)
            """,
            (student_id, course_id, score, grade, grade_point, session,
             semester, is_carryover, level),
        )
        self.conn.commit()
        return cur.lastrowid

    def update_result(self, student_id, course_id, score, session, semester, level=None):
        is_repeat = self.is_repeat_course(student_id, course_id, session=session, semester=semester)
        grade, grade_point = score_to_grade(score, is_repeat=is_repeat)
        is_carryover = 1 if grade in ("D", "E", "F") else 0
        self.conn.execute(
            """
            UPDATE results SET score=?, grade=?, grade_point=?, is_carryover=?, level=COALESCE(?, level)
            WHERE student_id=? AND course_id=? AND session=? AND semester=?
            """,
            (score, grade, grade_point, is_carryover, level, student_id, course_id,
             session, semester),
        )
        self.conn.commit()

    def can_waive_course(self, student_id, course_id, result_id=None):
        """
        Check whether a course can be waived according to academic regulations:
        1. Max 2 courses can be waived per student across their entire program.
        2. GES courses cannot be waived.
        3. FMS Community Service / Project courses cannot be waived.
        4. Internship cannot be waived.

        Returns (allowed: bool, reason: str).
        """
        course = self.get_course_by_id(course_id)
        if not course:
            return False, "Course not found."

        code = (course["course_code"] or "").upper().strip()
        title = (course["course_title"] or "").lower().strip()

        # Check GES
        if code.startswith("GES"):
            return False, f"GES courses ({course['course_code']}) cannot be waived.\nGeneral Studies courses are mandatory university requirements."

        # Check FMS / Project
        if code.startswith("FMS") or "project" in title:
            return False, f"Project / FMS courses ({course['course_code']} — {course['course_title']}) cannot be waived.\nThese are mandatory degree requirements."

        # Check Internship
        if "internship" in title or "industrial exposure" in title or code == "MGT 420.1":
            return False, f"Internship ({course['course_code']} — {course['course_title']}) cannot be waived.\nInternship is a mandatory degree requirement."

        # Check max 2 waived courses
        if result_id:
            waived_count = self.conn.execute(
                "SELECT COUNT(*) as cnt FROM results WHERE student_id=? AND is_waived=1 AND id != ?",
                (student_id, result_id)
            ).fetchone()["cnt"]
        else:
            waived_count = self.conn.execute(
                "SELECT COUNT(*) as cnt FROM results WHERE student_id=? AND is_waived=1 AND course_id != ?",
                (student_id, course_id)
            ).fetchone()["cnt"]

        if waived_count >= 2:
            return False, "Maximum Waiver Limit Reached:\nA student is only allowed to waive a maximum of two (2) courses."

        return True, ""

    def waive_result(self, result_id):
        """
        Waive a course result.
        When waiving a failed course (Grade F), the F (0.0 GP) is retained and
        its credit units (CU) are used in calculating GPA & CGPA, while clearing carryover.
        """
        res = self.conn.execute("SELECT student_id, course_id, score, grade, grade_point FROM results WHERE id=?", (result_id,)).fetchone()
        if not res:
            raise ValueError("Result record not found.")

        allowed, reason = self.can_waive_course(res["student_id"], res["course_id"], result_id=result_id)
        if not allowed:
            raise ValueError(reason)

        score = res["score"] if res["score"] is not None else 0.0
        grade = res["grade"] if res["grade"] else "F"
        grade_point = res["grade_point"] if res["grade_point"] is not None else 0.0

        self.conn.execute(
            """
            UPDATE results SET
                is_waived=1,
                waiver_grade=?,
                grade=?,
                grade_point=?,
                score=?,
                is_carryover=0,
                remark='Waived'
            WHERE id=?
            """,
            (grade, grade, grade_point, score, result_id),
        )
        self.conn.commit()

    def unwaive_result(self, result_id):
        """Remove waiver status from a result, restoring carryover flag if grade is failing."""
        res = self.conn.execute("SELECT score, grade, grade_point FROM results WHERE id=?", (result_id,)).fetchone()
        if not res:
            return
        grade = res["grade"] or "F"
        is_carryover = 1 if grade in ("D", "E", "F") else 0
        self.conn.execute(
            """
            UPDATE results SET
                is_waived=0,
                waiver_grade=NULL,
                is_carryover=?,
                remark=NULL
            WHERE id=?
            """,
            (is_carryover, result_id),
        )
        self.conn.commit()

    def get_waived_courses(self, student_id, level=None):
        """Returns all waived courses for a student, optionally filtered by level."""
        query = """
            SELECT r.*, c.course_code, c.course_title, c.credit_units, c.level as c_level
            FROM results r JOIN courses c ON r.course_id = c.id
            WHERE r.student_id=? AND r.is_waived=1
        """
        params = [student_id]
        if level:
            query += " AND c.level=?"
            params.append(level)
        query += " ORDER BY c.course_code"
        rows = self.conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def delete_result(self, result_id):
        self.conn.execute("DELETE FROM results WHERE id=?", (result_id,))
        self.conn.commit()

    def get_student_session_results(self, student_id, session=None):
        """Returns all result records with course details for a student and optional session."""
        query = """
            SELECT r.*, c.course_code, c.course_title, c.credit_units,
                   COALESCE(r.level, c.level) as c_level, c.semester as c_semester, c.status as c_status
            FROM results r JOIN courses c ON r.course_id = c.id
            WHERE r.student_id=?
        """
        params = [student_id]
        if session:
            query += " AND r.session=?"
            params.append(session)
        query += " ORDER BY r.session, r.semester, c.course_code"
        rows = self.conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def get_student_scores_dict(self, student_id, session=None):
        """Returns dict of {course_id: score} for pre-filling scores."""
        query = "SELECT course_id, score, session, semester FROM results WHERE student_id=?"
        params = [student_id]
        if session:
            query += " AND session=?"
            params.append(session)
        rows = self.conn.execute(query, params).fetchall()
        return {r["course_id"]: r["score"] for r in rows}

    def save_bulk_results(self, student_id, session, results_list):
        """
        Save or update a batch of course scores for a student.
        results_list: [{'course_id': cid, 'score': score, 'semester': sem, 'level': lvl}, ...]
        """
        cur = self.conn.cursor()
        for item in results_list:
            cid = item["course_id"]
            score = float(item["score"])
            semester = item.get("semester", "First")
            level = item.get("level", None)
            is_repeat = self.is_repeat_course(student_id, cid, session=session, semester=semester)
            grade, gp = score_to_grade(score, is_repeat=is_repeat)
            is_carryover = 1 if grade in ("D", "E", "F") else 0
            cur.execute(
                """
                INSERT INTO results (student_id, course_id, score, grade, grade_point, session, semester, is_carryover, level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(student_id, course_id, session, semester) DO UPDATE SET
                    score=excluded.score,
                    grade=excluded.grade,
                    grade_point=excluded.grade_point,
                    is_carryover=excluded.is_carryover,
                    level=COALESCE(excluded.level, results.level)
                """,
                (student_id, cid, score, grade, gp, session, semester, is_carryover, level),
            )
        self.conn.commit()

    def get_student_results(self, student_id):
        rows = self.conn.execute(
            """
            SELECT r.*, c.course_code, c.course_title, c.credit_units,
                   COALESCE(r.level, c.level) as c_level, c.semester as c_semester,
                   c.status as c_status
            FROM results r JOIN courses c ON r.course_id = c.id
            WHERE r.student_id=?
            ORDER BY r.session, COALESCE(r.level, c.level), r.semester, c.course_code
            """,
            (student_id,),
        ).fetchall()
        return [dict(r) for r in rows]

    def get_yearly_breakdown(self, student_id):
        """
        Returns a list of dicts for each distinct academic session/year:
        [{'year': 'YEAR 1' or session, 'qp': float, 'cu': int}, ...]
        """
        rows = self.conn.execute(
            """
            SELECT r.session, COALESCE(r.level, c.level) as level, r.grade_point, c.credit_units
            FROM results r JOIN courses c ON r.course_id = c.id
            WHERE r.student_id=?
            ORDER BY r.session, COALESCE(r.level, c.level)
            """,
            (student_id,),
        ).fetchall()

        year_map = {}
        for row in rows:
            session = row["session"] or (f"{row['level']} Level" if row["level"] else "Year 1")
            if session not in year_map:
                year_map[session] = {"year": session, "qp": 0.0, "cu": 0}
            year_map[session]["qp"] += (row["grade_point"] or 0.0) * (row["credit_units"] or 0)
            year_map[session]["cu"] += (row["credit_units"] or 0)

        # Format output
        results = []
        for key, val in year_map.items():
            results.append({
                "year": val["year"],
                "qp": round(val["qp"], 1),
                "cu": val["cu"]
            })
        return results

    def get_outstanding_courses(self, student_id):
        """Courses where student's grade is failing/carryover (F) and not waived, and not passed in any attempt."""
        rows = self.conn.execute(
            """
            SELECT c.course_code, c.course_title, c.credit_units, r.score, r.grade, r.session, r.id as result_id
            FROM results r JOIN courses c ON r.course_id = c.id
            WHERE r.id IN (
                SELECT r_sub.id FROM results r_sub
                WHERE r_sub.student_id = ?
                  AND (r_sub.grade IN ('F') OR r_sub.is_carryover = 1)
                  AND (r_sub.is_waived = 0 OR r_sub.is_waived IS NULL)
                  AND r_sub.id = (
                      SELECT r_latest.id FROM results r_latest
                      WHERE r_latest.student_id = r_sub.student_id AND r_latest.course_id = r_sub.course_id
                      ORDER BY r_latest.session DESC, r_latest.id DESC
                      LIMIT 1
                  )
            )
            AND c.id NOT IN (
                SELECT r2.course_id FROM results r2
                WHERE r2.student_id = ?
                  AND (r2.is_waived = 1 OR r2.grade IN ('A', 'B', 'C', 'D', 'E'))
            )
            ORDER BY c.course_code
            """,
            (student_id, student_id),
        ).fetchall()
        return [dict(r) for r in rows]

    def calculate_cgpa(self, student_id):
        rows = self.conn.execute(
            "SELECT r.grade_point, c.credit_units FROM results r "
            "JOIN courses c ON r.course_id = c.id WHERE r.student_id=?",
            (student_id,),
        ).fetchall()
        total_units = sum(row["credit_units"] for row in rows)
        if total_units == 0:
            return 0.0
        total_points = sum(row["grade_point"] * row["credit_units"] for row in rows)
        return round(total_points / total_units, 2)

    def validate_student_credit_load(self, student_id, session=None, semester=None):
        """
        Validates academic credit load regulations:
        - Minimum 15 credit units per semester (or 10 for part-time terms).
        - Minimum 30 credit units per academic session.
        Returns a dict of warnings/status.
        """
        student = self.get_student_by_id(student_id)
        if not student:
            return {"valid": False, "warnings": ["Student not found"]}

        is_pt = (student.get("student_type") == "Part-Time")
        min_sem_cu = 10 if is_pt else 15
        min_sess_cu = 30

        query = """
            SELECT r.session, r.semester, SUM(c.credit_units) as total_cu,
                   SUM(CASE WHEN r.grade != 'F' OR r.is_waived = 1 THEN c.credit_units ELSE 0 END) as earned_cu
            FROM results r JOIN courses c ON r.course_id = c.id
            WHERE r.student_id = ?
        """
        params = [student_id]
        if session:
            query += " AND r.session = ?"
            params.append(session)
        if semester:
            query += " AND r.semester = ?"
            params.append(semester)
        query += " GROUP BY r.session, r.semester"

        rows = self.conn.execute(query, params).fetchall()
        warnings = []

        sess_totals = {}
        for row in rows:
            sess = row["session"] or "Unknown"
            sem = row["semester"] or "Unknown"
            reg_cu = row["total_cu"] or 0
            if reg_cu < min_sem_cu:
                warnings.append(f"Session {sess} ({sem}): Registered only {reg_cu} CU (Minimum required is {min_sem_cu} CU).")
            if sess not in sess_totals:
                sess_totals[sess] = 0
            sess_totals[sess] += reg_cu

        for sess, tot_cu in sess_totals.items():
            if tot_cu < min_sess_cu:
                warnings.append(f"Session {sess}: Registered total of {tot_cu} CU across terms/semesters (Minimum required is {min_sess_cu} CU).")

        return {
            "valid": len(warnings) == 0,
            "min_semester_cu": min_sem_cu,
            "min_session_cu": min_sess_cu,
            "warnings": warnings
        }

    def get_graduation_evaluation(self, student_id):
        """
        Evaluates graduation eligibility according to the 5 official regulations:
        i.   Minimum Graduation Requirement: Total accumulated credit units >= 123.
        ii.  Compulsory 94 Credit Units: From CCMAS, GES, Entrepreneurship Project (MGT 400), Research Project (MGT 498).
        iii. Remaining 29 Credit Units: Selected from student's best-performing eligible results to reach 123.
        iv.  Minimum Credit Units Per Semester: >= 15 CU per semester (>= 10 for Part-Time terms).
        v.   Minimum Credit Units Per Session: >= 30 CU per session.
        """
        student = self.get_student_by_id(student_id)
        if not student:
            return None

        # Fetch all passed / waived courses
        query = """
            SELECT r.*, c.course_code, c.course_title, c.credit_units, c.status as c_status
            FROM results r JOIN courses c ON r.course_id = c.id
            WHERE r.student_id = ? AND (r.grade != 'F' OR r.is_waived = 1)
            ORDER BY c.course_code
        """
        passed_rows = self.conn.execute(query, (student_id,)).fetchall()

        # Deduplicate courses by taking the best attempt if repeated
        passed_by_course = {}
        for r in passed_rows:
            cid = r["course_id"]
            if cid not in passed_by_course or r["grade_point"] > passed_by_course[cid]["grade_point"]:
                passed_by_course[cid] = r

        compulsory_passed = []
        required_passed = []
        compulsory_cu = 0
        required_cu = 0

        for r in passed_by_course.values():
            status = r["c_status"] or "Compulsory"
            code = (r["course_code"] or "").upper()
            cu = r["credit_units"] or 0
            
            # Check if compulsory category (CCMAS, GES, MGT 400, MGT 498, or status == Compulsory)
            is_comp = (status == "Compulsory" or code.startswith("GES") or "400" in code or "498" in code)
            if is_comp:
                compulsory_passed.append(r)
                compulsory_cu += cu
            else:
                required_passed.append(r)
                required_cu += cu

        total_passed_cu = compulsory_cu + required_cu
        target_total_cu = 123
        target_compulsory_cu = 94
        target_remaining_cu = 29

        is_eligible = (compulsory_cu >= target_compulsory_cu and total_passed_cu >= target_total_cu)

        # Credit load check
        load_check = self.validate_student_credit_load(student_id)

        return {
            "is_eligible": is_eligible,
            "total_passed_cu": total_passed_cu,
            "compulsory_cu": compulsory_cu,
            "target_compulsory_cu": target_compulsory_cu,
            "required_cu": required_cu,
            "target_remaining_cu": target_remaining_cu,
            "target_total_cu": target_total_cu,
            "compulsory_satisfied": compulsory_cu >= target_compulsory_cu,
            "total_cu_satisfied": total_passed_cu >= target_total_cu,
            "credit_load_warnings": load_check["warnings"],
        }

    def close(self):
        self.conn.close()
