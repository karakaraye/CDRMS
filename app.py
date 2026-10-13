"""
app.py
------
Main application window for the CGPA & Degree Result Management System (CDRMS).
Matches the original CDRMS layout with 3 main columns:
  - Left: RECORDS tree (ALL AVAILABLE RECORDS -> STUDENT SETS -> U2023, U2024...)
  - Center: Full-Time / Part-Time student tables + Recently Added Records
  - Right: Quick Overview (YEAR/QP/CU breakdown, CGPA, Class, Outstanding) + Task Manager
"""

import tkinter as tk
from tkinter import ttk, messagebox

from database import Database, get_degree_class
import transcript_generator
from dialogs import (
    StudentDialog,
    CourseManagerDialog,
    ResultDialog,
    WorksheetDialog,
    TranscriptDialog,
    AboutDialog,
)

# Brand Colors matching the original Cdrms screenshot
COLOR_PRIMARY = "#0858a8"       # Deep blue header and toolbar
COLOR_PRIMARY_HOVER = "#0b66c2" # Hover state
COLOR_ACCENT = "#1f77b4"        # Table header blue
COLOR_BG_LIGHT = "#f4f7fa"      # Main background
COLOR_TAB_ACTIVE_BG = "#0858a8" # Active tab background
COLOR_TAB_ACTIVE_FG = "#ffffff" # Active tab text
COLOR_TAB_INACTIVE_BG = "#e1ecf7" # Inactive tab background
COLOR_TAB_INACTIVE_FG = "#0858a8" # Inactive tab text


class CdrmsApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Cdrms")
        self.geometry("1100x680")
        self.minsize(920, 580)
        self.configure(bg="#e8edf2")

        self.db = Database()
        self._selected_student_id = None
        self._current_batch_filter = None
        self._active_main_tab = "Full-Time"  # "Full-Time" or "Part-Time"
        self._active_recent_tab = "Full-Time"
        self._outstanding_data = []

        self._configure_styles()
        self._build_menu()
        self._build_toolbar()
        self._build_main_layout()

        self._load_records_tree()
        self._refresh_all_views()

    # ------------------------------------------------------------------
    # Styles & Theming
    # ------------------------------------------------------------------
    def _configure_styles(self):
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except Exception:
            pass

        # Treeview heading style
        style.configure(
            "Cdrms.Treeview.Heading",
            background=COLOR_PRIMARY,
            foreground="#ffffff",
            font=("Segoe UI", 9, "bold"),
            relief="flat",
            padding=4,
        )
        style.map(
            "Cdrms.Treeview.Heading",
            background=[("active", COLOR_PRIMARY_HOVER)],
            foreground=[("active", "#ffffff")],
        )

        style.configure(
            "Cdrms.Treeview",
            font=("Segoe UI", 9),
            rowheight=24,
            background="#ffffff",
            fieldbackground="#ffffff",
            relief="flat",
        )
        style.map(
            "Cdrms.Treeview",
            background=[("selected", "#cce5ff")],
            foreground=[("selected", "#002b49")],
        )

        # Right overview table
        style.configure(
            "Overview.Treeview.Heading",
            background=COLOR_PRIMARY,
            foreground="#ffffff",
            font=("Segoe UI", 8, "bold"),
            relief="flat",
            padding=2,
        )
        style.configure(
            "Overview.Treeview",
            font=("Segoe UI", 8),
            rowheight=20,
            background="#ffffff",
        )

    # ------------------------------------------------------------------
    # Menu Bar
    # ------------------------------------------------------------------
    def _build_menu(self):
        menubar = tk.Menu(self)

        # File
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="New Student", command=self._add_student, accelerator="Ctrl+N")
        file_menu.add_command(label="Refresh", command=self._refresh_all_views, accelerator="F5")
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.quit)
        menubar.add_cascade(label="File", menu=file_menu)

        # View
        view_menu = tk.Menu(menubar, tearoff=0)
        view_menu.add_command(label="All Records", command=lambda: self._filter_by_batch(None))
        view_menu.add_command(label="Full-Time Students", command=lambda: self._set_main_tab("Full-Time"))
        view_menu.add_command(label="Part-Time Students", command=lambda: self._set_main_tab("Part-Time"))
        menubar.add_cascade(label="View", menu=view_menu)

        # Worksheet
        ws_menu = tk.Menu(menubar, tearoff=0)
        ws_menu.add_command(label="Open Results Worksheet", command=self._open_results)
        ws_menu.add_command(label="Enter Course Score", command=self._add_result)
        ws_menu.add_command(label="Academic Transcript (Student Spreadsheet)", command=self._open_transcript)
        menubar.add_cascade(label="Worksheet", menu=ws_menu)

        # Manage
        manage_menu = tk.Menu(menubar, tearoff=0)
        manage_menu.add_command(label="Manage Courses", command=self._open_courses)
        manage_menu.add_command(label="Manage Students", command=self._refresh_all_views)
        menubar.add_cascade(label="Manage", menu=manage_menu)

        # Options
        opt_menu = tk.Menu(menubar, tearoff=0)
        opt_menu.add_command(label="Grading Scheme (5-Point Scale)", command=self._show_grading_info)
        menubar.add_cascade(label="Options", menu=opt_menu)

        # Help
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="About Cdrms", command=lambda: AboutDialog(self))
        menubar.add_cascade(label="Help", menu=help_menu)

        self.config(menu=menubar)
        self.bind_all("<F5>", lambda e: self._refresh_all_views())
        self.bind_all("<Control-n>", lambda e: self._add_student())

    # ------------------------------------------------------------------
    # Top Toolbar
    # ------------------------------------------------------------------
    def _build_toolbar(self):
        self.toolbar = tk.Frame(self, bg=COLOR_PRIMARY, height=36, padx=8, pady=4)
        self.toolbar.pack(side="top", fill="x")

        # Custom flat toolbar button helper
        def make_tool_btn(parent, text, cmd):
            btn = tk.Button(
                parent,
                text=text,
                command=cmd,
                font=("Segoe UI", 9, "bold"),
                bg=COLOR_PRIMARY,
                fg="#ffffff",
                activebackground=COLOR_PRIMARY_HOVER,
                activeforeground="#ffffff",
                relief="flat",
                bd=0,
                padx=8,
                pady=2,
                cursor="hand2",
            )
            btn.pack(side="left", padx=2)
            return btn

        make_tool_btn(self.toolbar, "+ Student", self._add_student)
        make_tool_btn(self.toolbar, "✎ Edit", self._edit_student)
        make_tool_btn(self.toolbar, "✖ Delete", self._delete_student)
        make_tool_btn(self.toolbar, "Results", self._open_results)
        make_tool_btn(self.toolbar, "📄 Transcript", self._open_transcript)
        make_tool_btn(self.toolbar, "Courses", self._open_courses)

        # Right side: Search & Refresh
        self.refresh_btn = make_tool_btn(self.toolbar, "⟳ Refresh", self._refresh_all_views)
        self.refresh_btn.pack(side="right", padx=(4, 0))

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._on_search_change())
        self.search_entry = tk.Entry(
            self.toolbar,
            textvariable=self.search_var,
            font=("Segoe UI", 9),
            width=18,
            relief="solid",
            bd=1,
        )
        self.search_entry.pack(side="right", padx=(4, 6), ipady=2)

        tk.Label(
            self.toolbar,
            text="Search:",
            font=("Segoe UI", 9, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
        ).pack(side="right", padx=(10, 2))

    # ------------------------------------------------------------------
    # Main Body Layout (3 Columns)
    # ------------------------------------------------------------------
    def _build_main_layout(self):
        container = tk.Frame(self, bg="#e8edf2")
        container.pack(fill="both", expand=True, padx=4, pady=4)

        # 1. Left Column: RECORDS Tree
        self.left_col = tk.Frame(container, bg="#ffffff", relief="solid", bd=1, width=180)
        self.left_col.pack(side="left", fill="y", padx=(0, 3))
        self.left_col.pack_propagate(False)
        self._build_left_records_panel(self.left_col)

        # 3. Right Column: Quick Overview + Task Manager
        self.right_col = tk.Frame(container, bg="#ffffff", relief="solid", bd=1, width=280)
        self.right_col.pack(side="right", fill="y", padx=(3, 0))
        self.right_col.pack_propagate(False)
        self._build_right_overview_panel(self.right_col)

        # 2. Center Column: Main Student List + Recently Added Records
        self.center_col = tk.Frame(container, bg="#e8edf2")
        self.center_col.pack(side="left", fill="both", expand=True)
        self._build_center_student_panel(self.center_col)

    # ------------------------------------------------------------------
    # Left Column: RECORDS Navigation Tree
    # ------------------------------------------------------------------
    def _build_left_records_panel(self, parent):
        header = tk.Frame(parent, bg=COLOR_PRIMARY, height=26)
        header.pack(fill="x")
        tk.Label(
            header,
            text="RECORDS",
            font=("Segoe UI", 9, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
        ).pack(side="left", padx=8, pady=3)

        self.records_tree = ttk.Treeview(
            parent,
            show="tree",
            selectmode="browse",
            style="Cdrms.Treeview",
        )
        self.records_tree.pack(fill="both", expand=True, padx=2, pady=2)
        self.records_tree.bind("<<TreeviewSelect>>", self._on_records_tree_select)

    def _load_records_tree(self):
        self.records_tree.delete(*self.records_tree.get_children())
        root_node = self.records_tree.insert(
            "", "end", iid="root_all", text="📁 ALL AVAILABLE RECORDS", open=True
        )
        sets_node = self.records_tree.insert(
            root_node, "end", iid="root_sets", text="📁 STUDENT SETS", open=True
        )

        batches_with_counts = self.db.get_distinct_batches_with_counts()
        for b, count in batches_with_counts:
            label = f"📄 {b} ({count})" if count > 0 else f"📄 {b}"
            self.records_tree.insert(
                sets_node, "end", iid=f"batch_{b}", text=label, open=True
            )

    def _on_records_tree_select(self, _event=None):
        sel = self.records_tree.selection()
        if not sel:
            return
        node_id = sel[0]
        if node_id.startswith("batch_"):
            batch = node_id.replace("batch_", "")
            self._filter_by_batch(batch)
        else:
            self._filter_by_batch(None)

    # ------------------------------------------------------------------
    # Center Column: Main Student Table + Recently Added Records
    # ------------------------------------------------------------------
    def _build_center_student_panel(self, parent):
        # Top Center: Main Student List
        self.top_center_frame = tk.Frame(parent, bg="#ffffff", relief="solid", bd=1)
        self.top_center_frame.pack(side="top", fill="both", expand=True, pady=(0, 3))

        # Tabs bar: [ Full-Time ] [ Part-Time ]
        tabs_bar = tk.Frame(self.top_center_frame, bg="#e8edf2")
        tabs_bar.pack(fill="x")

        self.btn_fulltime = tk.Button(
            tabs_bar,
            text="Full-Time",
            font=("Segoe UI", 9, "bold"),
            bg=COLOR_TAB_ACTIVE_BG,
            fg=COLOR_TAB_ACTIVE_FG,
            relief="flat",
            bd=0,
            padx=14,
            pady=4,
            command=lambda: self._set_main_tab("Full-Time"),
            cursor="hand2",
        )
        self.btn_fulltime.pack(side="left", padx=(0, 2))

        self.btn_parttime = tk.Button(
            tabs_bar,
            text="Part-Time",
            font=("Segoe UI", 9, "bold"),
            bg=COLOR_TAB_INACTIVE_BG,
            fg=COLOR_TAB_INACTIVE_FG,
            relief="flat",
            bd=0,
            padx=14,
            pady=4,
            command=lambda: self._set_main_tab("Part-Time"),
            cursor="hand2",
        )
        self.btn_parttime.pack(side="left")

        # Student Table
        columns = ("matric", "fullname")
        self.main_tree = ttk.Treeview(
            self.top_center_frame,
            columns=columns,
            show="headings",
            style="Cdrms.Treeview",
            selectmode="browse",
        )
        self.main_tree.heading("matric", text="Matric No.")
        self.main_tree.heading("fullname", text="Full Name")
        self.main_tree.column("matric", width=140, anchor="w")
        self.main_tree.column("fullname", width=300, anchor="w")

        v_scroll = ttk.Scrollbar(self.top_center_frame, orient="vertical", command=self.main_tree.yview)
        h_scroll = ttk.Scrollbar(self.top_center_frame, orient="horizontal", command=self.main_tree.xview)
        self.main_tree.configure(yscrollcommand=v_scroll.set, xscrollcommand=h_scroll.set)

        self.main_tree.pack(side="left", fill="both", expand=True)
        v_scroll.pack(side="right", fill="y")
        h_scroll.pack(side="bottom", fill="x")

        self.main_tree.bind("<<TreeviewSelect>>", self._on_student_select)
        self.main_tree.bind("<Double-1>", self._on_student_double_click)
        self.main_tree.bind("<Button-3>", self._show_tree_context_menu)

        # Context Menu for Student Rows
        self.context_menu = tk.Menu(self, tearoff=0)
        self.context_menu.add_command(label="📄 View Official Transcript", command=self._open_transcript)
        self.context_menu.add_command(label="📝 Enter Course Scores", command=self._add_result)
        self.context_menu.add_command(label="📊 View Results Worksheet", command=self._open_results)
        self.context_menu.add_separator()
        self.context_menu.add_command(label="✎ Edit Student Profile", command=self._edit_student)
        self.context_menu.add_command(label="✖ Delete Student", command=self._delete_student)

        # Bottom Center: Recently Added Records Panel
        self.recent_frame = tk.Frame(parent, bg="#ffffff", relief="solid", bd=1, height=180)
        self.recent_frame.pack(side="bottom", fill="x", pady=(3, 0))
        self.recent_frame.pack_propagate(False)

        # Header with close 'X'
        recent_header = tk.Frame(self.recent_frame, bg=COLOR_PRIMARY, height=24)
        recent_header.pack(fill="x")
        tk.Label(
            recent_header,
            text="Recently Added Records",
            font=("Segoe UI", 9, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
        ).pack(side="left", padx=8, pady=2)

        # Tabs for Recently Added
        recent_tabs = tk.Frame(self.recent_frame, bg="#e8edf2")
        recent_tabs.pack(fill="x")

        self.btn_rec_fulltime = tk.Button(
            recent_tabs,
            text="Recently Added Full-Time",
            font=("Segoe UI", 8, "bold"),
            bg=COLOR_TAB_ACTIVE_BG,
            fg=COLOR_TAB_ACTIVE_FG,
            relief="flat",
            bd=0,
            padx=10,
            pady=2,
            command=lambda: self._set_recent_tab("Full-Time"),
            cursor="hand2",
        )
        self.btn_rec_fulltime.pack(side="left", padx=(0, 2))

        self.btn_rec_parttime = tk.Button(
            recent_tabs,
            text="Recently Added Part-Time",
            font=("Segoe UI", 8, "bold"),
            bg=COLOR_TAB_INACTIVE_BG,
            fg=COLOR_TAB_INACTIVE_FG,
            relief="flat",
            bd=0,
            padx=10,
            pady=2,
            command=lambda: self._set_recent_tab("Part-Time"),
            cursor="hand2",
        )
        self.btn_rec_parttime.pack(side="left")

        # Recent Table
        rec_cols = ("matric", "fullname", "batch", "date")
        self.recent_tree = ttk.Treeview(
            self.recent_frame,
            columns=rec_cols,
            show="headings",
            style="Cdrms.Treeview",
            height=4,
            selectmode="browse",
        )
        self.recent_tree.heading("matric", text="Matric Number")
        self.recent_tree.heading("fullname", text="Student FullName")
        self.recent_tree.heading("batch", text="Student Batch")
        self.recent_tree.heading("date", text="Record Date")

        self.recent_tree.column("matric", width=120)
        self.recent_tree.column("fullname", width=180)
        self.recent_tree.column("batch", width=90, anchor="center")
        self.recent_tree.column("date", width=130, anchor="center")

        rec_scroll = ttk.Scrollbar(self.recent_frame, orient="vertical", command=self.recent_tree.yview)
        self.recent_tree.configure(yscrollcommand=rec_scroll.set)

        self.recent_tree.pack(side="left", fill="both", expand=True)
        rec_scroll.pack(side="right", fill="y")
        self.recent_tree.bind("<<TreeviewSelect>>", self._on_recent_select)
        self.recent_tree.bind("<Button-3>", self._show_tree_context_menu)

    def _show_tree_context_menu(self, event):
        tree = event.widget
        row_id = tree.identify_row(event.y)
        if row_id:
            tree.selection_set(row_id)
            if tree == self.main_tree:
                self._on_student_select()
            elif tree == self.recent_tree:
                self._on_recent_select()
            self.context_menu.tk_popup(event.x_root, event.y_root)


    # ------------------------------------------------------------------
    # Right Column: Quick Overview & Task Manager
    # ------------------------------------------------------------------
    def _build_right_overview_panel(self, parent):
        # Quick Overview Top
        self.overview_frame = tk.Frame(parent, bg="#ffffff")
        self.overview_frame.pack(side="top", fill="both", expand=True)

        header = tk.Frame(self.overview_frame, bg=COLOR_PRIMARY, height=24)
        header.pack(fill="x")
        tk.Label(
            header,
            text="Quick Overview",
            font=("Segoe UI", 9, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
        ).pack(side="left", padx=8, pady=2)

        # Year Breakdown Table: YEAR | QP | CU
        overview_cols = ("year", "qp", "cu")
        self.overview_tree = ttk.Treeview(
            self.overview_frame,
            columns=overview_cols,
            show="headings",
            style="Overview.Treeview",
            height=5,
        )
        self.overview_tree.heading("year", text="YEAR")
        self.overview_tree.heading("qp", text="QP")
        self.overview_tree.heading("cu", text="CU")
        self.overview_tree.column("year", width=110, anchor="w")
        self.overview_tree.column("qp", width=65, anchor="center")
        self.overview_tree.column("cu", width=65, anchor="center")
        self.overview_tree.pack(fill="x", padx=4, pady=4)

        # CGPA and Class Summary
        info_panel = tk.Frame(self.overview_frame, bg="#ffffff", padx=8, pady=4)
        info_panel.pack(fill="x")

        self.lbl_cgpa = tk.Label(
            info_panel,
            text="CGPA : ",
            font=("Segoe UI", 9, "bold"),
            bg="#ffffff",
            fg="#000000",
            anchor="w",
        )
        self.lbl_cgpa.pack(fill="x", pady=2)

        self.lbl_class = tk.Label(
            info_panel,
            text="CLASS : ",
            font=("Segoe UI", 9, "bold"),
            bg="#ffffff",
            fg="#000000",
            anchor="w",
        )
        self.lbl_class.pack(fill="x", pady=2)

        # Outstanding Section
        tk.Label(
            self.overview_frame,
            text="OUTSTANDING",
            font=("Segoe UI", 9, "bold"),
            bg="#ffffff",
            fg="#000000",
            anchor="w",
        ).pack(fill="x", padx=8, pady=(6, 2))

        out_frame = tk.Frame(self.overview_frame, bg="#ffffff", relief="solid", bd=1)
        out_frame.pack(fill="both", expand=True, padx=8, pady=(0, 4))

        self.outstanding_box = tk.Listbox(
            out_frame,
            font=("Segoe UI", 8),
            relief="flat",
            bd=0,
            highlightthickness=0,
        )
        out_scroll = ttk.Scrollbar(out_frame, orient="vertical", command=self.outstanding_box.yview)
        self.outstanding_box.configure(yscrollcommand=out_scroll.set)
        self.outstanding_box.pack(side="left", fill="both", expand=True)
        out_scroll.pack(side="right", fill="y")

        # Context menu for Outstanding Courses
        self.out_context_menu = tk.Menu(self, tearoff=0)
        self.out_context_menu.add_command(
            label="🎓 Waive Course (Grant Grade E)",
            command=self._waive_selected_outstanding,
        )
        self.out_context_menu.add_command(
            label="📝 Open Results Worksheet",
            command=self._open_results,
        )
        self.outstanding_box.bind("<Button-3>", self._show_out_context)
        self.outstanding_box.bind("<Double-Button-1>", self._on_outstanding_double_click)

        # Official Transcript Action Button in Overview
        self.btn_transcript_panel = tk.Button(
            self.overview_frame,
            text="📄 View / Print Official Transcript",
            font=("Segoe UI", 8, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
            activebackground=COLOR_PRIMARY_HOVER,
            activeforeground="#ffffff",
            relief="flat",
            bd=0,
            padx=8,
            pady=4,
            cursor="hand2",
            command=self._open_transcript,
        )
        self.btn_transcript_panel.pack(fill="x", padx=8, pady=(2, 6))

        # Bottom: Task Manager
        tm_frame = tk.Frame(parent, bg="#ffffff", relief="solid", bd=1, height=85)
        tm_frame.pack(side="bottom", fill="x")
        tm_frame.pack_propagate(False)

        tm_header = tk.Frame(tm_frame, bg=COLOR_PRIMARY, height=22)
        tm_header.pack(fill="x")
        tk.Label(
            tm_header,
            text="Task Manager",
            font=("Segoe UI", 9, "bold"),
            bg=COLOR_PRIMARY,
            fg="#ffffff",
        ).pack(side="left", padx=8, pady=1)

        tm_body = tk.Frame(tm_frame, bg="#ffffff", padx=8, pady=4)
        tm_body.pack(fill="both", expand=True)

        tk.Label(
            tm_body,
            text="Cdrms Result Queue",
            font=("Segoe UI", 8, "bold"),
            bg="#ffffff",
            fg="#333333",
            anchor="w",
        ).pack(fill="x")

        self.lbl_task_status = tk.Label(
            tm_body,
            text="No Task",
            font=("Segoe UI", 8),
            bg="#ffffff",
            fg="#666666",
            anchor="w",
        )
        self.lbl_task_status.pack(fill="x", pady=2)

    # ------------------------------------------------------------------
    # Data Refresh & Tab Handlers
    # ------------------------------------------------------------------
    def _set_main_tab(self, tab_type):
        self._active_main_tab = tab_type
        if tab_type == "Full-Time":
            self.btn_fulltime.config(bg=COLOR_TAB_ACTIVE_BG, fg=COLOR_TAB_ACTIVE_FG)
            self.btn_parttime.config(bg=COLOR_TAB_INACTIVE_BG, fg=COLOR_TAB_INACTIVE_FG)
        else:
            self.btn_fulltime.config(bg=COLOR_TAB_INACTIVE_BG, fg=COLOR_TAB_INACTIVE_FG)
            self.btn_parttime.config(bg=COLOR_TAB_ACTIVE_BG, fg=COLOR_TAB_ACTIVE_FG)
        self._refresh_main_student_list()

    def _set_recent_tab(self, tab_type):
        self._active_recent_tab = tab_type
        if tab_type == "Full-Time":
            self.btn_rec_fulltime.config(bg=COLOR_TAB_ACTIVE_BG, fg=COLOR_TAB_ACTIVE_FG)
            self.btn_rec_parttime.config(bg=COLOR_TAB_INACTIVE_BG, fg=COLOR_TAB_INACTIVE_FG)
        else:
            self.btn_rec_fulltime.config(bg=COLOR_TAB_INACTIVE_BG, fg=COLOR_TAB_INACTIVE_FG)
            self.btn_rec_parttime.config(bg=COLOR_TAB_ACTIVE_BG, fg=COLOR_TAB_ACTIVE_FG)
        self._refresh_recent_student_list()

    def _filter_by_batch(self, batch):
        self._current_batch_filter = batch
        self._refresh_main_student_list()

    def _on_search_change(self):
        self._refresh_main_student_list()

    def _refresh_all_views(self):
        self._load_records_tree()
        self._refresh_main_student_list()
        self._refresh_recent_student_list()
        if self._selected_student_id:
            self._update_overview_panel(self._selected_student_id)
        else:
            self._clear_overview_panel()

    def _refresh_main_student_list(self):
        self.main_tree.delete(*self.main_tree.get_children())
        search = self.search_var.get().strip()
        students = self.db.get_all_students(
            student_type=self._active_main_tab,
            batch=self._current_batch_filter,
            search_term=search if search else None,
        )
        if not students:
            self.main_tree.insert(
                "", "end", iid="empty_placeholder",
                values=("", "No Records Found"),
            )
            return

        for s in students:
            self.main_tree.insert(
                "", "end", iid=str(s["id"]),
                values=(s["matric_no"], s["fullname"]),
            )

    def _refresh_recent_student_list(self):
        self.recent_tree.delete(*self.recent_tree.get_children())
        recents = self.db.get_recent_students(student_type=self._active_recent_tab, limit=15)
        if not recents:
            self.recent_tree.insert(
                "", "end", iid="rec_empty",
                values=("", "There are no recently added record(s)", "", ""),
            )
            return

        for s in recents:
            date_str = s["created_at"] or ""
            if " " in date_str:
                date_str = date_str.split(" ")[0]
            self.recent_tree.insert(
                "", "end", iid=f"rec_{s['id']}",
                values=(s["matric_no"], s["fullname"], s["batch"] or "U2024", date_str),
            )

    # ------------------------------------------------------------------
    # Selection Handlers & Quick Overview
    # ------------------------------------------------------------------
    def _on_student_select(self, _event=None):
        sel = self.main_tree.selection()
        if not sel or sel[0] == "empty_placeholder":
            return
        self._selected_student_id = int(sel[0])
        self._update_overview_panel(self._selected_student_id)

    def _on_recent_select(self, _event=None):
        sel = self.recent_tree.selection()
        if not sel or sel[0] == "rec_empty":
            return
        student_id = int(sel[0].replace("rec_", ""))
        self._selected_student_id = student_id
        self._update_overview_panel(student_id)

    def _update_overview_panel(self, student_id):
        # 1. Yearly Breakdown & CGPA based on official 123-unit rules
        self.overview_tree.delete(*self.overview_tree.get_children())
        t_data = transcript_generator.get_transcript_data(student_id, self.db)
        if t_data and t_data.get("years"):
            for y in t_data["years"]:
                self.overview_tree.insert(
                    "", "end",
                    values=(y["year_display"].upper(), f"{y['tqp']:.1f}", y["tcu"]),
                )
            cgpa_str = t_data.get("final_cgpa", "0.00")
            deg_class = t_data.get("degree_class", "N/A")
            try:
                cgpa_val = float(cgpa_str)
            except (ValueError, TypeError):
                cgpa_val = 0.0
            self.lbl_cgpa.config(text=f"CGPA : {cgpa_str}" if cgpa_val > 0 else "CGPA : -")
            self.lbl_class.config(text=f"CLASS : {deg_class}")
        else:
            self.lbl_cgpa.config(text="CGPA : -")
            self.lbl_class.config(text="CLASS : N/A")

        # 2. Outstanding courses
        self.outstanding_box.delete(0, "end")
        outstanding = self.db.get_outstanding_courses(student_id)
        self._outstanding_data = outstanding
        if not outstanding:
            self.outstanding_box.insert("end", " None (Clear Record)")
        else:
            for item in outstanding:
                self.outstanding_box.insert(
                    "end", f" • {item['course_code']} ({item['grade']}) - Score: {item['score']}"
                )

    def _clear_overview_panel(self):
        self.overview_tree.delete(*self.overview_tree.get_children())
        self.lbl_cgpa.config(text="CGPA : ")
        self.lbl_class.config(text="CLASS : ")
        self.outstanding_box.delete(0, "end")
        self._outstanding_data = []

    def _show_out_context(self, event):
        if not self._outstanding_data:
            return
        idx = self.outstanding_box.nearest(event.y)
        if 0 <= idx < len(self._outstanding_data):
            self.outstanding_box.selection_clear(0, "end")
            self.outstanding_box.selection_set(idx)
            self.outstanding_box.activate(idx)
            self.out_context_menu.tk_popup(event.x_root, event.y_root)

    def _on_outstanding_double_click(self, _event=None):
        self._waive_selected_outstanding()

    def _waive_selected_outstanding(self):
        if not self._selected_student_id or not self._outstanding_data:
            return
        sel = self.outstanding_box.curselection()
        if not sel:
            messagebox.showinfo("Select Course", "Please select an outstanding course to waive.")
            return
        idx = sel[0]
        if idx >= len(self._outstanding_data):
            return
        item = self._outstanding_data[idx]
        student = self.db.get_student_by_id(self._selected_student_id)
        if not student:
            return

        # Fetch course_id if not present in item
        res_row = self.db.conn.execute("SELECT course_id FROM results WHERE id=?", (item["result_id"],)).fetchone()
        course_id = res_row["course_id"] if res_row else None
        if not course_id:
            messagebox.showerror("Error", "Could not locate course record.")
            return

        # Validate waiver restrictions (GES, FMS/Project, Internship, max 2 waivers)
        allowed, reason = self.db.can_waive_course(self._selected_student_id, course_id, result_id=item["result_id"])
        if not allowed:
            messagebox.showwarning("Waiver Restriction", reason)
            return

        msg = (
            f"Are you sure you want to WAIVE this course for {student['fullname']}?\n\n"
            f"Course: {item['course_code']} — {item['course_title']} ({item['credit_units']} CU)\n"
            f"Failed Score: {item['score']} (Grade {item['grade']})\n\n"
            "Academic Waiver Policy:\n"
            "• Award passing Grade 'E' (40% / 1.0 Point).\n"
            "• Grade points will be factored into semester GPA and cumulative CGPA.\n"
            "• Course will be cleared from outstanding carryovers.\n"
            "• Course will appear under 'WAIVED COURSES' on Page 1 of the official transcript.\n\n"
            "Proceed with granting course waiver?"
        )
        if messagebox.askyesno("Confirm Course Waiver", msg):
            try:
                self.db.waive_result(item["result_id"], waiver_grade="E", score=40.0)
                self._update_overview_panel(self._selected_student_id)
                messagebox.showinfo(
                    "Course Waived",
                    f"Course {item['course_code']} has been successfully waived with Grade 'E' (1.0 Point)!\n"
                    "GPA and CGPA have been recalculated.",
                )
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def _on_student_double_click(self, _event=None):
        if self._selected_student_id:
            self._open_results()

    # ------------------------------------------------------------------
    # Action Handlers
    # ------------------------------------------------------------------
    def _add_student(self):
        StudentDialog(
            self,
            self.db,
            on_saved=self._refresh_all_views,
            default_type=self._active_main_tab,
        )

    def _edit_student(self):
        if not self._selected_student_id:
            messagebox.showinfo("No Selection", "Please select a student from the list to edit.")
            return
        student = self.db.get_student_by_id(self._selected_student_id)
        if student:
            StudentDialog(self, self.db, student=student, on_saved=self._refresh_all_views)

    def _delete_student(self):
        if not self._selected_student_id:
            messagebox.showinfo("No Selection", "Please select a student to delete.")
            return
        student = self.db.get_student_by_id(self._selected_student_id)
        if not student:
            return
        if messagebox.askyesno(
            "Delete Student Record",
            f"Are you sure you want to delete student:\n\n{student['fullname']} ({student['matric_no']})?\n\n"
            "This will permanently delete all associated results.",
        ):
            self.db.delete_student(self._selected_student_id)
            self._selected_student_id = None
            self._refresh_all_views()

    def _open_results(self):
        if not self._selected_student_id:
            messagebox.showinfo("Select Student", "Please select a student to view their results worksheet.")
            return
        WorksheetDialog(
            self,
            self.db,
            self._selected_student_id,
            on_updated=lambda: self._update_overview_panel(self._selected_student_id),
        )

    def _add_result(self):
        if not self._selected_student_id:
            messagebox.showinfo("Select Student", "Please select a student to record a score.")
            return
        if not self.db.get_all_courses():
            messagebox.showinfo("No Courses", "Please add courses into the course catalogue first (Courses button).")
            return
        ResultDialog(
            self,
            self.db,
            self._selected_student_id,
            on_saved=lambda: self._update_overview_panel(self._selected_student_id),
        )

    def _open_transcript(self):
        if not self._selected_student_id:
            messagebox.showinfo("Select Student", "Please select a student to view their official academic transcript.")
            return
        TranscriptDialog(self, self.db, self._selected_student_id)

    def _open_courses(self):
        CourseManagerDialog(self, self.db)

    def _show_grading_info(self):
        info = (
            "Standard 5-Point Nigerian University Grading Scheme:\n\n"
            "• 70 – 100% : A (5.0 Points) - Excellent\n"
            "• 60 – 69%   : B (4.0 Points) - Very Good\n"
            "• 50 – 59%   : C (3.0 Points) - Good\n"
            "• 45 – 49%   : D (2.0 Points) - Fair\n"
            "• 40 – 44%   : E (1.0 Points) - Pass\n"
            "•  0 – 39%   : F (0.0 Points) - Fail\n\n"
            "Carryover / Repeat Courses:\n"
            "• When a course is repeated/retaken, passing grades A, B, and C are credited at 3.0 Grade Points (C grade equivalent) in GPA/CGPA calculations, while D (2.0), E (1.0), and F (0.0) remain normal.\n\n"
            "Course Waiver Policy:\n"
            "• Waived courses are awarded Grade 'E' (1.0 Point, 40%) and calculated in GPA & CGPA.\n\n"
            "Degree Classification:\n"
            "• 4.50 – 5.00 : First Class Honours\n"
            "• 3.50 – 4.49 : Second Class Upper (2:1)\n"
            "• 2.40 – 3.49 : Second Class Lower (2:2)\n"
            "• 1.50 – 2.39 : Third Class\n"
            "• 1.00 – 1.49 : Pass\n"
        )
        messagebox.showinfo("CDRMS Grading Scale", info)


if __name__ == "__main__":
    app = CdrmsApp()
    app.mainloop()

