import React from "react";
import {
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Edit2,
  User,
  GraduationCap,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { calculateStudentMetrics } from "../services/grading";
import { getSessionForLevel } from "../services/session";

export default function StudentOverview({
  student,
  results,
  courses,
  onOpenTranscript,
  onOpenWorksheet,
  onEditStudent,
}) {
  if (!student) {
    return (
      <aside className="student-overview empty-overview">
        <div className="overview-header">
          <GraduationCap size={16} />
          <span>QUICK OVERVIEW</span>
        </div>
        <div className="empty-overview-body">
          <User size={40} className="muted-icon" />
          <p>Select a student from the list to view academic summary, CGPA, and degree classification.</p>
        </div>
      </aside>
    );
  }

  const studentResults = results.filter(
    (r) =>
      String(r.student_id) === String(student.id) ||
      (student.matric_no && String(r.student_id) === String(student.matric_no)) ||
      (student.matric_no && r.matric_no && String(r.matric_no) === String(student.matric_no))
  );
  const metrics = calculateStudentMetrics(studentResults, courses);

  const degreeBadgeClass =
    metrics.degreeClass === "1st Class"
      ? "badge-first"
      : metrics.degreeClass === "2¹"
      ? "badge-second-upper"
      : metrics.degreeClass === "2²"
      ? "badge-second-lower"
      : metrics.degreeClass === "3rd Class"
      ? "badge-third"
      : "badge-pass";

  return (
    <aside className="student-overview">
      <div className="overview-header">
        <GraduationCap size={16} />
        <span>ACADEMIC OVERVIEW</span>
      </div>

      <div className="overview-body">
        {/* STUDENT BIO CARD */}
        <div className="overview-student-card">
          <div className="avatar-circle">
            {student.sex === "Female" ? "👩‍🎓" : "👨‍🎓"}
          </div>
          <div className="student-card-info">
            <h4 className="student-card-name">{student.fullname}</h4>
            <div className="student-card-matric">{student.matric_no}</div>
            <div className="student-card-meta">
              <span style={{ color: "#0284c7", fontWeight: "700" }}>{student.department ? student.department.replace("Department of ", "") : "Management"}</span> • <span>{student.batch || "U2022"}</span> • <span>{student.student_type || "Full-Time"}</span>
            </div>
          </div>
        </div>

        {/* CGPA HIGHLIGHT CARD */}
        <div className="cgpa-highlight-card">
          <div className="cgpa-left">
            <span className="cgpa-label">CUMULATIVE CGPA</span>
            <span className="cgpa-value">{metrics.cgpa}</span>
            <span className="cgpa-scale">/ 5.00 Max</span>
          </div>
          <div className="cgpa-right">
            <div className={`degree-class-badge ${degreeBadgeClass}`}>
              <Award size={14} />
              <span>{metrics.degreeClass}</span>
            </div>
            <div className="degree-full-text">{metrics.degreeClassFull}</div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="metrics-grid">
          <div className="metric-box" title={`Registered: ${metrics.tcu} CU | Earned: ${metrics.earnedCU} CU`}>
            <span className="metric-title">TOTAL CU</span>
            <span className="metric-num">{metrics.tcu}</span>
            <span style={{ fontSize: "9px", color: "#166534", fontWeight: "600" }}>{metrics.earnedCU} Earned</span>
          </div>
          <div className="metric-box">
            <span className="metric-title">TOTAL QP</span>
            <span className="metric-num">{metrics.tqp.toFixed(1)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-title">PASSED</span>
            <span className="metric-num text-success">{metrics.passedCount}</span>
          </div>
          <div className="metric-box">
            <span className="metric-title">FAILED</span>
            <span className={`metric-num ${metrics.failedCount > 0 ? "text-danger" : ""}`}>
              {metrics.failedCount}
            </span>
          </div>
        </div>

        {/* YEAR-BY-YEAR BREAKDOWN */}
        <div className="section-block">
          <div className="section-title">
            <TrendingUp size={14} />
            <span>PROGRESS BREAKDOWN</span>
          </div>
          <div className="breakdown-table-wrapper">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Level / Year</th>
                  <th style={{ textAlign: "right" }}>CU</th>
                  <th style={{ textAlign: "right" }}>QP</th>
                  <th style={{ textAlign: "right" }}>GPA</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(metrics.yearBreakdown).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-subtext">No recorded results yet</td>
                  </tr>
                ) : (
                  Object.entries(metrics.yearBreakdown).map(([year, val]) => {
                    const gpa = val.cu > 0 ? (val.qp / val.cu).toFixed(2) : "0.00";
                    return (
                      <tr key={year}>
                        <td>
                          <strong>{year}</strong>
                          <span style={{ fontSize: "10px", color: "#64748b", marginLeft: "5px" }}>
                            ({getSessionForLevel(student, year)})
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>{val.cu}</td>
                        <td style={{ textAlign: "right" }}>{val.qp.toFixed(1)}</td>
                        <td style={{ textAlign: "right" }}>
                          <span className="gpa-pill">{gpa}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* OUTSTANDING COURSES / CARRYOVERS */}
        <div className="section-block">
          <div className="section-title">
            <AlertTriangle size={14} className={metrics.outstandingCourses.length > 0 ? "text-danger" : ""} />
            <span>OUTSTANDING / CARRYOVERS ({metrics.outstandingCourses.length})</span>
          </div>
          {metrics.outstandingCourses.length === 0 ? (
            <div className="no-outstanding-box">
              <CheckCircle size={15} className="text-success" />
              <span>No outstanding or failed courses</span>
            </div>
          ) : (
            <div className="outstanding-list">
              {metrics.outstandingCourses.map((c) => (
                <div key={c.code} className="outstanding-item">
                  <div className="outstanding-header">
                    <strong>{c.code}</strong>
                    <span className="outstanding-cu">{c.cu} CU</span>
                  </div>
                  <div className="outstanding-title">{c.title}</div>
                  <div className="outstanding-meta">
                    Level {c.level} • {c.semester} • {c.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="overview-actions">
          <button
            className="btn btn-primary btn-block"
            onClick={() => onOpenTranscript(student.id)}
          >
            <FileText size={15} /> Official Transcript
          </button>
          <div className="action-row-split">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenWorksheet(student.id)}
            >
              <FileSpreadsheet size={14} /> Worksheet
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onEditStudent(student)}
            >
              <Edit2 size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
