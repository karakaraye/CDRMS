"""
dialogs.py
----------
Modal dialogs for CDRMS:
  - StudentDialog: Complete "Register a student" dialog matching the reference UI
  - CourseManagerDialog: Catalogue management
  - CourseFormDialog: Course form
  - ResultDialog: Full Score Sheet dialog with all courses lined up by Level/Semester for direct score entry
  - WorksheetDialog: Academic results worksheet
  - AboutDialog: About dialog
"""

import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

try:
    from PIL import Image as PILImage, ImageTk as PILImageTk
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

from database import score_to_grade
import transcript_generator

NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
    "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

COLOR_PRIMARY = "#0858a8"
COLOR_PRIMARY_HOVER = "#0b66c2"
COLOR_CANCEL = "#777777"


class StudentDialog(tk.Toplevel):
    """
    Exact implementation of the "Register a student" modal window.
    Features Personal Info, Contact Info, Passport preview/upload, and <<< SAVE CANCEL >>> buttons.
    """

    def __init__(self, parent, db, student=None, on_saved=None, default_type="Full-Time"):
        super().__init__(parent)
        self.db = db
        self.student = student
        self.on_saved = on_saved
        self.passport_file_path = None

        self.title("Register a student")
        self.geometry("780x480")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()
        self.configure(bg="#f0f0f0")

        self.all_ids = self.db.get_all_student_ids()
        self.current_id = self.student["id"] if self.student else None

        self._build_ui(default_type)
        if self.student:
            self._load_student_data(self.student)

    def _build_ui(self, default_type):
        main_frame = tk.Frame(self, bg="#f0f0f0", padx=16, pady=12)
        main_frame.pack(fill="both", expand=True)

        # Left Column: Forms (Personal & Contact Information)
        left_box = tk.Frame(main_frame, bg="#f0f0f0")
        left_box.pack(side="left", fill="both", expand=True, padx=(0, 14))

        # Right Column: Passport + Faculty
        right_box = tk.Frame(main_frame, bg="#f0f0f0", width=160)
        right_box.pack(side="right", fill="y")
        right_box.pack_propagate(False)

        # -------------------------------------------------------------
        # 1. Personal Information Section
        # -------------------------------------------------------------
        p_header = tk.Frame(left_box, bg="#f0f0f0")
        p_header.pack(fill="x", pady=(0, 4))
        tk.Label(
            p_header, text="Personal Information", font=("Segoe UI", 9, "bold"),
            bg="#f0f0f0", fg="#000000"
        ).pack(side="left")
        ttk.Separator(p_header, orient="horizontal").pack(side="left", fill="x", expand=True, padx=(8, 0), pady=6)

        p_form = tk.Frame(left_box, bg="#f0f0f0")
        p_form.pack(fill="x", pady=(0, 10))

        # Row 0: Program
        tk.Label(p_form, text="* Program:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=0, column=0, sticky="w", pady=3)
        self.cb_program = ttk.Combobox(p_form, values=["Full-Time", "Part-Time"], state="readonly", width=16)
        self.cb_program.set(default_type)
        self.cb_program.grid(row=0, column=1, sticky="w", pady=3, padx=(4, 0))

        # Row 1: Surname | Firstname | Other
        tk.Label(p_form, text="* Surname:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=1, column=0, sticky="w", pady=3)
        self.ent_surname = ttk.Entry(p_form, width=15)
        self.ent_surname.grid(row=1, column=1, sticky="w", pady=3, padx=(4, 8))

        tk.Label(p_form, text="* Firstname:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=1, column=2, sticky="w", pady=3)
        self.ent_firstname = ttk.Entry(p_form, width=15)
        self.ent_firstname.grid(row=1, column=3, sticky="w", pady=3, padx=(4, 8))

        tk.Label(p_form, text="Other:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=1, column=4, sticky="w", pady=3)
        self.ent_other = ttk.Entry(p_form, width=12)
        self.ent_other.grid(row=1, column=5, sticky="w", pady=3, padx=(4, 0))

        # Row 2: Batch | Matric No
        tk.Label(p_form, text="* Batch:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=2, column=0, sticky="w", pady=3)
        batches = self.db.get_distinct_batches()
        self.cb_batch = ttk.Combobox(p_form, values=batches, width=14)
        self.cb_batch.set(batches[0] if batches else "U2022")
        self.cb_batch.grid(row=2, column=1, sticky="w", pady=3, padx=(4, 8))

        tk.Label(p_form, text="* Matric No:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=2, column=2, sticky="w", pady=3)
        self.ent_matric = ttk.Entry(p_form, width=15)
        self.ent_matric.grid(row=2, column=3, sticky="w", pady=3, padx=(4, 0))

        # -------------------------------------------------------------
        # 2. Contact Information Section
        # -------------------------------------------------------------
        c_header = tk.Frame(left_box, bg="#f0f0f0")
        c_header.pack(fill="x", pady=(6, 4))
        tk.Label(
            c_header, text="Contact Information", font=("Segoe UI", 9, "bold"),
            bg="#f0f0f0", fg="#000000"
        ).pack(side="left")
        ttk.Separator(c_header, orient="horizontal").pack(side="left", fill="x", expand=True, padx=(8, 0), pady=6)

        c_form = tk.Frame(left_box, bg="#f0f0f0")
        c_form.pack(fill="x")

        # Row 0: Date Of Birth | Sex | Marital status
        tk.Label(c_form, text="Date Of Birth:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=0, column=0, sticky="w", pady=3)
        self.ent_dob = ttk.Entry(c_form, width=12)
        self.ent_dob.grid(row=0, column=1, sticky="w", pady=3, padx=(4, 8))

        tk.Label(c_form, text="Sex:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=0, column=2, sticky="w", pady=3)
        self.cb_sex = ttk.Combobox(c_form, values=["Male", "Female"], state="readonly", width=8)
        self.cb_sex.grid(row=0, column=3, sticky="w", pady=3, padx=(4, 8))

        tk.Label(c_form, text="Marital status:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=0, column=4, sticky="w", pady=3)
        self.cb_marital = ttk.Combobox(c_form, values=["Single", "Married", "Other"], state="readonly", width=9)
        self.cb_marital.set("Single")
        self.cb_marital.grid(row=0, column=5, sticky="w", pady=3, padx=(4, 0))

        # Row 1: Student GSM | Guardian/Sponsor GSM
        tk.Label(c_form, text="Student GSM:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=1, column=0, sticky="w", pady=3)
        self.ent_gsm = ttk.Entry(c_form, width=16)
        self.ent_gsm.grid(row=1, column=1, columnspan=2, sticky="w", pady=3, padx=(4, 8))

        tk.Label(c_form, text="Guardian/Sponsor GSM:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=1, column=3, sticky="w", pady=3)
        self.ent_sponsor_gsm = ttk.Entry(c_form, width=16)
        self.ent_sponsor_gsm.grid(row=1, column=4, columnspan=2, sticky="w", pady=3, padx=(4, 0))

        # Row 2: Guardian Relationship | Student Email
        tk.Label(c_form, text="Guardian Relationship:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=2, column=0, sticky="w", pady=3)
        self.cb_guardian_rel = ttk.Combobox(
            c_form, values=["Parent", "Father", "Mother", "Sibling", "Uncle", "Aunt", "Guardian", "Self", "Other"],
            width=14
        )
        self.cb_guardian_rel.set("Parent")
        self.cb_guardian_rel.grid(row=2, column=1, columnspan=2, sticky="w", pady=3, padx=(4, 8))

        tk.Label(c_form, text="Student Email:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=2, column=3, sticky="w", pady=3)
        self.ent_email = ttk.Entry(c_form, width=20)
        self.ent_email.grid(row=2, column=4, columnspan=2, sticky="w", pady=3, padx=(4, 0))

        # Row 3: State Of Origin | LGA
        tk.Label(c_form, text="State Of Origin:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=3, column=0, sticky="w", pady=3)
        self.cb_state = ttk.Combobox(c_form, values=NIGERIAN_STATES, width=14)
        self.cb_state.grid(row=3, column=1, columnspan=2, sticky="w", pady=3, padx=(4, 8))

        tk.Label(c_form, text="LGA:", font=("Segoe UI", 9), bg="#f0f0f0").grid(row=3, column=3, sticky="w", pady=3)
        self.ent_lga = ttk.Entry(c_form, width=16)
        self.ent_lga.grid(row=3, column=4, columnspan=2, sticky="w", pady=3, padx=(4, 0))

        # -------------------------------------------------------------
        # 3. Right Column: Passport Section
        # -------------------------------------------------------------
        tk.Label(
            right_box, text="Passport", font=("Segoe UI", 9, "bold"),
            bg="#f0f0f0", fg="#000000"
        ).pack(anchor="center", pady=(0, 4))

        self.passport_canvas = tk.Canvas(
            right_box, width=110, height=130, bg="#cfe2f3",
            highlightthickness=1, highlightbackground="#0858a8"
        )
        self.passport_canvas.pack(anchor="center", pady=(0, 6))
        self._draw_passport_placeholder()

        btn_upload = tk.Button(
            right_box, text="Upload Passport", font=("Segoe UI", 8, "bold"),
            bg=COLOR_PRIMARY, fg="#ffffff", activebackground="#0b66c2", activeforeground="#ffffff",
            relief="flat", bd=0, padx=8, pady=4, cursor="hand2", command=self._upload_passport
        )
        btn_upload.pack(fill="x", padx=10, pady=(0, 10))

        tk.Label(right_box, text="Faculty:", font=("Segoe UI", 9), bg="#f0f0f0").pack(anchor="w", padx=10)
        self.ent_faculty = ttk.Entry(right_box, width=16)
        self.ent_faculty.pack(fill="x", padx=10, pady=(2, 0))

        # -------------------------------------------------------------
        # 4. Bottom Action Bar: <<<  SAVE  CANCEL  >>>
        # -------------------------------------------------------------
        btn_bar = tk.Frame(self, bg="#f0f0f0", pady=10)
        btn_bar.pack(side="bottom", fill="x")

        btn_container = tk.Frame(btn_bar, bg="#f0f0f0")
        btn_container.pack(anchor="center")

        def make_action_btn(parent, text, cmd, bg_color, width=8):
            return tk.Button(
                parent, text=text, font=("Segoe UI", 9, "bold"),
                bg=bg_color, fg="#ffffff", activebackground="#0b66c2", activeforeground="#ffffff",
                relief="flat", bd=0, width=width, pady=5, cursor="hand2", command=cmd
            )

        self.btn_prev = make_action_btn(btn_container, "<<<", self._nav_prev, COLOR_PRIMARY, width=6)
        self.btn_prev.pack(side="left", padx=4)

        self.btn_save = make_action_btn(btn_container, "SAVE", self._save_student, COLOR_PRIMARY, width=8)
        self.btn_save.pack(side="left", padx=4)

        self.btn_cancel = make_action_btn(btn_container, "CANCEL", self.destroy, COLOR_CANCEL, width=8)
        self.btn_cancel.pack(side="left", padx=4)

        self.btn_next = make_action_btn(btn_container, ">>>", self._nav_next, COLOR_PRIMARY, width=6)
        self.btn_next.pack(side="left", padx=4)

    def _draw_passport_placeholder(self):
        self.passport_canvas.delete("all")
        self.passport_canvas.create_oval(38, 20, 72, 54, fill="#0858a8", outline="")
        self.passport_canvas.create_arc(20, 58, 90, 128, start=0, extent=180, fill="#0858a8", outline="")
        self.passport_canvas.create_rectangle(0, 106, 110, 130, fill="#b6d7a8", outline="")
        self.passport_canvas.create_text(
            55, 118, text="STUDENT\nPASSPORT", fill="#0858a8",
            font=("Segoe UI", 6, "bold"), justify="center"
        )

    def _upload_passport(self):
        path = filedialog.askopenfilename(
            title="Select Student Passport Image",
            filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.gif;*.bmp")]
        )
        if path:
            self.passport_file_path = path
            self.passport_canvas.delete("all")
            self.passport_canvas.create_rectangle(0, 0, 110, 130, fill="#e8f0fe", outline="")
            self.passport_canvas.create_text(
                55, 50, text="📷\nPhoto\nLoaded", fill="#0858a8",
                font=("Segoe UI", 9, "bold"), justify="center"
            )
            basename = os.path.basename(path)
            self.passport_canvas.create_text(
                55, 105, text=basename[:14], fill="#333333",
                font=("Segoe UI", 7), justify="center"
            )

    def _load_student_data(self, student):
        self.current_id = student["id"]
        self.cb_program.set(student["student_type"] or "Full-Time")
        self.ent_matric.delete(0, "end")
        self.ent_matric.insert(0, student["matric_no"] or "")

        self.ent_surname.delete(0, "end")
        self.ent_surname.insert(0, student["surname"] or "")

        self.ent_firstname.delete(0, "end")
        self.ent_firstname.insert(0, student["firstname"] or "")

        self.ent_other.delete(0, "end")
        self.ent_other.insert(0, student["other_name"] or "")

        if not student["surname"] and student["fullname"]:
            parts = student["fullname"].split(" ")
            self.ent_surname.insert(0, parts[0])
            if len(parts) > 1:
                self.ent_firstname.insert(0, parts[1])
            if len(parts) > 2:
                self.ent_other.insert(0, " ".join(parts[2:]))

        self.cb_batch.set(student["batch"] or "U2022")
        self.ent_dob.delete(0, "end")
        self.ent_dob.insert(0, student["dob"] or "")

        self.cb_sex.set(student["sex"] or "Male")
        self.cb_marital.set(student["marital_status"] or "Single")

        self.ent_gsm.delete(0, "end")
        self.ent_gsm.insert(0, student["gsm"] or "")

        self.ent_sponsor_gsm.delete(0, "end")
        self.ent_sponsor_gsm.insert(0, student["sponsor_gsm"] or "")

        self.cb_guardian_rel.set(student["guardian_rel"] or "Parent")
        self.ent_email.delete(0, "end")
        self.ent_email.insert(0, student["email"] or "")

        self.cb_state.set(student["state_of_origin"] or "")
        self.ent_lga.delete(0, "end")
        self.ent_lga.insert(0, student["lga"] or "")

        self.ent_faculty.delete(0, "end")
        self.ent_faculty.insert(0, student["faculty"] or "")

        if student["passport_path"]:
            self.passport_file_path = student["passport_path"]

    def _save_student(self):
        matric_no = self.ent_matric.get().strip().upper()
        surname = self.ent_surname.get().strip()
        firstname = self.ent_firstname.get().strip()
        batch = self.cb_batch.get().strip().upper()

        if not matric_no:
            messagebox.showwarning("Missing Info", "Please enter Matric No.", parent=self)
            return
        if not surname or not firstname:
            messagebox.showwarning("Missing Info", "Please enter both Surname and Firstname.", parent=self)
            return

        data = {
            "matric_no": matric_no,
            "surname": surname,
            "firstname": firstname,
            "other_name": self.ent_other.get().strip(),
            "batch": batch or "U2022",
            "student_type": self.cb_program.get().strip(),
            "dob": self.ent_dob.get().strip(),
            "sex": self.cb_sex.get().strip(),
            "marital_status": self.cb_marital.get().strip(),
            "gsm": self.ent_gsm.get().strip(),
            "sponsor_gsm": self.ent_sponsor_gsm.get().strip(),
            "guardian_rel": self.cb_guardian_rel.get().strip(),
            "email": self.ent_email.get().strip(),
            "state_of_origin": self.cb_state.get().strip(),
            "lga": self.ent_lga.get().strip(),
            "faculty": self.ent_faculty.get().strip(),
            "passport_path": self.passport_file_path or "",
        }

        try:
            self.db.save_student(data, student_id=self.current_id)
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to save student record:\n{exc}", parent=self)
            return

        if self.on_saved:
            self.on_saved()
        self.destroy()

    def _nav_prev(self):
        if not self.all_ids or not self.current_id:
            return
        try:
            idx = self.all_ids.index(self.current_id)
            if idx > 0:
                prev_id = self.all_ids[idx - 1]
                s = self.db.get_student_by_id(prev_id)
                if s:
                    self._load_student_data(s)
        except ValueError:
            pass

    def _nav_next(self):
        if not self.all_ids or not self.current_id:
            return
        try:
            idx = self.all_ids.index(self.current_id)
            if idx < len(self.all_ids) - 1:
                next_id = self.all_ids[idx + 1]
                s = self.db.get_student_by_id(next_id)
                if s:
                    self._load_student_data(s)
        except ValueError:
            pass


class ResultDialog(tk.Toplevel):
    """
    Score Matrix Sheet: Lines up all courses across all 4 levels (100L, 200L, 300L, 400L)
    and semesters so the user can quickly type scores with automatic grade calculation!
    Allows adding up to 2 extra selectable courses per semester for 200L, 300L, and 400L.
    """

    def __init__(self, parent, db, student_id, on_saved=None):
        super().__init__(parent)
        self.db = db
        self.student_id = student_id
        self.on_saved = on_saved

        raw_student = db.get_student_by_id(student_id)
        self.student = dict(raw_student) if raw_student else {}
        self.name = self.student.get("fullname", "Student")
        self.matric = self.student.get("matric_no", "")

        self.title(f"Record Course Scores — {self.name} ({self.matric})")
        self.geometry("980x660")
        self.minsize(880, 540)
        self.transient(parent)
        self.grab_set()
        self.configure(bg="#f4f7fa")

        self.score_entries = {}   # {course_id: {"entry": entry_widget, "course": course_dict}}
        self.grade_labels = {}    # {course_id: label_widget}
        self.extra_slots = []     # list of extra slot dicts
        self.student_type = self.student.get("student_type", "Full-Time")
        self.all_courses = self.db.get_all_courses(program=self.student_type)

        # Build lookup tables for course selection
        self.course_by_id = {c["id"]: c for c in self.all_courses}
        self.display_to_cid = {}
        self.cid_to_display = {}
        self.course_display_options = []
        for c in self.all_courses:
            disp = f"{c['course_code']} — {c['course_title']} ({c['credit_units']} CU) [{c['level']}L {c['semester']}]"
            self.display_to_cid[disp] = c["id"]
            self.cid_to_display[c["id"]] = disp
            self.course_display_options.append(disp)

        self._build_ui()
        self._load_scores_for_session()

    def _build_ui(self):
        # 1. Top Header Banner
        header = tk.Frame(self, bg=COLOR_PRIMARY, height=44)
        header.pack(fill="x")
        tk.Label(
            header,
            text=f"Score Sheet: {self.name} [{self.matric}]",
            font=("Segoe UI", 11, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
        ).pack(side="left", padx=14, pady=10)

        # 2. Control Toolbar (Session selection + level tab filter)
        ctrl_bar = tk.Frame(self, bg="#e1ecf7", padx=12, pady=6)
        ctrl_bar.pack(fill="x")

        tk.Label(
            ctrl_bar, text="Academic Session:", font=("Segoe UI", 9, "bold"),
            bg="#e1ecf7", fg="#002b49"
        ).pack(side="left", padx=(0, 6))

        sessions = [
            "2024/2025", "2023/2024", "2022/2023", "2021/2022",
            "2025/2026", "2026/2027", "2027/2028", "2028/2029"
        ]
        self.cb_session = ttk.Combobox(ctrl_bar, values=sessions, width=14)
        self.cb_session.set("2024/2025")
        self.cb_session.pack(side="left", padx=(0, 16))
        self.cb_session.bind("<<ComboboxSelected>>", lambda e: self._load_scores_for_session())

        tk.Label(
            ctrl_bar, text="Quick Level Filter:", font=("Segoe UI", 9, "bold"),
            bg="#e1ecf7", fg="#002b49"
        ).pack(side="left", padx=(0, 6))

        self.level_filter_var = tk.StringVar(value="All")
        for lvl, lbl_text in [
            ("All", "All Levels"),
            ("100", "100L"),
            ("200", "200L"),
            ("300", "300L"),
            ("400", "400L"),
            ("500", "500L (Extra Yr 1)"),
            ("600", "600L (Extra Yr 2)"),
        ]:
            btn = tk.Radiobutton(
                ctrl_bar, text=lbl_text,
                variable=self.level_filter_var, value=lvl,
                command=self._filter_courses_view,
                bg="#e1ecf7", activebackground="#e1ecf7",
                font=("Segoe UI", 8, "bold"), cursor="hand2"
            )
            btn.pack(side="left", padx=3)

        # 3. Main Scrollable Course Sheet Container
        container = tk.Frame(self, bg="#ffffff", relief="solid", bd=1)
        container.pack(fill="both", expand=True, padx=12, pady=8)

        self.canvas = tk.Canvas(container, bg="#ffffff", highlightthickness=0)
        self.v_scroll = ttk.Scrollbar(container, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.v_scroll.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.v_scroll.pack(side="right", fill="y")

        self.sheet_frame = tk.Frame(self.canvas, bg="#ffffff")
        self.canvas_window = self.canvas.create_window((0, 0), window=self.sheet_frame, anchor="nw")

        self.sheet_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfig(self.canvas_window, width=e.width))
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)

        self.slot_tables = {}  # {(lvl, sem): extra_tbl_widget}
        self._render_course_sheet()

        # 4. Bottom Action Bar: SAVE ALL SCORES | CLEAR | CLOSE
        b_bar = tk.Frame(self, bg="#f4f7fa", pady=10)
        b_bar.pack(side="bottom", fill="x")

        b_box = tk.Frame(b_bar, bg="#f4f7fa")
        b_box.pack(anchor="center")

        btn_save = tk.Button(
            b_box, text="💾 SAVE ALL SCORES", font=("Segoe UI", 10, "bold"),
            bg=COLOR_PRIMARY, fg="#ffffff", activebackground=COLOR_PRIMARY_HOVER,
            activeforeground="#ffffff", relief="flat", bd=0, padx=16, pady=6,
            cursor="hand2", command=self._save_all_scores
        )
        btn_save.pack(side="left", padx=6)

        btn_transcript = tk.Button(
            b_box, text="📄 View Official Transcript", font=("Segoe UI", 9, "bold"),
            bg="#0858a8", fg="#ffffff", activebackground="#063d75",
            activeforeground="#ffffff", relief="flat", bd=0, padx=14, pady=6,
            cursor="hand2", command=self._open_transcript
        )
        btn_transcript.pack(side="left", padx=6)

        btn_clear = tk.Button(
            b_box, text="Clear All Inputs", font=("Segoe UI", 9),
            bg="#e0e0e0", fg="#333333", relief="flat", bd=0, padx=12, pady=6,
            cursor="hand2", command=self._clear_inputs
        )
        btn_clear.pack(side="left", padx=6)

        btn_close = tk.Button(
            b_box, text="Close", font=("Segoe UI", 9),
            bg=COLOR_CANCEL, fg="#ffffff", relief="flat", bd=0, padx=14, pady=6,
            cursor="hand2", command=self.destroy
        )
        btn_close.pack(side="left", padx=6)

    def _on_mousewheel(self, event):
        try:
            self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        except Exception:
            pass

    def _create_extra_slot_row(self, parent_tbl, lvl, sem, slot_num):
        slot_bg = "#fbfcfd" if slot_num % 2 == 1 else "#f4f7fb"
        row_idx = slot_num - 1

        cb_f = tk.Frame(parent_tbl, bg=slot_bg)
        cb_f.grid(row=row_idx, column=0, columnspan=2, sticky="nsew", padx=1, pady=1)

        default_ph = f"-- Select Course {slot_num} (Optional) --" if lvl in ("500", "600") else f"-- Select Extra Course {slot_num} (Optional) --"
        cb_course = ttk.Combobox(
            cb_f,
            values=[default_ph] + self.course_display_options,
            width=45,
            state="readonly"
        )
        cb_course.set(default_ph)
        cb_course.pack(side="left", padx=6, pady=3, fill="x", expand=True)

        lbl_units = tk.Label(
            parent_tbl, text="-", font=("Segoe UI", 8),
            bg=slot_bg, fg="#888888", anchor="center", padx=4
        )
        lbl_units.grid(row=row_idx, column=2, sticky="nsew", padx=1, pady=1)

        lbl_status = tk.Label(
            parent_tbl, text="Optional", font=("Segoe UI", 8),
            bg=slot_bg, fg="#888888", anchor="center", padx=4
        )
        lbl_status.grid(row=row_idx, column=3, sticky="nsew", padx=1, pady=1)

        score_f = tk.Frame(parent_tbl, bg=slot_bg)
        score_f.grid(row=row_idx, column=4, sticky="nsew", padx=1, pady=1)
        ent_score = ttk.Entry(score_f, width=8, justify="center")
        ent_score.pack(anchor="center", pady=2)

        lbl_grade = tk.Label(
            parent_tbl, text="-", font=("Segoe UI", 9, "bold"),
            bg=slot_bg, fg="#888888", anchor="w", padx=6
        )
        lbl_grade.grid(row=row_idx, column=5, sticky="nsew", padx=1, pady=1)

        slot_item = {
            "lvl": lvl,
            "sem": sem,
            "slot_num": slot_num,
            "placeholder": default_ph,
            "cb_course": cb_course,
            "lbl_units": lbl_units,
            "lbl_status": lbl_status,
            "ent_score": ent_score,
            "lbl_grade": lbl_grade,
        }
        self.extra_slots.append(slot_item)
        cb_course.bind("<<ComboboxSelected>>", lambda e, item=slot_item: self._on_extra_course_selected(item))
        ent_score.bind("<KeyRelease>", lambda e, item=slot_item: self._on_extra_score_type(item))
        return slot_item

    def _add_more_slot(self, parent_tbl, lvl, sem):
        existing_slots = [s for s in self.extra_slots if s["lvl"] == lvl and s["sem"] == sem]
        next_num = len(existing_slots) + 1
        self._create_extra_slot_row(parent_tbl, lvl, sem, next_num)
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _render_course_sheet(self):
        # Clear existing sheet widgets
        for widget in self.sheet_frame.winfo_children():
            widget.destroy()

        self.score_entries = {}
        self.grade_labels = {}
        self.extra_slots = []
        self.slot_tables = {}
        selected_lvl = self.level_filter_var.get()

        if self.student_type == "Part-Time":
            sections = [
                ("100", "First", "100 LEVEL — FIRST TERM (13 Credit Units)"),
                ("100", "Second", "100 LEVEL — SECOND TERM (12 Credit Units)"),
                ("100", "Third", "100 LEVEL — THIRD TERM (11 Credit Units)"),
                ("200", "First", "200 LEVEL — FIRST TERM (10 Credit Units)"),
                ("200", "Second", "200 LEVEL — SECOND TERM (12 Credit Units)"),
                ("200", "Third", "200 LEVEL — THIRD TERM (11 Credit Units)"),
                ("300", "First", "300 LEVEL — FIRST TERM (12 Credit Units)"),
                ("300", "Second", "300 LEVEL — SECOND TERM (10 Credit Units)"),
                ("300", "Third", "300 LEVEL — THIRD TERM (13 Credit Units)"),
                ("400", "First", "400 LEVEL — FIRST TERM (15 Credit Units)"),
                ("400", "Second", "400 LEVEL — SECOND TERM (12 Credit Units)"),
                ("400", "Third", "400 LEVEL — THIRD TERM (11 Credit Units)"),
                ("500", "First", "500 LEVEL (EXTRA YEAR I) — FIRST TERM"),
                ("500", "Second", "500 LEVEL (EXTRA YEAR I) — SECOND TERM"),
                ("500", "Third", "500 LEVEL (EXTRA YEAR I) — THIRD TERM"),
                ("600", "First", "600 LEVEL (EXTRA YEAR II) — FIRST TERM"),
                ("600", "Second", "600 LEVEL (EXTRA YEAR II) — SECOND TERM"),
                ("600", "Third", "600 LEVEL (EXTRA YEAR II) — THIRD TERM"),
            ]
        else:
            sections = [
                ("100", "First", "100 LEVEL — FIRST SEMESTER (16 Credit Units)"),
                ("100", "Second", "100 LEVEL — SECOND SEMESTER (20 Credit Units)"),
                ("200", "First", "200 LEVEL — FIRST SEMESTER (17 Credit Units)"),
                ("200", "Second", "200 LEVEL — SECOND SEMESTER (16 Credit Units)"),
                ("300", "First", "300 LEVEL — FIRST SEMESTER (18 Credit Units)"),
                ("300", "Second", "300 LEVEL — SECOND SEMESTER (17 Credit Units)"),
                ("400", "First", "400 LEVEL — FIRST SEMESTER (19 Credit Units)"),
                ("400", "Second", "400 LEVEL — SECOND SEMESTER (19 Credit Units)"),
                ("500", "First", "500 LEVEL (EXTRA YEAR I) — FIRST SEMESTER"),
                ("500", "Second", "500 LEVEL (EXTRA YEAR I) — SECOND SEMESTER"),
                ("600", "First", "600 LEVEL (EXTRA YEAR II) — FIRST SEMESTER"),
                ("600", "Second", "600 LEVEL (EXTRA YEAR II) — SECOND SEMESTER"),
            ]

        for lvl, sem, header_title in sections:
            if selected_lvl != "All" and lvl != selected_lvl:
                continue

            # Standard curriculum courses for 100L-400L
            courses = [c for c in self.all_courses if str(c["level"]) == lvl and c["semester"] == sem]

            # Section Header Bar
            sec_header = tk.Frame(self.sheet_frame, bg="#0858a8", height=28)
            sec_header.pack(fill="x", pady=(10, 0))
            tk.Label(
                sec_header, text=header_title, font=("Segoe UI", 9, "bold"),
                bg="#0858a8", fg="#ffffff"
            ).pack(side="left", padx=8, pady=3)

            # Section Table for Standard Courses (if applicable)
            if courses:
                sec_tbl = tk.Frame(self.sheet_frame, bg="#d9e7f5", relief="solid", bd=1)
                sec_tbl.pack(fill="x", pady=(0, 4))

                sec_tbl.grid_columnconfigure(0, weight=0, minsize=110)
                sec_tbl.grid_columnconfigure(1, weight=1, minsize=260)
                sec_tbl.grid_columnconfigure(2, weight=0, minsize=65)
                sec_tbl.grid_columnconfigure(3, weight=0, minsize=90)
                sec_tbl.grid_columnconfigure(4, weight=0, minsize=100)
                sec_tbl.grid_columnconfigure(5, weight=0, minsize=110)

                # Table Header Row (Row 0)
                hdr_defs = [
                    ("Course Code", 0, "w"),
                    ("Course Title", 1, "w"),
                    ("Units", 2, "center"),
                    ("Status", 3, "center"),
                    ("Score (0-100)", 4, "center"),
                    ("Grade / Point", 5, "w"),
                ]
                for h_text, h_col, h_anch in hdr_defs:
                    tk.Label(
                        sec_tbl, text=h_text, font=("Segoe UI", 8, "bold"),
                        bg="#d9e7f5", fg="#002b49", anchor=h_anch, padx=6, pady=3
                    ).grid(row=0, column=h_col, sticky="nsew", padx=1, pady=1)

                # Standard Course Rows
                for i, c in enumerate(courses, start=1):
                    cid = c["id"]
                    bg_color = "#ffffff" if i % 2 == 1 else "#f8fafd"

                    tk.Label(
                        sec_tbl, text=c["course_code"], font=("Segoe UI", 9, "bold"),
                        bg=bg_color, fg="#0858a8", anchor="w", padx=6
                    ).grid(row=i, column=0, sticky="nsew", padx=1, pady=1)

                    tk.Label(
                        sec_tbl, text=c["course_title"], font=("Segoe UI", 9),
                        bg=bg_color, fg="#222222", anchor="w", padx=6
                    ).grid(row=i, column=1, sticky="nsew", padx=1, pady=1)

                    tk.Label(
                        sec_tbl, text=f"{c['credit_units']} CU", font=("Segoe UI", 8),
                        bg=bg_color, fg="#555555", anchor="center", padx=4
                    ).grid(row=i, column=2, sticky="nsew", padx=1, pady=1)

                    status_color = "#137333" if c["status"] == "Compulsory" else "#705300"
                    tk.Label(
                        sec_tbl, text=c["status"], font=("Segoe UI", 8),
                        bg=bg_color, fg=status_color, anchor="center", padx=4
                    ).grid(row=i, column=3, sticky="nsew", padx=1, pady=1)

                    score_f = tk.Frame(sec_tbl, bg=bg_color)
                    score_f.grid(row=i, column=4, sticky="nsew", padx=1, pady=1)
                    ent_score = ttk.Entry(score_f, width=8, justify="center")
                    ent_score.pack(anchor="center", pady=2)

                    lbl_grade = tk.Label(
                        sec_tbl, text="-", font=("Segoe UI", 9, "bold"),
                        bg=bg_color, fg="#888888", anchor="w", padx=6
                    )
                    lbl_grade.grid(row=i, column=5, sticky="nsew", padx=1, pady=1)

                    ent_score.bind("<KeyRelease>", lambda e, cid=cid: self._on_score_type(cid))

                    self.score_entries[cid] = {
                        "entry": ent_score,
                        "course": c,
                    }
                    self.grade_labels[cid] = lbl_grade

            # Extra selectable course slots (for 200L, 300L, 400L, 500L, 600L)
            if lvl != "100":
                extra_bar = tk.Frame(self.sheet_frame, bg="#eaf2fb", padx=6, pady=3)
                extra_bar.pack(fill="x", pady=(4, 1))

                bar_label = "➕ Extra / Elective / Carryover Courses:" if lvl not in ("500", "600") else "➕ Select Courses for this Semester (Choose course and enter score):"
                tk.Label(
                    extra_bar,
                    text=bar_label,
                    font=("Segoe UI", 8, "bold"),
                    bg="#eaf2fb",
                    fg="#0858a8"
                ).pack(side="left")

                extra_tbl = tk.Frame(self.sheet_frame, bg="#c0d4ea", relief="solid", bd=1)
                extra_tbl.pack(fill="x", pady=(0, 2))
                extra_tbl.grid_columnconfigure(0, weight=0, minsize=110)
                extra_tbl.grid_columnconfigure(1, weight=1, minsize=260)
                extra_tbl.grid_columnconfigure(2, weight=0, minsize=65)
                extra_tbl.grid_columnconfigure(3, weight=0, minsize=90)
                extra_tbl.grid_columnconfigure(4, weight=0, minsize=100)
                extra_tbl.grid_columnconfigure(5, weight=0, minsize=110)

                self.slot_tables[(lvl, sem)] = extra_tbl

                # Default number of slots: 2 for 200L-400L, 6 for 500L-600L
                num_init_slots = 6 if lvl in ("500", "600") else 2
                for s_idx in range(1, num_init_slots + 1):
                    self._create_extra_slot_row(extra_tbl, lvl, sem, s_idx)

                # Button to add more selectable course slots dynamically
                btn_add_slot = tk.Button(
                    extra_bar, text="➕ Add Course Slot", font=("Segoe UI", 7, "bold"),
                    bg="#0858a8", fg="#ffffff", activebackground="#0b66c2",
                    relief="flat", bd=0, padx=6, pady=1, cursor="hand2",
                    command=lambda t=extra_tbl, l=lvl, s=sem: self._add_more_slot(t, l, s)
                )
                btn_add_slot.pack(side="right", padx=4)

    def _on_score_type(self, cid):
        item = self.score_entries.get(cid)
        if not item:
            return
        val = item["entry"].get().strip()
        lbl = self.grade_labels.get(cid)
        if not val:
            lbl.config(text="-", fg="#888888")
            return
        try:
            score = float(val)
            if 0 <= score <= 100:
                session = self.cb_session.get().strip()
                is_repeat = self.db.is_repeat_course(self.student_id, cid, session=session, semester=item["course"]["semester"])
                letter, gp = score_to_grade(score, is_repeat=is_repeat)
                fg_color = "#137333" if letter in ("A", "B", "C") else ("#b86200" if letter in ("D", "E") else "#c5221f")
                repeat_tag = " (Repeat/3.0)" if (is_repeat and letter in ("A", "B")) else ""
                lbl.config(text=f"{letter} ({gp:.1f} Pt{repeat_tag})", fg=fg_color)
            else:
                lbl.config(text="Invalid", fg="#c5221f")
        except ValueError:
            lbl.config(text="Invalid", fg="#c5221f")

    def _on_extra_course_selected(self, slot_item):
        val = slot_item["cb_course"].get().strip()
        cid = self.display_to_cid.get(val)
        if cid and cid in self.course_by_id:
            course = self.course_by_id[cid]
            slot_item["lbl_units"].config(text=f"{course['credit_units']} CU", fg="#555555")
            st_label = "Selected Course" if slot_item["lvl"] in ("500", "600") else "Extra/Elective"
            slot_item["lbl_status"].config(text=st_label, fg="#0858a8")
            self._on_extra_score_type(slot_item)
        else:
            slot_item["lbl_units"].config(text="-", fg="#888888")
            slot_item["lbl_status"].config(text="Optional", fg="#888888")
            slot_item["ent_score"].delete(0, "end")
            slot_item["lbl_grade"].config(text="-", fg="#888888")

    def _on_extra_score_type(self, slot_item):
        val = slot_item["ent_score"].get().strip()
        lbl = slot_item["lbl_grade"]
        cb_val = slot_item["cb_course"].get().strip()
        cid = self.display_to_cid.get(cb_val)

        if not val:
            lbl.config(text="-", fg="#888888")
            return
        if not cid:
            lbl.config(text="Select Course", fg="#c5221f")
            return
        try:
            score = float(val)
            if 0 <= score <= 100:
                session = self.cb_session.get().strip()
                is_repeat = self.db.is_repeat_course(self.student_id, cid, session=session, semester=slot_item["sem"])
                letter, gp = score_to_grade(score, is_repeat=is_repeat)
                fg_color = "#137333" if letter in ("A", "B", "C") else ("#b86200" if letter in ("D", "E") else "#c5221f")
                repeat_tag = " (Repeat/3.0)" if (is_repeat and letter in ("A", "B")) else ""
                lbl.config(text=f"{letter} ({gp:.1f} Pt{repeat_tag})", fg=fg_color)
            else:
                lbl.config(text="Invalid", fg="#c5221f")
        except ValueError:
            lbl.config(text="Invalid", fg="#c5221f")

    def _filter_courses_view(self):
        self._render_course_sheet()
        self._load_scores_for_session()

    def _load_scores_for_session(self):
        session = self.cb_session.get().strip()
        session_results = self.db.get_student_session_results(self.student_id, session=session)
        scores_by_cid = {r["course_id"]: r["score"] for r in session_results}

        # 1. Populate standard course score entries
        for cid, item in self.score_entries.items():
            entry = item["entry"]
            entry.delete(0, "end")
            if cid in scores_by_cid:
                score_val = scores_by_cid[cid]
                score_str = str(int(score_val)) if score_val == int(score_val) else f"{score_val:.1f}"
                entry.insert(0, score_str)
                self._on_score_type(cid)
            else:
                self.grade_labels[cid].config(text="-", fg="#888888")

        # 2. Populate extra / selectable course slots across all levels (200L to 600L)
        if self.student_type == "Part-Time":
            sem_pairs = [
                ("200", "First"), ("200", "Second"), ("200", "Third"),
                ("300", "First"), ("300", "Second"), ("300", "Third"),
                ("400", "First"), ("400", "Second"), ("400", "Third"),
                ("500", "First"), ("500", "Second"), ("500", "Third"),
                ("600", "First"), ("600", "Second"), ("600", "Third"),
            ]
        else:
            sem_pairs = [
                ("200", "First"), ("200", "Second"),
                ("300", "First"), ("300", "Second"),
                ("400", "First"), ("400", "Second"),
                ("500", "First"), ("500", "Second"),
                ("600", "First"), ("600", "Second"),
            ]

        for (lvl, sem) in sem_pairs:
            if lvl in ("200", "300", "400"):
                std_cids = {c["id"] for c in self.all_courses if str(c["level"]) == lvl and c["semester"] == sem}
                extra_res = [r for r in session_results if (r["semester"] or "First") == sem and str(r.get("c_level", "") if isinstance(r, dict) else r["c_level"]) == lvl and r["course_id"] not in std_cids]
            else:
                # 500L and 600L
                extra_res = [r for r in session_results if (r["semester"] or "First") == sem and str(r.get("c_level", "") if isinstance(r, dict) else r["c_level"]) == lvl]

            # Ensure we have enough slot rows for the records
            slots_for_section = [s for s in self.extra_slots if s["lvl"] == lvl and s["sem"] == sem]
            parent_tbl = self.slot_tables.get((lvl, sem))
            while parent_tbl and len(slots_for_section) < len(extra_res):
                next_num = len(slots_for_section) + 1
                new_slot = self._create_extra_slot_row(parent_tbl, lvl, sem, next_num)
                slots_for_section.append(new_slot)

            for idx, slot_item in enumerate(slots_for_section):
                slot_item["ent_score"].delete(0, "end")
                if idx < len(extra_res):
                    res = extra_res[idx]
                    cid = res["course_id"]
                    disp = self.cid_to_display.get(cid)
                    if disp:
                        slot_item["cb_course"].set(disp)
                        course = self.course_by_id.get(cid, {})
                        slot_item["lbl_units"].config(text=f"{course.get('credit_units', '-')} CU", fg="#555555")
                        st_label = "Selected Course" if lvl in ("500", "600") else "Extra/Elective"
                        slot_item["lbl_status"].config(text=st_label, fg="#0858a8")
                        score_val = res["score"]
                        score_str = str(int(score_val)) if score_val == int(score_val) else f"{score_val:.1f}"
                        slot_item["ent_score"].insert(0, score_str)
                        self._on_extra_score_type(slot_item)
                    else:
                        slot_item["cb_course"].set(slot_item["placeholder"])
                        slot_item["lbl_units"].config(text="-", fg="#888888")
                        slot_item["lbl_status"].config(text="Optional", fg="#888888")
                        slot_item["lbl_grade"].config(text="-", fg="#888888")
                else:
                    slot_item["cb_course"].set(slot_item["placeholder"])
                    slot_item["lbl_units"].config(text="-", fg="#888888")
                    slot_item["lbl_status"].config(text="Optional", fg="#888888")
                    slot_item["lbl_grade"].config(text="-", fg="#888888")

    def _clear_inputs(self):
        if messagebox.askyesno("Clear Inputs", "Clear all score inputs in this view?", parent=self):
            for cid, item in self.score_entries.items():
                item["entry"].delete(0, "end")
                self.grade_labels[cid].config(text="-", fg="#888888")
            for slot_item in self.extra_slots:
                slot_item["cb_course"].set(slot_item["placeholder"])
                slot_item["lbl_units"].config(text="-", fg="#888888")
                slot_item["lbl_status"].config(text="Optional", fg="#888888")
                slot_item["ent_score"].delete(0, "end")
                slot_item["lbl_grade"].config(text="-", fg="#888888")

    def _save_all_scores(self):
        session = self.cb_session.get().strip()
        if not session:
            messagebox.showwarning("Missing Session", "Please specify an academic session.", parent=self)
            return

        results_to_save = []
        errors = []
        seen_courses = set()

        # 1. Process standard course scores
        for cid, item in self.score_entries.items():
            val = item["entry"].get().strip()
            if not val:
                continue
            try:
                score = float(val)
                if not (0 <= score <= 100):
                    errors.append(f"{item['course']['course_code']} (score must be 0-100)")
                    continue
                sem = item["course"]["semester"]
                lvl = item["course"]["level"]
                results_to_save.append({
                    "course_id": cid,
                    "score": score,
                    "semester": sem,
                    "level": lvl,
                })
                seen_courses.add((cid, sem, lvl))
            except ValueError:
                errors.append(f"{item['course']['course_code']} (invalid numeric score)")

        # 2. Process extra course scores
        for slot in self.extra_slots:
            cb_val = slot["cb_course"].get().strip()
            cid = self.display_to_cid.get(cb_val)
            val = slot["ent_score"].get().strip()

            if cid and val:
                try:
                    score = float(val)
                    if not (0 <= score <= 100):
                        errors.append(f"{self.course_by_id[cid]['course_code']} (score must be 0-100)")
                        continue
                    sem = slot["sem"]
                    lvl = slot["lvl"]
                    if (cid, sem, lvl) in seen_courses:
                        errors.append(f"{self.course_by_id[cid]['course_code']} (selected more than once in {lvl}L {sem} Semester)")
                        continue
                    seen_courses.add((cid, sem, lvl))
                    results_to_save.append({
                        "course_id": cid,
                        "score": score,
                        "semester": sem,
                        "level": lvl,
                    })
                except ValueError:
                    errors.append(f"{self.course_by_id[cid]['course_code']} (invalid numeric score)")
            elif val and not cid:
                errors.append(f"Score '{val}' entered in {slot['lvl']}L {slot['sem']} Semester without selecting a course")
            elif cid and not val:
                # Course selected without score; ignore or leave empty
                pass

        if errors:
            messagebox.showwarning(
                "Invalid Scores",
                "Please correct the following score entries:\n\n• " + "\n• ".join(errors),
                parent=self,
            )
            return

        if not results_to_save:
            messagebox.showinfo("No Scores", "No score numbers were entered to save.", parent=self)
            return

        try:
            self.db.save_bulk_results(self.student_id, session, results_to_save)
            messagebox.showinfo(
                "Scores Saved",
                f"Successfully recorded {len(results_to_save)} course score(s) for session {session}!",
                parent=self,
            )
        except Exception as exc:
            messagebox.showerror("Save Error", f"Failed to save results:\n{exc}", parent=self)
            return

        if self.on_saved:
            self.on_saved()
        self.destroy()

    def _open_transcript(self):
        TranscriptDialog(self, self.db, self.student_id)


class CourseManagerDialog(tk.Toplevel):
    """Browse, add, edit, and delete courses in the catalogue."""

    def __init__(self, parent, db):
        super().__init__(parent)
        self.db = db
        self.title("Manage Course Catalogue")
        self.geometry("820x500")
        self.transient(parent)
        self.grab_set()

        # Header banner
        header = tk.Frame(self, bg=COLOR_PRIMARY, height=36)
        header.pack(fill="x")
        tk.Label(
            header, text="Course Catalogue Management", font=("Segoe UI", 10, "bold"),
            bg=COLOR_PRIMARY, fg="white"
        ).pack(side="left", padx=12, pady=6)

        top = ttk.Frame(self, padding=8)
        top.pack(fill="x")
        ttk.Button(top, text="+ Add Course", command=self._add_course).pack(side="left")
        ttk.Button(top, text="Delete Selected", command=self._delete_course).pack(side="left", padx=6)

        ttk.Label(top, text="Filter by Program:").pack(side="left", padx=(16, 4))
        self.cb_filter_prog = ttk.Combobox(top, values=["All Programs", "Full-Time", "Part-Time"], state="readonly", width=14)
        self.cb_filter_prog.set("All Programs")
        self.cb_filter_prog.pack(side="left")
        self.cb_filter_prog.bind("<<ComboboxSelected>>", lambda e: self._refresh())

        columns = ("code", "title", "units", "level", "semester", "status", "program")
        self.tree = ttk.Treeview(self, columns=columns, show="headings")
        headings = {
            "code": "Course Code", "title": "Course Title", "units": "Credit Units",
            "level": "Level", "semester": "Semester / Term", "status": "Status", "program": "Program",
        }
        widths = {"code": 90, "title": 240, "units": 70, "level": 60, "semester": 90, "status": 80, "program": 80}
        for col in columns:
            self.tree.heading(col, text=headings[col])
            self.tree.column(col, width=widths[col], anchor="center" if col not in ("title", "code") else "w")

        scroll = ttk.Scrollbar(self, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)

        self.tree.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=(0, 8))
        scroll.pack(side="right", fill="y", padx=(0, 8), pady=(0, 8))

        self._refresh()

    def _refresh(self):
        self.tree.delete(*self.tree.get_children())
        self._id_map = {}
        prog_filter = self.cb_filter_prog.get()
        filter_val = None if prog_filter == "All Programs" else prog_filter
        for course in self.db.get_all_courses(program=filter_val):
            prog_disp = course["program"] if "program" in course.keys() and course["program"] else "Full-Time"
            iid = self.tree.insert(
                "", "end",
                values=(course["course_code"], course["course_title"],
                        course["credit_units"], course["level"],
                        course["semester"], course["status"], prog_disp),
            )
            self._id_map[iid] = course["id"]

    def _add_course(self):
        CourseFormDialog(self, self.db, on_saved=self._refresh)

    def _delete_course(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("No Selection", "Please select a course to delete.", parent=self)
            return
        course_id = self._id_map[sel[0]]
        if messagebox.askyesno(
            "Delete Course",
            "Deleting this course will also remove all student results recorded for it.\nAre you sure?",
            parent=self,
        ):
            self.db.delete_course(course_id)
            self._refresh()


class CourseFormDialog(tk.Toplevel):
    """Add or edit a course."""

    def __init__(self, parent, db, course=None, on_saved=None):
        super().__init__(parent)
        self.db = db
        self.course = course
        self.on_saved = on_saved
        self.title("Add Course" if not course else "Edit Course")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()
        self.geometry("420x360")

        # Header banner
        header = tk.Frame(self, bg=COLOR_PRIMARY, height=36)
        header.pack(fill="x")
        tk.Label(
            header, text="Course Details", font=("Segoe UI", 10, "bold"),
            bg=COLOR_PRIMARY, fg="white"
        ).pack(side="left", padx=10, pady=6)

        form = ttk.Frame(self, padding=12)
        form.pack(fill="both", expand=True)

        ttk.Label(form, text="Course Code:").grid(row=0, column=0, sticky="w", pady=4)
        self.code = ttk.Entry(form, width=26)
        self.code.grid(row=0, column=1, pady=4)

        ttk.Label(form, text="Course Title:").grid(row=1, column=0, sticky="w", pady=4)
        self.course_title = ttk.Entry(form, width=26)
        self.course_title.grid(row=1, column=1, pady=4)

        ttk.Label(form, text="Credit Units:").grid(row=2, column=0, sticky="w", pady=4)
        self.units = ttk.Spinbox(form, from_=1, to=12, width=24)
        self.units.set(3)
        self.units.grid(row=2, column=1, pady=4)

        ttk.Label(form, text="Level:").grid(row=3, column=0, sticky="w", pady=4)
        self.level = ttk.Combobox(
            form, values=["100", "200", "300", "400", "500", "600"], state="readonly", width=23
        )
        self.level.set("100")
        self.level.grid(row=3, column=1, pady=4)

        ttk.Label(form, text="Semester / Term:").grid(row=4, column=0, sticky="w", pady=4)
        self.semester = ttk.Combobox(
            form, values=["First", "Second", "Third"], state="readonly", width=23
        )
        self.semester.set("First")
        self.semester.grid(row=4, column=1, pady=4)

        ttk.Label(form, text="Status:").grid(row=5, column=0, sticky="w", pady=4)
        self.status = ttk.Combobox(
            form, values=["Compulsory", "Required", "Elective"], state="readonly", width=23
        )
        self.status.set("Compulsory")
        self.status.grid(row=5, column=1, pady=4)

        ttk.Label(form, text="Program:").grid(row=6, column=0, sticky="w", pady=4)
        self.cb_program = ttk.Combobox(
            form, values=["Full-Time", "Part-Time", "Both"], state="readonly", width=23
        )
        self.cb_program.set("Full-Time")
        self.cb_program.grid(row=6, column=1, pady=4)

        btns = ttk.Frame(self, padding=(12, 0, 12, 12))
        btns.pack(fill="x")
        ttk.Button(btns, text="Cancel", command=self.destroy).pack(side="right", padx=(6, 0))
        ttk.Button(btns, text="Save Course", command=self._save).pack(side="right")

    def _save(self):
        code = self.code.get().strip().upper()
        title = self.course_title.get().strip()
        if not code or not title:
            messagebox.showwarning("Missing Info", "Course Code and Title are required.", parent=self)
            return
        self.db.add_course(
            code, title, int(self.units.get()), self.level.get(),
            self.semester.get(), self.status.get(), program=self.cb_program.get()
        )
        if self.on_saved:
            self.on_saved()
        self.destroy()


class WorksheetDialog(tk.Toplevel):
    """Full Result Worksheet Manager for a selected student."""

    def __init__(self, parent, db, student_id, on_updated=None):
        super().__init__(parent)
        self.db = db
        self.student_id = student_id
        self.on_updated = on_updated

        self.student = db.get_student_by_id(student_id)
        name = self.student["fullname"] if self.student else "Student"
        matric = self.student["matric_no"] if self.student else ""

        self.title(f"Results Worksheet — {name} ({matric})")
        self.geometry("820x520")
        self.transient(parent)
        self.grab_set()

        header = tk.Frame(self, bg=COLOR_PRIMARY, height=40)
        header.pack(fill="x")
        tk.Label(
            header, text=f"Academic Result Worksheet: {name} [{matric}]",
            font=("Segoe UI", 10, "bold"), bg=COLOR_PRIMARY, fg="white"
        ).pack(side="left", padx=12, pady=8)

        toolbar = ttk.Frame(self, padding=8)
        toolbar.pack(fill="x")
        ttk.Button(toolbar, text="📝 Open Score Sheet", command=self._add_result).pack(side="left")
        ttk.Button(toolbar, text="📄 View Official Transcript", command=self._open_transcript).pack(side="left", padx=6)
        ttk.Button(toolbar, text="🎓 Waive Course", command=self._waive_course).pack(side="left", padx=6)
        ttk.Button(toolbar, text="🗑️ Delete Score Sheet", command=self._delete_result).pack(side="left", padx=6)
        ttk.Button(toolbar, text="🔄 Refresh Score Sheet", command=self._refresh).pack(side="left")

        columns = ("code", "title", "units", "score", "grade", "gp", "session", "semester", "status")
        self.tree = ttk.Treeview(self, columns=columns, show="headings")
        headings = {
            "code": "Course Code", "title": "Course Title", "units": "Units",
            "score": "Score", "grade": "Grade", "gp": "Point",
            "session": "Session", "semester": "Semester", "status": "Status / Waiver"
        }
        widths = {"code": 90, "title": 200, "units": 45, "score": 55, "grade": 80, "gp": 45, "session": 80, "semester": 70, "status": 100}
        for col in columns:
            self.tree.heading(col, text=headings[col])
            self.tree.column(col, width=widths[col], anchor="center" if col not in ("title",) else "w")

        scroll = ttk.Scrollbar(self, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        self.tree.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=8)
        scroll.pack(side="right", fill="y", padx=(0, 8), pady=8)

        # Context menu for Worksheet
        self.ws_context_menu = tk.Menu(self, tearoff=0)
        self.ws_context_menu.add_command(label="🎓 Waive Failed Course (Retain Grade F for CGPA)", command=self._waive_course)
        self.ws_context_menu.add_command(label="↩ Remove Waiver Status", command=self._unwaive_course)
        self.ws_context_menu.add_separator()
        self.ws_context_menu.add_command(label="🗑️ Delete Result Row", command=self._delete_result)
        self.tree.bind("<Button-3>", self._show_tree_context)

        self._refresh()

    def _show_tree_context(self, event):
        row_id = self.tree.identify_row(event.y)
        if row_id:
            self.tree.selection_set(row_id)
            self.ws_context_menu.tk_popup(event.x_root, event.y_root)

    def _refresh(self):
        self.tree.delete(*self.tree.get_children())
        self._id_map = {}
        for r in self.db.get_student_results(self.student_id):
            is_waived = r["is_waived"] if ("is_waived" in r.keys() and r["is_waived"] is not None) else 0
            if is_waived == 1:
                status_text = "🎓 Waived (Cleared)"
                grade_disp = f"{r['grade']} (Waived)"
            elif r["grade"] in ("A", "B", "C", "D", "E"):
                is_repeat = self.db.is_repeat_course(self.student_id, r["course_id"], session=r["session"], semester=r["c_semester"], result_id=r["id"])
                if is_repeat and r["grade"] in ("A", "B") and r["grade_point"] == 3.0:
                    status_text = "Passed (Repeat Capped)"
                elif is_repeat:
                    status_text = "Passed (Repeat)"
                else:
                    status_text = "Passed"
                grade_disp = r["grade"]
            else:
                status_text = "Failed (Carryover)"
                grade_disp = r["grade"]

            iid = self.tree.insert(
                "", "end",
                values=(r["course_code"], r["course_title"], r["credit_units"],
                        r["score"], grade_disp, r["grade_point"], r["session"], r["c_semester"], status_text),
            )
            self._id_map[iid] = dict(r)

    def _add_result(self):
        ResultDialog(self, self.db, self.student_id, on_saved=self._on_item_saved)

    def _open_transcript(self):
        TranscriptDialog(self, self.db, self.student_id)

    def _waive_course(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("No Selection", "Please select a course result to waive.", parent=self)
            return
        result_data = self._id_map[sel[0]]
        result_id = result_data["id"]
        course_code = result_data["course_code"]
        course_title = result_data["course_title"]
        units = result_data["credit_units"]
        is_waived = result_data.get("is_waived") == 1
        score_val = result_data.get("score", 0.0)
        grade_val = result_data.get("grade", "F")

        if is_waived:
            messagebox.showinfo("Already Waived", f"Course {course_code} is already waived (Grade {result_data['grade']}).", parent=self)
            return

        # Validate waiver rules (GES, FMS/Project, Internship, max 2 courses)
        allowed, reason = self.db.can_waive_course(self.student_id, result_data["course_id"], result_id=result_id)
        if not allowed:
            messagebox.showwarning("Waiver Restriction", reason, parent=self)
            return

        msg = (
            f"Are you sure you want to WAIVE this failed course for {self.student['fullname']}?\n\n"
            f"Course: {course_code} — {course_title} ({units} CU)\n"
            f"Recorded Score: {score_val} (Grade {grade_val} / 0.0 GP)\n\n"
            "Academic Waiver Regulations:\n"
            f"• The student retains Grade '{grade_val}' (0.0 Grade Point).\n"
            f"• The {units} Credit Units are counted in TCU and used in computing GPA & CGPA (with 0.0 GP).\n"
            "• The course will appear with 'W' beside its title and under 'WAIVED COURSES' on Page 1 of the official transcript.\n"
            "• The course is cleared from outstanding carryovers, allowing graduation eligibility.\n\n"
            "Proceed with granting course waiver?"
        )
        if messagebox.askyesno("Confirm Course Waiver", msg, parent=self):
            try:
                self.db.waive_result(result_id)
                self._on_item_saved()
                messagebox.showinfo("Course Waived", f"Course {course_code} has been successfully waived with Grade '{grade_val}'!", parent=self)
            except Exception as e:
                messagebox.showerror("Error", str(e), parent=self)

    def _unwaive_course(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("No Selection", "Please select a course to remove waiver.", parent=self)
            return
        result_data = self._id_map[sel[0]]
        result_id = result_data["id"]
        if messagebox.askyesno("Remove Waiver", f"Remove waiver status for {result_data['course_code']}?", parent=self):
            self.db.unwaive_result(result_id)
            self._on_item_saved()

    def _on_item_saved(self):
        self._refresh()
        if self.on_updated:
            self.on_updated()

    def _delete_result(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("No Selection", "Please select a result row to delete.", parent=self)
            return
        result_data = self._id_map[sel[0]]
        result_id = result_data["id"]
        if messagebox.askyesno("Delete Result", "Remove this result record?", parent=self):
            self.db.delete_result(result_id)
            self._on_item_saved()


class TranscriptDialog(tk.Toplevel):
    """
    Official Academic Transcript / Student Spreadsheet Dialog.
    Displays an on-screen preview of the student's multi-page transcript (semester by semester for each year)
    matching the University of Port Harcourt Department of Management template,
    and allows 1-click printing / PDF export.
    """

    def __init__(self, parent, db, student_id):
        super().__init__(parent)
        self.db = db
        self.student_id = student_id

        self.student = db.get_student_by_id(student_id)
        self.name = self.student["fullname"] if self.student else "Student"
        self.matric = self.student["matric_no"] if self.student else ""

        self.title(f"Official Transcript (Student Spreadsheet) — {self.name} ({self.matric})")
        self.geometry("1000x720")
        self.minsize(880, 580)
        self.transient(parent)
        self.grab_set()
        self.configure(bg="#e8edf2")

        self.transcript_data = transcript_generator.get_transcript_data(student_id, db)
        self.current_page_idx = 0
        self.logo_tk_img = None

        self._build_ui()
        self._render_current_page()

    def _build_ui(self):
        # 1. Top Header Banner
        header = tk.Frame(self, bg=COLOR_PRIMARY, height=42)
        header.pack(fill="x")
        tk.Label(
            header,
            text=f"Official Student Spreadsheet & Academic Transcript: {self.name} [{self.matric}]",
            font=("Segoe UI", 11, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
        ).pack(side="left", padx=14, pady=8)

        # 2. Control Toolbar (Page navigation + PDF actions)
        ctrl_bar = tk.Frame(self, bg="#d9e5f0", padx=12, pady=6)
        ctrl_bar.pack(fill="x")

        # Page Navigation
        self.btn_prev = tk.Button(
            ctrl_bar, text="◀ Previous Year", font=("Segoe UI", 9, "bold"),
            bg="#ffffff", fg="#002b49", relief="solid", bd=1, padx=10, pady=3,
            cursor="hand2", command=self._prev_page
        )
        self.btn_prev.pack(side="left", padx=(0, 6))

        self.lbl_page_info = tk.Label(
            ctrl_bar, text="Page 1 of 4: Year One (100 Level)", font=("Segoe UI", 9, "bold"),
            bg="#d9e5f0", fg="#002b49"
        )
        self.lbl_page_info.pack(side="left", padx=(6, 6))

        self.btn_next = tk.Button(
            ctrl_bar, text="Next Year ▶", font=("Segoe UI", 9, "bold"),
            bg="#ffffff", fg="#002b49", relief="solid", bd=1, padx=10, pady=3,
            cursor="hand2", command=self._next_page
        )
        self.btn_next.pack(side="left", padx=(0, 20))

        ttk.Separator(ctrl_bar, orient="vertical").pack(side="left", fill="y", padx=8)

        # Action Buttons
        btn_print = tk.Button(
            ctrl_bar, text="🖨️ Open / Print PDF", font=("Segoe UI", 9, "bold"),
            bg=COLOR_PRIMARY, fg="#ffffff", activebackground=COLOR_PRIMARY_HOVER,
            activeforeground="#ffffff", relief="flat", bd=0, padx=14, pady=4,
            cursor="hand2", command=self._print_pdf
        )
        btn_print.pack(side="left", padx=6)

        btn_save = tk.Button(
            ctrl_bar, text="💾 Save PDF As...", font=("Segoe UI", 9),
            bg="#ffffff", fg="#333333", relief="solid", bd=1, padx=12, pady=3,
            cursor="hand2", command=self._save_pdf_as
        )
        btn_save.pack(side="left", padx=6)

        btn_close = tk.Button(
            ctrl_bar, text="Close", font=("Segoe UI", 9),
            bg=COLOR_CANCEL, fg="#ffffff", relief="flat", bd=0, padx=12, pady=4,
            cursor="hand2", command=self.destroy
        )
        btn_close.pack(side="right", padx=6)

        # 3. Main Scrollable Container hosting Document Paper Sheet
        container = tk.Frame(self, bg="#e8edf2")
        container.pack(fill="both", expand=True, padx=12, pady=8)

        self.canvas = tk.Canvas(container, bg="#e8edf2", highlightthickness=0)
        self.v_scroll = ttk.Scrollbar(container, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.v_scroll.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.v_scroll.pack(side="right", fill="y")

        self.scroll_frame = tk.Frame(self.canvas, bg="#e8edf2")
        self.canvas_window = self.canvas.create_window((0, 0), window=self.scroll_frame, anchor="n")

        self.scroll_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfig(self.canvas_window, width=e.width))
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)

    def _on_mousewheel(self, event):
        try:
            self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        except Exception:
            pass

    def _prev_page(self):
        if self.current_page_idx > 0:
            self.current_page_idx -= 1
            self._render_current_page()

    def _next_page(self):
        total_pages = len(self.transcript_data["years"]) if self.transcript_data else 1
        if self.current_page_idx < total_pages - 1:
            self.current_page_idx += 1
            self._render_current_page()

    def _render_current_page(self):
        # Clear existing sheet widgets
        for widget in self.scroll_frame.winfo_children():
            widget.destroy()

        if not self.transcript_data or not self.transcript_data["years"]:
            tk.Label(self.scroll_frame, text="No academic records found for student.", font=("Segoe UI", 11), bg="#e8edf2").pack(pady=40)
            return

        years = self.transcript_data["years"]
        total_pages = len(years)
        if self.current_page_idx >= total_pages:
            self.current_page_idx = 0

        curr_year = years[self.current_page_idx]
        student = self.transcript_data["student"]

        # Update page label and button states
        self.lbl_page_info.config(
            text=f"Page {self.current_page_idx + 1} of {total_pages}: {curr_year['year_display']} ({curr_year['level']} Level)"
        )
        self.btn_prev.config(state="normal" if self.current_page_idx > 0 else "disabled")
        self.btn_next.config(state="normal" if self.current_page_idx < total_pages - 1 else "disabled")

        # White Paper Sheet Box (Centered with solid border)
        sheet = tk.Frame(self.scroll_frame, bg="#ffffff", relief="solid", bd=1, padx=20, pady=16)
        sheet.pack(anchor="center", pady=10, fill="x", padx=16)

        # -----------------------------------------------------------------
        # Header: Logo on left, University Titles centered
        # -----------------------------------------------------------------
        hdr_frame = tk.Frame(sheet, bg="#ffffff")
        hdr_frame.pack(fill="x", pady=(0, 6))

        # Left: Logo & "Students Spreadsheet" badge
        logo_box = tk.Frame(hdr_frame, bg="#ffffff", width=120)
        logo_box.pack(side="left", padx=(0, 10))

        logo_loaded = False
        logo_path = transcript_generator.get_logo_path()
        if HAS_PIL and logo_path and os.path.exists(logo_path):
            try:
                pil_img = PILImage.open(logo_path).resize((52, 52), PILImage.Resampling.LANCZOS)
                self.logo_tk_img = PILImageTk.PhotoImage(pil_img)
                lbl_logo = tk.Label(logo_box, image=self.logo_tk_img, bg="#ffffff")
                lbl_logo.pack(anchor="center")
                logo_loaded = True
            except Exception:
                pass

        if not logo_loaded:
            tk.Label(logo_box, text="[UNIPORT]", font=("Segoe UI", 10, "bold"), bg="#ffffff", fg=COLOR_PRIMARY).pack(anchor="center")

        tk.Label(logo_box, text="Students Spreadsheet", font=("Segoe UI", 8, "bold"), bg="#ffffff", fg="#000000").pack(anchor="center", pady=(2, 0))

        # Center: Titles
        title_box = tk.Frame(hdr_frame, bg="#ffffff")
        title_box.pack(side="left", fill="x", expand=True)

        tk.Label(
            title_box, text="UNIVERSITY OF PORT HARCOURT", font=("Segoe UI", 12, "bold"),
            bg="#ffffff", fg="#000000"
        ).pack(anchor="center")
        tk.Label(
            title_box, text="FACULTY OF MANAGEMENT SCIENCES", font=("Segoe UI", 10, "bold"),
            bg="#ffffff", fg="#000000"
        ).pack(anchor="center", pady=1)
        tk.Label(
            title_box, text="DEPARTMENT OF MANAGEMENT", font=("Segoe UI", 10, "bold"),
            bg="#ffffff", fg="#000000"
        ).pack(anchor="center")

        # -----------------------------------------------------------------
        # Student Information Box (2-Column Bordered Box)
        # -----------------------------------------------------------------
        info_box = tk.Frame(sheet, bg="#ffffff", relief="solid", bd=1, padx=8, pady=4)
        info_box.pack(fill="x", pady=(4, 8))

        # Fullname format: SURNAME, Firstname Other
        s_name = (student.get("surname") or "").strip().upper()
        f_name = (student.get("firstname") or "").strip()
        o_name = (student.get("other_name") or "").strip()
        disp_name = f"{s_name}, {f_name}" + (f" {o_name}" if o_name else "") if (s_name and f_name) else student.get("fullname", "")

        # Row 0
        tk.Label(info_box, text=f"Name : {disp_name}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=0, sticky="w", pady=1)
        tk.Label(info_box, text=f"Mat No: {student['matric_no']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=1, sticky="w", padx=20, pady=1)

        # Row 1
        st_origin = student.get("state_of_origin") or "N/A"
        dob_val = student.get("dob") or "N/A"
        sex_val = student.get("sex") or "N/A"
        tk.Label(info_box, text=f"State of Origin: {st_origin}", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=1, column=0, sticky="w", pady=1)
        tk.Label(info_box, text=f"Date of Birth: {dob_val}        Sex: {sex_val}", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=1, column=1, sticky="w", padx=20, pady=1)

        # Row 2
        marital_val = student.get("marital_status") or "Single"
        tk.Label(info_box, text="", font=("Segoe UI", 9), bg="#ffffff").grid(row=2, column=0, sticky="w")
        tk.Label(info_box, text=f"Marital Status: {marital_val}", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=2, column=1, sticky="w", padx=20, pady=1)

        info_box.grid_columnconfigure(0, weight=1)
        info_box.grid_columnconfigure(1, weight=1)

        # -----------------------------------------------------------------
        # Semester Tables for This Academic Year
        # -----------------------------------------------------------------
        for sem in curr_year["semesters"]:
            # Semester Title Banner
            sem_title_frame = tk.Frame(sheet, bg="#ffffff")
            sem_title_frame.pack(fill="x", pady=(6, 2))

            tk.Label(
                sem_title_frame, text=sem["sem_title"], font=("Segoe UI", 9, "bold"),
                bg="#ffffff", fg="#000000"
            ).pack(side="left")
            tk.Label(
                sem_title_frame, text=sem["session"], font=("Segoe UI", 9, "bold"),
                bg="#ffffff", fg="#000000"
            ).pack(side="right")

            # Table Container (Unified Grid for pixel-perfect vertical column alignment)
            tbl_frame = tk.Frame(sheet, bg="#000000", relief="solid", bd=1)
            tbl_frame.pack(fill="x", pady=(0, 6))

            cols_def = [
                ("Course Code", 0, 100, "w"),
                ("Course Title", 1, 320, "w"),
                ("CU", 0, 48, "center"),
                ("Mark", 0, 52, "center"),
                ("Grade", 0, 52, "center"),
                ("GP", 0, 48, "center"),
                ("QP", 0, 52, "center"),
            ]

            for c_idx, (_, c_weight, c_minsize, _) in enumerate(cols_def):
                tbl_frame.grid_columnconfigure(c_idx, weight=c_weight, minsize=c_minsize)

            # Row 0: Table Header
            for c_idx, (c_title, _, _, c_anch) in enumerate(cols_def):
                tk.Label(
                    tbl_frame, text=c_title, font=("Segoe UI", 8, "bold"),
                    bg="#f0f0f0", fg="#000000", anchor=c_anch, padx=4, pady=3,
                    relief="flat"
                ).grid(row=0, column=c_idx, sticky="nsew", padx=1, pady=1)

            current_row = 1
            courses = sem["courses"]
            if courses:
                for i, c in enumerate(courses):
                    bg_c = "#ffffff" if i % 2 == 0 else "#f9f9f9"
                    grd_fg = "#137333" if c["grade"] in ("A", "B", "C") else ("#c5221f" if c["grade"] == "F" else "#222222")

                    tk.Label(tbl_frame, text=c["code"], font=("Segoe UI", 8, "bold"), bg=bg_c, anchor="w", padx=6, pady=2).grid(row=current_row, column=0, sticky="nsew", padx=1, pady=1)
                    tk.Label(tbl_frame, text=c.get("title_display", c["title"]), font=("Segoe UI", 8), bg=bg_c, anchor="w", padx=6, pady=2).grid(row=current_row, column=1, sticky="nsew", padx=1, pady=1)
                    tk.Label(tbl_frame, text=c.get("cu_display_unicode", str(c["cu"])), font=("Segoe UI", 8), bg=bg_c, anchor="center", padx=4, pady=2).grid(row=current_row, column=2, sticky="nsew", padx=1, pady=1)
                    tk.Label(tbl_frame, text=str(c["mark"]), font=("Segoe UI", 8), bg=bg_c, anchor="center", padx=4, pady=2).grid(row=current_row, column=3, sticky="nsew", padx=1, pady=1)
                    tk.Label(tbl_frame, text=c["grade"], font=("Segoe UI", 8, "bold"), bg=bg_c, fg=grd_fg, anchor="center", padx=4, pady=2).grid(row=current_row, column=4, sticky="nsew", padx=1, pady=1)
                    tk.Label(tbl_frame, text=str(c["gp"]), font=("Segoe UI", 8), bg=bg_c, anchor="center", padx=4, pady=2).grid(row=current_row, column=5, sticky="nsew", padx=1, pady=1)
                    tk.Label(tbl_frame, text=c.get("qp_display_unicode", str(c["qp"])), font=("Segoe UI", 8, "bold"), bg=bg_c, anchor="center", padx=4, pady=2).grid(row=current_row, column=6, sticky="nsew", padx=1, pady=1)
                    current_row += 1
            else:
                tk.Label(tbl_frame, text="-", font=("Segoe UI", 8), bg="#ffffff", anchor="center", padx=4, pady=2).grid(row=current_row, column=0, sticky="nsew", padx=1, pady=1)
                tk.Label(tbl_frame, text="No recorded scores for this semester", font=("Segoe UI", 8, "italic"), bg="#ffffff", fg="#888888", anchor="w", padx=6, pady=2).grid(row=current_row, column=1, sticky="nsew", padx=1, pady=1)
                for col_k in range(2, 7):
                    tk.Label(tbl_frame, text="-", font=("Segoe UI", 8), bg="#ffffff", anchor="center", padx=4, pady=2).grid(row=current_row, column=col_k, sticky="nsew", padx=1, pady=1)
                current_row += 1

            # Total Row
            tk.Label(tbl_frame, text="Total", font=("Segoe UI", 8, "bold"), bg="#f0f0f0", anchor="w", padx=6, pady=2).grid(row=current_row, column=0, sticky="nsew", padx=1, pady=1)
            tk.Label(tbl_frame, text="", font=("Segoe UI", 8), bg="#f0f0f0", anchor="w", padx=6, pady=2).grid(row=current_row, column=1, sticky="nsew", padx=1, pady=1)
            tk.Label(tbl_frame, text=str(sem["total_cu"]), font=("Segoe UI", 8, "bold"), bg="#f0f0f0", anchor="center", padx=4, pady=2).grid(row=current_row, column=2, sticky="nsew", padx=1, pady=1)
            tk.Label(tbl_frame, text="", font=("Segoe UI", 8), bg="#f0f0f0", anchor="center", padx=4, pady=2).grid(row=current_row, column=3, sticky="nsew", padx=1, pady=1)
            tk.Label(tbl_frame, text="", font=("Segoe UI", 8), bg="#f0f0f0", anchor="center", padx=4, pady=2).grid(row=current_row, column=4, sticky="nsew", padx=1, pady=1)
            tk.Label(tbl_frame, text="", font=("Segoe UI", 8), bg="#f0f0f0", anchor="center", padx=4, pady=2).grid(row=current_row, column=5, sticky="nsew", padx=1, pady=1)
            tk.Label(tbl_frame, text=str(sem["total_qp"]), font=("Segoe UI", 8, "bold"), bg="#f0f0f0", anchor="center", padx=4, pady=2).grid(row=current_row, column=6, sticky="nsew", padx=1, pady=1)

        # -----------------------------------------------------------------
        # Year Summary Block: TQP, TCU, GPA, CGPA, Waived Courses (Pg 1), Final Stats (Last Pg)
        # -----------------------------------------------------------------
        summary_frame = tk.Frame(sheet, bg="#ffffff")
        summary_frame.pack(fill="x", pady=(4, 10))

        s_box = tk.Frame(summary_frame, bg="#ffffff")
        s_box.pack(fill="x")

        for c_k in range(4):
            s_box.grid_columnconfigure(c_k, weight=1)

        if curr_year.get("is_last_page"):
            tot_cu = self.transcript_data["total_cumulative_cu"]
            tot_qp = int(self.transcript_data["total_cumulative_qp"]) if self.transcript_data["total_cumulative_qp"] == int(self.transcript_data["total_cumulative_qp"]) else round(self.transcript_data["total_cumulative_qp"], 1)
            fin_cgpa = self.transcript_data["final_cgpa"]
            deg_class = self.transcript_data["degree_class"]

            for c_k in range(4):
                s_box.grid_columnconfigure(c_k, weight=1)

            # Row 0: TQP | TCU | GPA | (empty)
            tk.Label(s_box, text=f"TQP :       {curr_year['tqp']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=0, sticky="w", padx=4, pady=1)
            tk.Label(s_box, text=f"TCU :       {curr_year['tcu']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=1, sticky="w", padx=4, pady=1)
            tk.Label(s_box, text=f"GPA :       {curr_year['gpa']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=2, sticky="w", padx=4, pady=1)

            # Row 1: FINAL TQP | FINAL TCU | CGPA | CLASS
            tk.Label(s_box, text=f"FINAL TQP : {tot_qp}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=1, column=0, sticky="w", padx=4, pady=1)
            tk.Label(s_box, text=f"FINAL TCU : {tot_cu}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=1, column=1, sticky="w", padx=4, pady=1)
            tk.Label(s_box, text=f"CGPA : {fin_cgpa}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=1, column=2, sticky="w", padx=4, pady=1)
            tk.Label(s_box, text=f"CLASS : {deg_class}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=1, column=3, sticky="w", padx=4, pady=1)
        else:
            s_box.grid_columnconfigure(0, weight=2)
            s_box.grid_columnconfigure(1, weight=1)
            s_box.grid_columnconfigure(2, weight=1)
            s_box.grid_columnconfigure(3, weight=0)

            if curr_year.get("show_waived_courses"):
                tk.Label(s_box, text=f"WAIVED COURSES : {curr_year.get('waived_courses', 'NIL')}", font=("Segoe UI", 8, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=0, rowspan=2, sticky="w", padx=4, pady=1)

            # Row 0: TCU = ... | GPA = ...
            tk.Label(s_box, text=f"TCU = {curr_year['tcu']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=1, sticky="w", padx=10, pady=1)
            tk.Label(s_box, text=f"GPA = {curr_year['gpa']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=0, column=2, sticky="w", padx=10, pady=1)

            # Row 1: TQP = ... | CGPA = ...
            tk.Label(s_box, text=f"TQP = {curr_year['tqp']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=1, column=1, sticky="w", padx=10, pady=1)
            tk.Label(s_box, text=f"CGPA = {curr_year['cgpa']}", font=("Segoe UI", 9, "bold"), bg="#ffffff", anchor="w").grid(row=1, column=2, sticky="w", padx=10, pady=1)

        # -----------------------------------------------------------------
        # Signature Block & Dynamic Footnotes
        # -----------------------------------------------------------------
        sig_frame = tk.Frame(sheet, bg="#ffffff")
        sig_frame.pack(fill="x", pady=(6, 4))

        tk.Label(sig_frame, text="Signed:\nHead of\nDepartment", font=("Segoe UI", 9, "bold"), bg="#ffffff", justify="left", anchor="w").pack(side="left", padx=(4, 14))
        
        sig_right = tk.Frame(sig_frame, bg="#ffffff")
        sig_right.pack(side="left", fill="x", expand=True, pady=(12, 0))
        tk.Label(sig_right, text="Dr. W. Sylva", font=("Segoe UI", 9), bg="#ffffff", anchor="w").pack(anchor="w")
        tk.Frame(sig_right, bg="#000000", height=1).pack(fill="x", pady=(2, 0))

        # Dynamic Footnotes: only render if required on this page
        footnotes = curr_year.get("footnotes", [])
        if footnotes:
            fn_frame = tk.Frame(sheet, bg="#ffffff")
            fn_frame.pack(fill="x", pady=(6, 0))
            for fn_text in footnotes:
                tk.Label(fn_frame, text=fn_text, font=("Segoe UI", 7), bg="#ffffff", fg="#444444").pack(anchor="center")

    def _print_pdf(self):
        try:
            temp_pdf = transcript_generator.generate_transcript_pdf(self.student_id, self.db)
            if os.name == "nt":
                os.startfile(temp_pdf)
            else:
                import subprocess
                subprocess.Popen(["xdg-open", temp_pdf])
            messagebox.showinfo("PDF Generated", f"Official Transcript PDF generated and opened!\n\nFile location:\n{temp_pdf}", parent=self)
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to generate transcript PDF:\n{exc}", parent=self)

    def _save_pdf_as(self):
        try:
            matric_clean = self.student["matric_no"].replace("/", "_").replace("\\", "_")
            default_name = f"Transcript_{matric_clean}.pdf"
            target = filedialog.asksaveasfilename(
                parent=self,
                title="Save Official Transcript PDF",
                defaultextension=".pdf",
                initialfile=default_name,
                filetypes=[("PDF Documents", "*.pdf"), ("All Files", "*.*")]
            )
            if target:
                transcript_generator.generate_transcript_pdf(self.student_id, self.db, output_path=target)
                messagebox.showinfo("Saved", f"Transcript PDF saved successfully to:\n{target}", parent=self)
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to save transcript PDF:\n{exc}", parent=self)


class AboutDialog(tk.Toplevel):
    """About dialog for CDRMS."""

    def __init__(self, parent):
        super().__init__(parent)
        self.title("About CDRMS")
        self.geometry("380x240")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        header = tk.Frame(self, bg=COLOR_PRIMARY, height=40)
        header.pack(fill="x")
        tk.Label(
            header, text="CDRMS", font=("Segoe UI", 11, "bold"),
            bg=COLOR_PRIMARY, fg="white"
        ).pack(side="left", padx=16, pady=8)

        body = ttk.Frame(self, padding=16)
        body.pack(fill="both", expand=True)

        ttk.Label(body, text="CGPA & Degree Result Management System", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        ttk.Label(body, text="A comprehensive desktop management suite for student records,\nacademic courses, grade computations, and degree classifications.").pack(anchor="w", pady=(6, 12))
        ttk.Label(body, text="Standard 5-point grading system").pack(anchor="w")

        ttk.Button(self, text="Close", command=self.destroy).pack(pady=(0, 12))

