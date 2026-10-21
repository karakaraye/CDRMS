import React, { useState, useMemo } from "react";
import {
  User,
  Phone,
  Mail,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  UserPlus,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Building,
} from "lucide-react";

export default function StudentList({
  students,
  selectedStudentId,
  onSelectStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenWorksheet,
  onOpenTranscript,
  onOpenAddStudent,
  activeProgram,
  onSelectProgram,
  selectedBatch,
  searchTerm,
  currentUser,
  allStudentsCount = 0,
  selectedDepartmentFilter = "all",
  onSwitchToAllDepartments,
}) {
  const showFullTime = !currentUser || currentUser.program === "All" || currentUser.program === "Full-Time";
  const showPartTime = !currentUser || currentUser.program === "All" || currentUser.program === "Part-Time";
  const showAllRecords = !currentUser || currentUser.program === "All";

  // Sorting state (default: alphabetical by Name, as Name is primary)
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortField === "matric") {
        const aMat = (a.matric_no || "").trim();
        const bMat = (b.matric_no || "").trim();
        if (!aMat && bMat) return 1;
        if (aMat && !bMat) return -1;
        const cmp = aMat.localeCompare(bMat, undefined, { numeric: true });
        return sortOrder === "asc" ? cmp : -cmp;
      } else {
        const aName = (a.fullname || `${a.surname || ""} ${a.firstname || ""}`).trim();
        const bName = (b.fullname || `${b.surname || ""} ${b.firstname || ""}`).trim();
        const cmp = aName.localeCompare(bName);
        return sortOrder === "asc" ? cmp : -cmp;
      }
    });
  }, [students, sortField, sortOrder]);

  return (
    <div className="student-list-container">
      {/* PROGRAM TABS BAR */}
      <div className="tabs-header">
        <div className="program-tabs">
          {showFullTime && (
            <button
              className={`tab-btn ${activeProgram === "Full-Time" ? "active" : ""}`}
              onClick={() => onSelectProgram("Full-Time")}
            >
              Full-Time Students
            </button>
          )}
          {showPartTime && (
            <button
              className={`tab-btn ${activeProgram === "Part-Time" ? "active" : ""}`}
              onClick={() => onSelectProgram("Part-Time")}
            >
              Part-Time Students
            </button>
          )}
          {showAllRecords && (
            <button
              className={`tab-btn ${activeProgram === "All" ? "active" : ""}`}
              onClick={() => onSelectProgram("All")}
            >
              All Records
            </button>
          )}
        </div>

        <div className="table-controls">
          {selectedBatch && (
            <span className="filter-pill">
              Batch: <strong>{selectedBatch}</strong>
            </span>
          )}
          {searchTerm && (
            <span className="filter-pill">
              Search: "<strong>{searchTerm}</strong>"
            </span>
          )}
          <span className="records-count-text">
            Showing <strong>{students.length}</strong> record{students.length === 1 ? "" : "s"}
          </span>

          <div className="table-scroll-buttons-group">
            <button
              type="button"
              className="btn-table-scroll"
              onClick={() => {
                const el = document.querySelector(".table-responsive");
                if (el) el.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title="Scroll to Top of Table (▲)"
            >
              <ChevronUp size={14} />
              <span>Top</span>
            </button>
            <button
              type="button"
              className="btn-table-scroll"
              onClick={() => {
                const el = document.querySelector(".table-responsive");
                if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
              }}
              title="Scroll to Bottom of Table (▼)"
            >
              <ChevronDown size={14} />
              <span>Bottom</span>
            </button>
          </div>
        </div>
      </div>

      {/* STUDENT TABLE */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th
                style={{ width: "140px", cursor: "pointer", userSelect: "none" }}
                onClick={() => toggleSort("matric")}
                title="Click to sort by Matriculation Number"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Matric No</span>
                  {sortField === "matric" ? (
                    sortOrder === "asc" ? <ChevronUp size={14} color="#0284c7" /> : <ChevronDown size={14} color="#0284c7" />
                  ) : (
                    <ArrowUpDown size={12} color="#94a3b8" />
                  )}
                </div>
              </th>
              <th
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => toggleSort("name")}
                title="Click to sort alphabetically by Full Name (Primary ID)"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Full Name (Primary ID)</span>
                  {sortField === "name" ? (
                    sortOrder === "asc" ? <ChevronUp size={14} color="#0284c7" /> : <ChevronDown size={14} color="#0284c7" />
                  ) : (
                    <ArrowUpDown size={12} color="#94a3b8" />
                  )}
                </div>
              </th>
              <th style={{ width: "90px" }}>Batch</th>
              <th style={{ width: "110px" }}>Program</th>
              <th style={{ width: "70px" }}>Sex</th>
              <th style={{ width: "120px" }}>Phone</th>
              <th style={{ width: "120px" }}>State</th>
              <th style={{ width: "140px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  <div className="empty-state">
                    <Building size={36} className="empty-icon" />
                    <h4>No student records found in this view</h4>
                    <p>
                      {searchTerm
                        ? `No results matching "${searchTerm}". Try a different keyword.`
                        : "There are no student records in this department yet."}
                    </p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
                      <button className="btn btn-primary btn-sm" onClick={onOpenAddStudent}>
                        <UserPlus size={14} /> Add Student
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedStudents.map((student) => {
                const isSelected = String(student.id) === String(selectedStudentId);
                return (
                  <tr
                    key={student.id}
                    className={`table-row ${isSelected ? "selected-row" : ""}`}
                    onClick={() => onSelectStudent(student.id)}
                    onDoubleClick={() => onOpenTranscript(student.id)}
                  >
                    <td className="matric-cell">
                      {student.matric_no ? (
                        <strong>{student.matric_no}</strong>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontStyle: "italic" }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="name-cell">
                      <div className="student-name-wrapper">
                        <span className="student-fullname">{student.fullname}</span>
                        <div className="student-subline-meta" style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                          {student.department && (
                            <span className="student-dept-tag">
                              {student.department.replace("Department of ", "")}
                            </span>
                          )}
                          {student.email && (
                            <span className="student-subtext">{student.email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="batch-pill">{student.batch || "U2022"}</span>
                    </td>
                    <td>
                      <span
                        className={`program-pill ${
                          student.student_type === "Part-Time" ? "pill-part-time" : "pill-full-time"
                        }`}
                      >
                        {student.student_type || "Full-Time"}
                      </span>
                    </td>
                    <td>{student.sex || "-"}</td>
                    <td>{student.gsm || "-"}</td>
                    <td>{student.state_of_origin || "-"}</td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          className="btn-action btn-action-results"
                          title="Open Results Worksheet"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWorksheet(student.id);
                          }}
                        >
                          <FileSpreadsheet size={14} />
                        </button>
                        <button
                          className="btn-action btn-action-transcript"
                          title="View Student Academic Spreadsheet"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTranscript(student.id);
                          }}
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          className="btn-action btn-action-edit"
                          title="Edit Student Profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditStudent(student);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-action btn-action-delete"
                          title="Delete Student"
                          onClick={(e) => {
                            e.stopPropagation();
                            const matricTag = student.matric_no ? ` (${student.matric_no})` : "";
                            if (window.confirm(`Are you sure you want to delete ${student.fullname}${matricTag}?`)) {
                              onDeleteStudent(student.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
