import React, { useRef } from "react";
import { X, Printer, Download, Award, GraduationCap, CheckCircle } from "lucide-react";
import { scoreToGrade, getDegreeClass, selectBestRequiredCourses } from "../services/grading";
import { getSessionForLevel } from "../services/session";

export default function TranscriptModal({
  isOpen,
  onClose,
  student,
  courses,
  results,
}) {
  const printRef = useRef(null);

  if (!isOpen || !student) return null;

  const studentResults = results.filter((r) => {
    if (!student) return false;
    const matchId = String(r.student_id) === String(student.id);
    const matchMatric = Boolean(
      student.matric_no && (
        (r.matric_no && String(r.matric_no).trim().toLowerCase() === String(student.matric_no).trim().toLowerCase()) ||
        String(r.student_id).trim().toLowerCase() === String(student.matric_no).trim().toLowerCase()
      )
    );
    const matchName = Boolean(
      student.fullname && r.student_name &&
      r.student_name.trim().toLowerCase() === student.fullname.trim().toLowerCase()
    );
    const matchNameParts = Boolean(
      student.surname && student.firstname && r.student_name &&
      r.student_name.toLowerCase().includes(student.surname.toLowerCase()) &&
      r.student_name.toLowerCase().includes(student.firstname.toLowerCase())
    );
    return matchId || matchMatric || matchName || matchNameParts;
  });

  // Map courses with multi-key indexing
  const courseMap = new Map();
  courses.forEach((c) => {
    if (c.id !== undefined && c.id !== null) {
      courseMap.set(String(c.id), c);
      courseMap.set(Number(c.id), c);
    }
    if (c.course_code) {
      courseMap.set(c.course_code.trim().toUpperCase(), c);
      courseMap.set(c.course_code.replace(/\s+/g, "").toUpperCase(), c);
    }
  });

  // Group by Level (Year) and Semester
  const levels = ["100", "200", "300", "400", "500", "600"];
  const semesterOrder = ["First", "Second", "Third"];

  const structuredData = {};
  levels.forEach((lvl) => {
    structuredData[lvl] = {
      First: [],
      Second: [],
      Third: [],
      totalCU: 0,
      totalQP: 0,
    };
  });

  // Collect required courses for 123-credit calculation and waived courses
  const passedRequiredCourses = [];
  const waivedCoursesList = [];

  studentResults.forEach((r) => {
    const course =
      courseMap.get(String(r.course_id)) ||
      courseMap.get(Number(r.course_id)) ||
      (r.course_code ? courseMap.get(r.course_code.trim().toUpperCase()) : null) ||
      (r.course_code ? courseMap.get(r.course_code.replace(/\s+/g, "").toUpperCase()) : null) ||
      {};
    const lvl = r.level || course.level || "100";
    const sem = r.semester || course.semester || "First";
    const cu = Number(course.credit_units || r.credit_units || 2);
    const score = Number(r.score || 0);
    const isWaived = Boolean(r.is_waived);
    const isCarryover = Boolean(r.is_carryover);

    const grade = isWaived ? (r.waiver_grade || "W") : (r.grade || scoreToGrade(score, isCarryover).letter);
    const gp = isWaived ? 1.0 : (r.grade_point !== undefined ? Number(r.grade_point) : scoreToGrade(score, isCarryover).point);
    const qp = cu * gp;
    const isPassed = isWaived || (grade !== "F" && score >= 40);

    const item = {
      ...r,
      course_code: course.course_code || "N/A",
      course_title: course.course_title || "Unknown Course",
      credit_units: cu,
      status: course.status || "Compulsory",
      score,
      grade,
      gp,
      qp,
      isPassed,
    };

    if (isWaived && course.course_code) {
      waivedCoursesList.push(course.course_code);
    }

    if (course.status === "Required" && isPassed) {
      passedRequiredCourses.push(item);
    }

    if (structuredData[lvl] && structuredData[lvl][sem]) {
      structuredData[lvl][sem].push(item);
      structuredData[lvl].totalCU += cu;
      structuredData[lvl].totalQP += qp;
    }
  });

  // Calculate 123 CU rule (target 38 CU of required)
  const selectedRequiredIds = selectBestRequiredCourses(passedRequiredCourses, 38);

  // Overall totals
  let cumulativeCU = 0;
  let cumulativeQP = 0;

  levels.forEach((lvl) => {
    cumulativeCU += structuredData[lvl].totalCU;
    cumulativeQP += structuredData[lvl].totalQP;
  });

  const finalCGPA = cumulativeCU > 0 ? (cumulativeQP / cumulativeCU).toFixed(2) : "0.00";
  const finalDegreeClass = getDegreeClass(parseFloat(finalCGPA), false);
  const shortDegreeClass = getDegreeClass(parseFloat(finalCGPA), true);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-transcript-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div className="modal-title-group">
            <GraduationCap size={18} />
            <h3>Student Academic Spreadsheet — {student.fullname} {student.matric_no ? `(${student.matric_no})` : ""}</h3>
          </div>
          <div className="transcript-header-actions">
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} /> Print / Save Spreadsheet as PDF
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE SPREADSHEET DOCUMENT */}
        <div className="transcript-document printable-content" ref={printRef} style={{ position: "relative", overflow: "hidden" }}>
          {/* UNOFFICIAL WATERMARK */}
          <div className="spreadsheet-watermark">UNOFFICIAL</div>

          {/* UNIVERSITY HEADER */}
          <div className="transcript-official-header">
            <img
              src="/uniport.jpeg"
              alt="Uniport Crest"
              className="transcript-logo"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="transcript-header-text">
              <h2>UNIVERSITY OF PORT HARCOURT</h2>
              <h3>FACULTY OF MANAGEMENT SCIENCES</h3>
              <h4>{(student.department || "Department of Management").toUpperCase()}</h4>
              <div className="transcript-subheading">
                STUDENT ACADEMIC SPREADSHEET
              </div>
            </div>
          </div>

          {/* STUDENT BIODATA SECTION */}
          <div className="transcript-biodata-box">
            <div className="biodata-column">
              <div className="biodata-row">
                <span className="bio-label">NAME:</span>
                <span className="bio-value"><strong>{student.fullname}</strong></span>
              </div>
              <div className="biodata-row">
                <span className="bio-label">MATRIC NO:</span>
                <span className="bio-value"><strong>{student.matric_no || "Unassigned"}</strong></span>
              </div>
              <div className="biodata-row">
                <span className="bio-label">SEX / GENDER:</span>
                <span className="bio-value">{student.sex || "N/A"}</span>
              </div>
              <div className="biodata-row">
                <span className="bio-label">STATE OF ORIGIN:</span>
                <span className="bio-value">{student.state_of_origin || "N/A"} ({student.lga || "N/A"})</span>
              </div>
            </div>

            <div className="biodata-column">
              <div className="biodata-row">
                <span className="bio-label">PROGRAMME:</span>
                <span className="bio-value">
                  <strong>
                    B.Sc. {(student.department || "MANAGEMENT").replace(/^Department of\s+/i, "").toUpperCase()} ({student.student_type || "Full-Time"})
                  </strong>
                </span>
              </div>
              <div className="biodata-row">
                <span className="bio-label">BATCH / SET:</span>
                <span className="bio-value">{student.batch || "U2022"}</span>
              </div>
              <div className="biodata-row">
                <span className="bio-label">ENTRY YEAR / SESSION:</span>
                <span className="bio-value">
                  {student.entry_year || "2022"} • <strong>{getSessionForLevel(student, "100")} Session</strong>
                </span>
              </div>
              <div className="biodata-row">
                <span className="bio-label">FINAL CGPA / CLASS:</span>
                <span className="bio-value highlight-bio-class">
                  <strong>{finalCGPA}</strong> — {shortDegreeClass}
                </span>
              </div>
            </div>
          </div>

          {/* YEARLY BREAKDOWN TABLES */}
          {levels.map((lvl) => {
            const levelData = structuredData[lvl];
            const hasAnyCourses =
              levelData.First.length > 0 ||
              levelData.Second.length > 0 ||
              levelData.Third.length > 0;

            if (!hasAnyCourses) return null;

            const lvlGPA =
              levelData.totalCU > 0
                ? (levelData.totalQP / levelData.totalCU).toFixed(2)
                : "0.00";

            const computedLevelSession = getSessionForLevel(student, lvl);

            return (
              <div key={lvl} className="transcript-year-section">
                <div className="year-section-header">
                  <span>
                    {lvl === "500"
                      ? `500 LEVEL (EXTRA YEAR I) ACADEMIC SESSION — ${computedLevelSession}`
                      : lvl === "600"
                      ? `600 LEVEL (EXTRA YEAR II) ACADEMIC SESSION — ${computedLevelSession}`
                      : `${lvl} LEVEL ACADEMIC SESSION — ${computedLevelSession}`}
                  </span>
                  <span className="year-header-stats">
                    {lvl === "100" && (
                      <span style={{ marginRight: "16px", color: "#0858a8" }}>
                        WAIVED COURSES: <strong>{waivedCoursesList.length > 0 ? waivedCoursesList.join(", ") : "NIL"}</strong> |
                      </span>
                    )}
                    Total CU: {levelData.totalCU} | TQP: {levelData.totalQP.toFixed(1)} | Year GPA: {lvlGPA}
                  </span>
                </div>

                <div className="semesters-grid">
                  {semesterOrder.map((sem) => {
                    const coursesList = levelData[sem];
                    if (!coursesList || coursesList.length === 0) return null;

                    let semCU = 0;
                    let semQP = 0;
                    coursesList.forEach((c) => {
                      semCU += c.credit_units;
                      semQP += c.qp;
                    });
                    const semGPA = semCU > 0 ? (semQP / semCU).toFixed(2) : "0.00";

                    return (
                      <div key={sem} className="semester-table-wrapper">
                        <div className="semester-table-title">
                          {sem.toUpperCase()} {sem === "Third" ? "TERM" : "SEMESTER"}
                        </div>
                        <table className="transcript-table">
                          <thead>
                            <tr>
                              <th style={{ width: "85px" }}>Course</th>
                              <th>Course Title</th>
                              <th style={{ width: "35px", textAlign: "center" }}>CU</th>
                              <th style={{ width: "45px", textAlign: "center" }}>Score</th>
                              <th style={{ width: "40px", textAlign: "center" }}>Grade</th>
                              <th style={{ width: "35px", textAlign: "center" }}>GP</th>
                              <th style={{ width: "40px", textAlign: "center" }}>QP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {coursesList.map((item) => (
                              <tr key={item.id} className={!item.isPassed ? "row-failed" : ""}>
                                <td><strong>{item.course_code}</strong></td>
                                <td className="title-cell">{item.course_title}</td>
                                <td style={{ textAlign: "center" }}>{item.credit_units}</td>
                                <td style={{ textAlign: "center" }}>{item.score || "-"}</td>
                                <td style={{ textAlign: "center" }}>
                                  <span className={`grade-char ${item.grade === "F" ? "char-f" : ""}`}>
                                    {item.grade}
                                  </span>
                                </td>
                                <td style={{ textAlign: "center" }}>{item.gp.toFixed(1)}</td>
                                <td style={{ textAlign: "center" }}>{item.qp.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={2} style={{ textAlign: "right", fontWeight: "bold" }}>
                                Sub-Total:
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "bold" }}>{semCU}</td>
                              <td colSpan={3} style={{ textAlign: "right", fontWeight: "bold" }}>
                                Sem GPA: {semGPA}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "bold" }}>
                                {semQP.toFixed(1)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* FINAL CUMULATIVE SUMMARY & DEGREE CLASSIFICATION */}
          <div className="transcript-final-summary-box">
            <div className="final-summary-title">CUMULATIVE GRADUATION SUMMARY (123 CU BENCHMARK)</div>
            <div className="final-summary-grid">
              <div className="final-stat-item">
                <span className="final-stat-label">Total Credit Units (TCU)</span>
                <span className="final-stat-value">{cumulativeCU}</span>
              </div>
              <div className="final-stat-item">
                <span className="final-stat-label">Total Quality Points (TQP)</span>
                <span className="final-stat-value">{cumulativeQP.toFixed(1)}</span>
              </div>
              <div className="final-stat-item highlight-item">
                <span className="final-stat-label">Final Cumulative CGPA</span>
                <span className="final-stat-value">{finalCGPA} / 5.00</span>
              </div>
              <div className="final-stat-item highlight-item-class">
                <span className="final-stat-label">Class of Degree</span>
                <span className="final-stat-value">{finalDegreeClass}</span>
              </div>
            </div>
          </div>

          {/* FOOTNOTES BLOCK */}
          <div style={{ marginTop: "10px", fontSize: "10px", color: "#475569", fontStyle: "italic" }}>
            <strong>Footnotes:</strong> * - Excess required course (excluded from cumulative totals). W - Waived course. ** - Failed course.
          </div>

          {/* SIGNATURE BLOCK */}
          <div className="transcript-signatures-section" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "600px", margin: "25px auto 0 auto" }}>
            <div className="signature-box">
              <div className="signature-line" />
              <div className="signature-title">DR. / PROF. [NAME]</div>
              <div className="signature-role">Head of Department (HOD)</div>
            </div>
            <div className="signature-box">
              <div className="signature-line" />
              <div className="signature-title">DEPARTMENTAL OFFICER</div>
              <div className="signature-role">Department Examination Officer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
