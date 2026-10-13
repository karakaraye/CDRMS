"""
transcript_generator.py
-----------------------
Generates official multi-page Academic Transcript / Student Spreadsheet PDFs
and structured data for the University of Port Harcourt Department of Management,
matching the exact reference template:
  - Header with Uniport Logo & Department Titles
  - 2-Column Student Biodata Box
  - Semester-by-Semester Tables (Course Code, Title, CU, Mark, Grade, GP, QP)
  - Year Summary (TCU, TQP, GPA, Cumulative CGPA, Waived Courses on Page 1 only)
  - Final Cumulative Summary on Last Page (Total TCU, Total TQP, Final CGPA, Class of Degree)
  - 123 Credit Units Rule (All Compulsory + Best Scoring Required Courses)
  - Course Annotations (* for excess required with slashed CU/QP, ** for failed, W for waived)
  - Dynamic Footnotes (rendered only on pages where required)
  - HOD Signature Block
  - Each academic year formatted on its own separate page
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

from database import score_to_grade, get_degree_class

# Locate assets
if getattr(sys, "frozen", False):
    APP_DIR = Path(sys.executable).resolve().parent
else:
    APP_DIR = Path(__file__).resolve().parent


def get_logo_path():
    candidate_names = [
        "uniport.jpeg", "uniport.jpg", "uniport_logo.jpg", "uniport_logo.jpeg",
        "unoport.jpeg", "unoport.jpg", "unoport.png", "uniport.png",
        "uniport_logo.png", "logo.jpg", "logo.jpeg", "logo.png"
    ]
    candidate_dirs = [
        APP_DIR,
        Path(__file__).resolve().parent if '__file__' in globals() else APP_DIR,
    ]
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        candidate_dirs.insert(0, Path(sys._MEIPASS))

    for d in candidate_dirs:
        for name in candidate_names:
            p = d / name
            if p.exists():
                return str(p)
    return None


LOGO_PATH = get_logo_path()


def select_best_required_courses(req_courses, target_cu=38):
    """
    Selects the optimal subset of passed/waived Required courses that maximizes
    total Quality Points (QP) and sums up to target_cu (default 38 CU).
    req_courses: list of dicts with keys: 'id', 'cu', 'qp', 'gp', 'score'
    Returns set of selected result ids.
    """
    if not req_courses or target_cu <= 0:
        return set()

    total_cu = sum(c['cu'] for c in req_courses)
    if total_cu <= target_cu:
        return set(c['id'] for c in req_courses)

    # 0/1 Knapsack DP to maximize total QP with exact weight <= target_cu
    # dp[w] = (max_qp, score_sum, [course_ids])
    dp = {0: (0.0, 0.0, [])}
    for c in req_courses:
        w = c['cu']
        val = c['qp']
        score = c['score']
        cid = c['id']
        new_dp = dict(dp)
        for cur_w, (cur_qp, cur_score, cur_ids) in dp.items():
            if cur_w + w <= target_cu:
                nxt_w = cur_w + w
                nxt_qp = round(cur_qp + val, 2)
                nxt_score = cur_score + score
                nxt_ids = cur_ids + [cid]
                if nxt_w not in new_dp or (nxt_qp, nxt_score) > (new_dp[nxt_w][0], new_dp[nxt_w][1]):
                    new_dp[nxt_w] = (nxt_qp, nxt_score, nxt_ids)
        dp = new_dp

    best_w = max(dp.keys())
    return set(dp[best_w][2])


def get_transcript_data(student_id, db):
    """
    Extracts and organizes a student's full academic record structured by
    Year (100L -> Year One, 200L -> Year Two, etc.) and Semester.
    
    Implements Official Academic Regulations:
      i.   Minimum Graduation Requirement: Total accumulated credit units >= 123.
      ii.  Compulsory 94 Credit Units: Mandatory core categories:
             - CCMAS core courses
             - GES General Studies
             - Entrepreneurship Project (MGT 400)
             - Research Project (MGT 498)
      iii. Remaining 29 Credit Units: Automatically selected from student's
           highest-performing eligible results (highest grades/QP) to reach 123 CU.
      iv.  Minimum Credit Units Per Semester: >= 15 CU per semester (>= 10 for Part-Time terms).
      v.   Minimum Credit Units Per Session: >= 30 CU per session.
      
      - Other excess courses above 123 have '*' beside title and slashed CU/QP.
      - Failed courses have '**' beside title.
      - Waived courses have 'W' beside title and appear on Page 1 summary.
    """
    student = db.get_student_by_id(student_id)
    if not student:
        return None
    student = dict(student)

    # Fetch all results with course information
    query = """
        SELECT r.*, c.course_code, c.course_title, c.credit_units,
               COALESCE(r.level, c.level) as c_level, c.semester as c_semester, c.status as c_status
        FROM results r JOIN courses c ON r.course_id = c.id
        WHERE r.student_id=?
        ORDER BY r.session, COALESCE(r.level, c.level), r.semester, c.course_code
    """
    all_results = db.conn.execute(query, (student_id,)).fetchall()

    # Determine all waived courses across degree for student
    all_waived_results = [r for r in all_results if (r["is_waived"] == 1 if "is_waived" in r.keys() else False)]
    all_waived_str = ", ".join([f"{r['course_code']} ({r['grade']})" for r in all_waived_results]) if all_waived_results else "NIL"

    # Separate Compulsory and Required courses for 123-unit computation
    compulsory_cu_passed = 0
    candidate_required = []

    for r in all_results:
        status = r["c_status"] or "Compulsory"
        cu = r["credit_units"] or 0
        grade = r["grade"] or "F"
        is_waived = r["is_waived"] == 1 if "is_waived" in r.keys() else False
        gp = r["grade_point"] if r["grade_point"] is not None else 0.0
        score = r["score"] if r["score"] is not None else 0.0

        if status == "Compulsory":
            if grade != "F" or is_waived:
                compulsory_cu_passed += cu
        else:
            if grade != "F" or is_waived:
                candidate_required.append({
                    "id": r["id"],
                    "code": r["course_code"],
                    "title": r["course_title"],
                    "cu": cu,
                    "score": score,
                    "grade": grade,
                    "gp": gp,
                    "qp": round(cu * gp, 1),
                })

    # Target required units: 123 total - compulsory units (default 38 if 85 compulsory)
    target_req_cu = max(0, 123 - compulsory_cu_passed)
    selected_req_ids = select_best_required_courses(candidate_required, target_req_cu)

    # Standard levels are 100, 200, 300, 400.
    # If student has recorded results in 500 (Extra Year I) or 600 (Extra Year II), include them.
    recorded_levels = {str(r["c_level"]) for r in all_results if r["c_level"]}
    level_order = ["100", "200", "300", "400"]
    if "500" in recorded_levels or "600" in recorded_levels:
        level_order.append("500")
    if "600" in recorded_levels:
        level_order.append("600")

    level_names = {
        "100": ("Year One", "YEAR ONE"),
        "200": ("Year Two", "YEAR TWO"),
        "300": ("Year Three", "YEAR THREE"),
        "400": ("Year Four", "YEAR FOUR"),
        "500": ("Year Five", "YEAR FIVE (EXTRA YEAR I)"),
        "600": ("Year Six", "YEAR SIX (EXTRA YEAR II)"),
    }

    years_data = []
    cumulative_cu = 0
    cumulative_qp = 0.0

    # Group by level (Year)
    for lvl_idx, lvl in enumerate(level_order):
        year_display, year_caps = level_names.get(lvl, (f"Year {lvl}", f"YEAR {lvl}"))
        
        # Results belonging to this level
        lvl_results = [r for r in all_results if str(r["c_level"]) == lvl]

        # Determine academic session for this year
        session = ""
        for r in lvl_results:
            if r["session"]:
                session = r["session"]
                break
        if not session:
            entry_yr = student["entry_year"] or "2022"
            try:
                yr_int = int(entry_yr) + (int(lvl) // 100 - 1)
                session = f"{yr_int}/{yr_int + 1}"
            except Exception:
                session = "2024/2025"

        # Check student type
        student_type = student.get("student_type", "Full-Time")
        is_part_time = (student_type == "Part-Time")
        sem_list = ["First", "Second", "Third"] if is_part_time else ["First", "Second"]

        # Organize into semesters
        semesters_data = []
        year_cu = 0
        year_qp = 0.0

        page_has_star = False
        page_has_double_star = False
        page_has_waiver = False

        for sem in sem_list:
            if is_part_time:
                sem_name = "1st Term" if sem == "First" else ("2nd Term" if sem == "Second" else "3rd Term")
            else:
                sem_name = "1st Semester" if sem == "First" else "2nd Semester"

            sem_results = [r for r in lvl_results if (r["semester"] or r["c_semester"]) == sem]

            courses_list = []
            sem_cu = 0
            sem_qp = 0.0

            for r in sem_results:
                cu = r["credit_units"] or 0
                score = r["score"] if r["score"] is not None else 0.0
                grade = r["grade"] or "F"
                gp = r["grade_point"] if r["grade_point"] is not None else 0.0
                raw_qp = round(cu * gp, 1)
                status = r["c_status"] or "Compulsory"
                is_waived = r["is_waived"] == 1 if "is_waived" in r.keys() else False

                is_used_in_computation = True
                is_failed = (grade == "F" and not is_waived)
                is_excess_required = False

                if status != "Compulsory" and not is_failed:
                    if r["id"] not in selected_req_ids:
                        is_excess_required = True
                        is_used_in_computation = False

                # Build annotations
                ann_list = []
                if is_excess_required:
                    ann_list.append("*")
                    page_has_star = True
                if is_failed:
                    ann_list.append("**")
                    page_has_double_star = True
                if is_waived:
                    ann_list.append("W")
                    page_has_waiver = True

                ann_suffix = f" {' '.join(ann_list)}" if ann_list else ""
                title_display = f"{r['course_title']}{ann_suffix}"

                # Strikethrough CU and QP for excess courses
                if is_excess_required:
                    cu_display = f"<s>{cu}</s>"
                    qp_val_str = str(int(raw_qp) if raw_qp == int(raw_qp) else round(raw_qp, 1))
                    qp_display = f"<s>{qp_val_str}</s>"
                    cu_display_unicode = "".join(ch + "\u0336" for ch in str(cu))
                    qp_display_unicode = "".join(ch + "\u0336" for ch in qp_val_str)
                    computed_cu = 0
                    computed_qp = 0.0
                elif is_failed:
                    cu_display = str(cu)
                    qp_display = "0"
                    cu_display_unicode = str(cu)
                    qp_display_unicode = "0"
                    computed_cu = 0
                    computed_qp = 0.0
                else:
                    cu_display = str(cu)
                    qp_val_str = str(int(raw_qp) if raw_qp == int(raw_qp) else round(raw_qp, 1))
                    qp_display = qp_val_str
                    cu_display_unicode = str(cu)
                    qp_display_unicode = qp_val_str
                    computed_cu = cu
                    computed_qp = raw_qp

                sem_cu += computed_cu
                sem_qp += computed_qp

                courses_list.append({
                    "code": r["course_code"],
                    "title": r["course_title"],
                    "title_display": title_display,
                    "cu": cu,
                    "cu_display": cu_display,
                    "cu_display_unicode": cu_display_unicode,
                    "mark": int(score) if score == int(score) else round(score, 1),
                    "grade": grade,
                    "gp": int(gp) if gp == int(gp) else round(gp, 1),
                    "qp": int(raw_qp) if raw_qp == int(raw_qp) else round(raw_qp, 1),
                    "qp_display": qp_display,
                    "qp_display_unicode": qp_display_unicode,
                    "is_used": is_used_in_computation,
                    "is_waived": is_waived,
                    "is_failed": is_failed,
                    "is_excess": is_excess_required,
                })

            year_cu += sem_cu
            year_qp += sem_qp

            semesters_data.append({
                "sem_key": sem,
                "sem_title": f"{year_display} {sem_name}",
                "session": session,
                "courses": courses_list,
                "total_cu": sem_cu,
                "total_qp": int(sem_qp) if sem_qp == int(sem_qp) else round(sem_qp, 1),
            })

        # Year GPA and Cumulative CGPA
        year_gpa = round(year_qp / year_cu, 2) if year_cu > 0 else 0.00
        cumulative_cu += year_cu
        cumulative_qp += year_qp
        cum_cgpa = round(cumulative_qp / cumulative_cu, 2) if cumulative_cu > 0 else 0.00

        # Page footnotes (only include footnotes that are present on this page)
        page_footnotes = []
        if page_has_star:
            page_footnotes.append("* - Course not used for computation due to excess CU.")
        if page_has_double_star:
            page_footnotes.append("** - Failed course CU not used for computation.")
        if page_has_waiver:
            page_footnotes.append("W - Waived course.")

        years_data.append({
            "level": lvl,
            "year_index": lvl_idx,
            "year_display": year_display,
            "year_caps": year_caps,
            "session": session,
            "semesters": semesters_data,
            "tcu": year_cu,
            "tqp": int(year_qp) if year_qp == int(year_qp) else round(year_qp, 1),
            "gpa": f"{year_gpa:.2f}",
            "cgpa": f"{cum_cgpa:.2f}",
            "cumulative_cu": cumulative_cu,
            "cumulative_qp": int(cumulative_qp) if cumulative_qp == int(cumulative_qp) else round(cumulative_qp, 1),
            "has_records": len(lvl_results) > 0,
            "show_waived_courses": (lvl_idx == 0),  # Waived courses shown only on Page 1
            "waived_courses": all_waived_str,
            "is_last_page": (lvl_idx == len(level_order) - 1),
            "footnotes": page_footnotes,
        })

    final_cgpa = round(cumulative_qp / cumulative_cu, 2) if cumulative_cu > 0 else 0.00

    return {
        "student": dict(student),
        "years": years_data,
        "total_cumulative_cu": cumulative_cu,
        "total_cumulative_qp": cumulative_qp,
        "final_cgpa": f"{final_cgpa:.2f}",
        "degree_class": get_degree_class(final_cgpa),
        "waived_courses_all": all_waived_str,
    }


def generate_transcript_pdf(student_id, db, output_path=None, hod_name="Dr. W. Sylva"):
    """
    Generates the official multi-page PDF transcript matching the Uniport spreadsheet template.
    Each academic year (Year One, Year Two, Year Three, Year Four) is on a separate page.
    """
    data = get_transcript_data(student_id, db)
    if not data:
        raise ValueError(f"Student ID {student_id} not found.")

    student = data["student"]
    matric_no_clean = student["matric_no"].replace("/", "_").replace("\\", "_")

    if not output_path:
        output_path = APP_DIR / f"Transcript_{matric_no_clean}.pdf"

    # Document setup: A4 with tight margins matching template layout
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=26,
        rightMargin=26,
        topMargin=22,
        bottomMargin=20,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "UniTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.black,
    )
    subtitle_style = ParagraphStyle(
        "UniSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=11.5,
        alignment=TA_CENTER,
        textColor=colors.black,
    )
    sheet_badge_style = ParagraphStyle(
        "SheetBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
        textColor=colors.black,
    )

    info_label_style = ParagraphStyle(
        "InfoLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
    )
    info_val_style = ParagraphStyle(
        "InfoVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
    )

    tbl_head_style = ParagraphStyle(
        "TblHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
    )
    cell_left_style = ParagraphStyle(
        "CellLeft",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9,
        alignment=TA_LEFT,
    )
    cell_center_style = ParagraphStyle(
        "CellCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
    )

    story = []

    # Student full name formatted as SURNAME, Firstname Other
    surname = (student.get("surname") or "").strip().upper()
    firstname = (student.get("firstname") or "").strip()
    other = (student.get("other_name") or "").strip()
    if surname and firstname:
        formatted_name = f"{surname}, {firstname}" + (f" {other}" if other else "")
    else:
        formatted_name = student.get("fullname", "")

    # Iterate each year to generate a separate page per year
    for yr_idx, year_info in enumerate(data["years"]):
        # 1. Header with Logo on left and University Titles centered
        logo_elem = ""
        current_logo = get_logo_path()
        if current_logo and os.path.exists(current_logo):
            logo_elem = Image(current_logo, width=46, height=46)

        logo_cell = [
            logo_elem,
            Spacer(1, 2),
            Paragraph("<b>Students Spreadsheet</b>", sheet_badge_style),
        ]

        title_cell = [
            Paragraph("UNIVERSITY OF PORT HARCOURT", title_style),
            Spacer(1, 2),
            Paragraph("FACULTY OF MANAGEMENT SCIENCES", subtitle_style),
            Spacer(1, 1),
            Paragraph("DEPARTMENT OF MANAGEMENT", subtitle_style),
        ]

        header_table = Table(
            [[logo_cell, title_cell]],
            colWidths=[110, 430],
        )
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 6))

        # 2. Student Biodata Box (2-column bordered table)
        state_origin = student.get("state_of_origin") or ""
        dob = student.get("dob") or ""
        sex = student.get("sex") or ""
        marital = student.get("marital_status") or ""

        info_data = [
            [
                Paragraph(f"<b>Name :</b> {formatted_name}", info_val_style),
                Paragraph(f"<b>Mat No:</b> {student['matric_no']}", info_val_style),
            ],
            [
                Paragraph(f"<b>State of Origin:</b> {state_origin}", info_val_style),
                Paragraph(f"<b>Date of Birth:</b> {dob} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Sex:</b> {sex}", info_val_style),
            ],
            [
                Paragraph("", info_val_style),
                Paragraph(f"<b>Marital Status:</b> {marital}", info_val_style),
            ]
        ]
        info_table = Table(info_data, colWidths=[270, 270])
        info_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.8, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 6))

        # 3. Semester Tables for this Year
        for sem_data in year_info["semesters"]:
            # Semester Title Banner Row
            sem_title_tbl = Table(
                [[
                    Paragraph(f"<b>{sem_data['sem_title']}</b>", info_label_style),
                    Paragraph(f"<b>{sem_data['session']}</b>", ParagraphStyle("RAlign", parent=info_label_style, alignment=TA_RIGHT)),
                ]],
                colWidths=[360, 180]
            )
            sem_title_tbl.setStyle(TableStyle([
                ('TOPPADDING', (0, 0), (-1, -1), 1),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
                ('LEFTPADDING', (0, 0), (-1, -1), 2),
                ('RIGHTPADDING', (0, 0), (-1, -1), 2),
            ]))
            story.append(sem_title_tbl)

            # Table Header
            tbl_rows = [[
                Paragraph("<b>Course Code</b>", tbl_head_style),
                Paragraph("<b>Course Title</b>", tbl_head_style),
                Paragraph("<b>CU</b>", tbl_head_style),
                Paragraph("<b>Mark</b>", tbl_head_style),
                Paragraph("<b>Grade</b>", tbl_head_style),
                Paragraph("<b>GP</b>", tbl_head_style),
                Paragraph("<b>QP</b>", tbl_head_style),
            ]]

            # Course Rows
            for c in sem_data["courses"]:
                tbl_rows.append([
                    Paragraph(c["code"], cell_left_style),
                    Paragraph(c["title_display"], cell_left_style),
                    Paragraph(c["cu_display"], cell_center_style),
                    Paragraph(str(c["mark"]), cell_center_style),
                    Paragraph(str(c["grade"]), cell_center_style),
                    Paragraph(str(c["gp"]), cell_center_style),
                    Paragraph(c["qp_display"], cell_center_style),
                ])

            # If no courses recorded yet, add placeholder empty row
            if not sem_data["courses"]:
                tbl_rows.append([
                    Paragraph("-", cell_center_style),
                    Paragraph("No registered courses", cell_left_style),
                    Paragraph("-", cell_center_style),
                    Paragraph("-", cell_center_style),
                    Paragraph("-", cell_center_style),
                    Paragraph("-", cell_center_style),
                    Paragraph("-", cell_center_style),
                ])

            # Total Row
            tbl_rows.append([
                Paragraph("<b>Total</b>", cell_left_style),
                Paragraph("", cell_left_style),
                Paragraph(f"<b>{sem_data['total_cu']}</b>", cell_center_style),
                Paragraph("", cell_center_style),
                Paragraph("", cell_center_style),
                Paragraph("", cell_center_style),
                Paragraph(f"<b>{sem_data['total_qp']}</b>", cell_center_style),
            ])

            # Column widths: total = 540 pt
            c_widths = [75, 265, 40, 40, 40, 40, 40]
            courses_tbl = Table(tbl_rows, colWidths=c_widths)
            courses_tbl.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('LEFTPADDING', (0, 0), (-1, -1), 3),
                ('RIGHTPADDING', (0, 0), (-1, -1), 3),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#fafafa")),
            ]))
            story.append(courses_tbl)
            story.append(Spacer(1, 4))

        # 4. Summary Stats Box (TQP, TCU, GPA, CGPA, Waived Courses on Page 1, Final stats on Last Page)
        tcu_val = year_info["tcu"]
        tqp_val = year_info["tqp"]
        gpa_val = year_info["gpa"]
        cgpa_val = year_info["cgpa"]

        summary_style = ParagraphStyle(
            "SummaryStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=colors.black,
        )

        if year_info.get("is_last_page"):
            tot_cu = data["total_cumulative_cu"]
            tot_qp = int(data["total_cumulative_qp"]) if data["total_cumulative_qp"] == int(data["total_cumulative_qp"]) else round(data["total_cumulative_qp"], 1)
            fin_cgpa = data["final_cgpa"]
            deg_class = str(data["degree_class"])
            deg_class_pdf = deg_class.replace("2¹", "2<sup>1</sup>").replace("2²", "2<sup>2</sup>").replace("2^1", "2<sup>1</sup>").replace("2^2", "2<sup>2</sup>")

            summary_data = [
                [
                    Paragraph(f"<b>TQP :</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>{tqp_val}</b>", summary_style),
                    Paragraph(f"<b>TCU :</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>{tcu_val}</b>", summary_style),
                    Paragraph(f"<b>GPA :</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>{gpa_val}</b>", summary_style),
                    Paragraph("", summary_style),
                ],
                [
                    Paragraph(f"<b>FINAL TQP :</b> &nbsp; <b>{tot_qp}</b>", summary_style),
                    Paragraph(f"<b>FINAL TCU :</b> &nbsp; <b>{tot_cu}</b>", summary_style),
                    Paragraph(f"<b>CGPA : {fin_cgpa}</b>", summary_style),
                    Paragraph(f"<b>CLASS : {deg_class_pdf}</b>", summary_style),
                ]
            ]
            summary_table_styles = [
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]
            summary_table = Table(summary_data, colWidths=[140, 130, 140, 130])
            summary_table.setStyle(TableStyle(summary_table_styles))
        else:
            waived_text = f"<font size=7.5><b>WAIVED COURSES : {year_info.get('waived_courses', 'NIL')}</b></font>" if year_info.get("show_waived_courses") else ""
            summary_data = [
                [
                    Paragraph(waived_text, summary_style),
                    Paragraph(f"<b>TCU = {tcu_val}</b>", summary_style),
                    Paragraph(f"<b>GPA = {gpa_val}</b>", summary_style),
                ],
                [
                    Paragraph("", summary_style),
                    Paragraph(f"<b>TQP = {tqp_val}</b>", summary_style),
                    Paragraph(f"<b>CGPA = {cgpa_val}</b>", summary_style),
                ]
            ]
            summary_table_styles = [
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]
            summary_table = Table(summary_data, colWidths=[280, 130, 130])
            summary_table.setStyle(TableStyle(summary_table_styles))

        story.append(summary_table)
        story.append(Spacer(1, 8))

        # 5. Signature Block
        sig_data = [
            [
                Paragraph("<b>Signed:</b><br/><b>Head of</b><br/><b>Department</b>", ParagraphStyle("SigHead", parent=info_val_style, fontSize=8, leading=9.5)),
                Paragraph(f"<br/><br/>{hod_name}", ParagraphStyle("SigName", parent=info_val_style, fontSize=8, leading=9.5)),
            ]
        ]
        sig_table = Table(sig_data, colWidths=[85, 455])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
            ('LINEBELOW', (1, 0), (1, 0), 0.8, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (1, 0), (1, 0), 8),
            ('RIGHTPADDING', (1, 0), (1, 0), 10),
        ]))
        story.append(sig_table)
        story.append(Spacer(1, 6))

        # 6. Dynamic Footnotes (only rendered when required on this page)
        footnotes = year_info.get("footnotes", [])
        if footnotes:
            footnote_style = ParagraphStyle(
                "Footnote",
                parent=styles["Normal"],
                fontName="Helvetica",
                fontSize=6.5,
                leading=8,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#333333"),
            )
            for fn_text in footnotes:
                story.append(Paragraph(fn_text, footnote_style))

        # Separate each year on a new page (unless it's the last year)
        if yr_idx < len(data["years"]) - 1:
            story.append(PageBreak())

    # Build PDF
    doc.build(story)
    return str(output_path)
