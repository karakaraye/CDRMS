/**
 * ExcelResultUploadModal.jsx
 * Advanced Excel/CSV Course Result Broadsheet Processor
 * 
 * Features:
 * - Drag & drop Excel (.xlsx, .xls, .csv) upload
 * - Auto-detects columns: Matric No, Name, CA, Exam, Total, Status
 * - Automatic student matching by Matric No (normalized)
 * - Intelligent Name Matching with confidence scoring when names replace matric numbers
 * - Multi-criteria Carry-Over / Repeat detection with Uniport 3.0 GP cap enforcement
 * - Interactive pre-flight table with 1-click carry-over toggling & student re-linking
 * - Pre-filled Excel template generator for lecturers
 * - Bulk saves to LocalStorage, syncs to Supabase Cloud, and logs to Audit Trail
 */

import React, { useState, useMemo, useRef } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Download,
  UserX,
  Check,
  RefreshCw,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import {
  parseExcelResultsFile,
  generateResultTemplate,
} from "../services/excelResultParser";
import { scoreToGrade } from "../services/grading";
import { db } from "../services/db";

export default function ExcelResultUploadModal({
  isOpen,
  onClose,
  students = [],
  courses = [],
  results = [],
  currentUser,
  onResultsSaved,
}) {
  // Course & Session Configuration
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [level, setLevel] = useState("100");
  const [semester, setSemester] = useState("First");
  const [session, setSession] = useState("2022/2023");
  const [programFilter, setProgramFilter] = useState("Full-Time");

  // File Upload State
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseMetadata, setParseMetadata] = useState(null);

  // Parsed Rows State
  const [rows, setRows] = useState([]);
  const [filterTab, setFilterTab] = useState("ALL"); // ALL | READY | NAME_MATCH | CARRYOVER | UNMATCHED
  const [tableSearch, setTableSearch] = useState("");

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessSummary, setSaveSuccessSummary] = useState(null);

  const fileInputRef = useRef(null);

  // Available sessions list
  const sessionOptions = [
    "2020/2021",
    "2021/2022",
    "2022/2023",
    "2023/2024",
    "2024/2025",
    "2025/2026",
    "2026/2027",
  ];

  // Filter courses based on selected Level, Semester, and Program
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchLvl = !level || String(c.level) === String(level);
      const matchSem = !semester || c.semester === semester;
      const matchProg =
        !programFilter ||
        programFilter === "All" ||
        c.program === programFilter ||
        c.program === "Full-Time";
      return matchLvl && matchSem && matchProg;
    });
  }, [courses, level, semester, programFilter]);

  // Set default selected course when filtered courses change
  const selectedCourse = useMemo(() => {
    return courses.find((c) => String(c.id) === String(selectedCourseId)) || null;
  }, [courses, selectedCourseId]);

  // Pre-select first course when list changes if none selected
  React.useEffect(() => {
    if (filteredCourses.length > 0 && (!selectedCourseId || !filteredCourses.some(c => String(c.id) === String(selectedCourseId)))) {
      setSelectedCourseId(String(filteredCourses[0].id));
    }
  }, [filteredCourses, selectedCourseId]);

  // Filter students for the current level/program (for template download)
  const studentsForCourse = useMemo(() => {
    return students.filter((s) => {
      const progMatch =
        !programFilter ||
        programFilter === "All" ||
        (s.student_type || "Full-Time") === programFilter;
      return progMatch;
    });
  }, [students, programFilter]);

  // -------------------------------------------------------------
  // FILE HANDLING & PARSING
  // -------------------------------------------------------------
  const handleFileProcess = async (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedCourse) {
      setParseError("Please select a target Course before uploading an Excel file.");
      return;
    }

    setParseError("");
    setIsProcessing(true);
    setFile(selectedFile);

    try {
      const result = await parseExcelResultsFile({
        fileData: selectedFile,
        course: selectedCourse,
        session,
        semester,
        students,
        existingResults: results,
      });

      // Auto-synchronize detected Session, Semester, or Course if detected from Excel
      if (result.detectedSession && result.detectedSession !== session) {
        setSession(result.detectedSession);
      }
      if (result.detectedSemester && result.detectedSemester !== semester) {
        setSemester(result.detectedSemester);
      }
      if (result.detectedCourseCode) {
        const found = courses.find((c) =>
          c.course_code.toLowerCase().replace(/\s+/g, "") ===
          result.detectedCourseCode.toLowerCase().replace(/\s+/g, "")
        );
        if (found) {
          setSelectedCourseId(String(found.id));
        }
      }

      setParseMetadata({
        sheetName: result.sheetName,
        columnMapping: result.columnMapping,
        totalRows: result.rows.length,
        detectedSession: result.detectedSession,
        detectedCourseCode: result.detectedCourseCode,
        detectedSemester: result.detectedSemester,
      });
      setRows(result.rows);
      setFilterTab("ALL");
    } catch (err) {
      console.error("Excel parse error:", err);
      setParseError(err.message || "Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // -------------------------------------------------------------
  // ROW INTERACTION HANDLERS
  // -------------------------------------------------------------
  const toggleRowInclude = (rowId) => {
    setRows((prev) =>
      prev.map((r) =>
        r.rowId === rowId ? { ...r, includeInImport: !r.includeInImport } : r
      )
    );
  };

  const toggleCarryover = (rowId) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        const newCarryover = !r.isCarryover;
        const { letter: grade, point: gradePoint } = scoreToGrade(r.score, newCarryover);
        return {
          ...r,
          isCarryover: newCarryover,
          grade,
          gradePoint,
          carryoverReason: newCarryover
            ? "Manually flagged as Carry-over"
            : "Manually marked as Regular",
        };
      })
    );
  };

  const handleScoreChange = (rowId, newScore) => {
    const scoreVal = Math.max(0, Math.min(100, parseFloat(newScore) || 0));
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        const { letter: grade, point: gradePoint } = scoreToGrade(scoreVal, r.isCarryover);
        return {
          ...r,
          score: scoreVal,
          grade,
          gradePoint,
        };
      })
    );
  };

  const handleAssignStudent = (rowId, newStudentId) => {
    const student = students.find((s) => String(s.id) === String(newStudentId));
    if (!student) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        return {
          ...r,
          matchedStudentId: String(student.id),
          matchedStudent: student,
          matchType: "MANUALLY_ASSIGNED",
          matchConfidence: 1.0,
          matchNote: `Manually linked to ${student.fullname} (${student.matric_no})`,
          includeInImport: true,
        };
      })
    );
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  // -------------------------------------------------------------
  // STATS & KPI COMPUTATION
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    const total = rows.length;
    const ready = rows.filter((r) => r.includeInImport && r.matchedStudent !== null).length;
    const nameMatch = rows.filter(
      (r) => r.matchType === "NAME_MATCH" || r.matchType === "NAME_IN_MATRIC_CELL"
    ).length;
    const carryovers = rows.filter((r) => r.isCarryover).length;
    const unmatched = rows.filter((r) => r.matchedStudent === null).length;
    return { total, ready, nameMatch, carryovers, unmatched };
  }, [rows]);

  // Filtered rows for the table
  const displayedRows = useMemo(() => {
    return rows.filter((r) => {
      // Tab filter
      if (filterTab === "READY" && (!r.includeInImport || !r.matchedStudent)) return false;
      if (
        filterTab === "NAME_MATCH" &&
        r.matchType !== "NAME_MATCH" &&
        r.matchType !== "NAME_IN_MATRIC_CELL"
      )
        return false;
      if (filterTab === "CARRYOVER" && !r.isCarryover) return false;
      if (filterTab === "UNMATCHED" && r.matchedStudent !== null) return false;

      // Search filter
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const mMat = r.rawMatric?.toLowerCase() || "";
        const mNam = r.rawName?.toLowerCase() || "";
        const sNam = r.matchedStudent?.fullname?.toLowerCase() || "";
        const sMat = r.matchedStudent?.matric_no?.toLowerCase() || "";
        return (
          mMat.includes(q) ||
          mNam.includes(q) ||
          sNam.includes(q) ||
          sMat.includes(q)
        );
      }

      return true;
    });
  }, [rows, filterTab, tableSearch]);

  // -------------------------------------------------------------
  // COMMIT / SAVE RESULTS TO DATABASE & AUDIT LOG
  // -------------------------------------------------------------
  const handleCommitResults = async () => {
    if (!selectedCourse) {
      alert("Please select a target course.");
      return;
    }

    const rowsToImport = rows.filter(
      (r) => r.includeInImport && r.matchedStudent !== null
    );

    if (rowsToImport.length === 0) {
      alert("No valid matched student results are selected for import.");
      return;
    }

    setIsSaving(true);
    try {
      const recordsToSave = rowsToImport.map((r) => ({
        student_id: r.matchedStudent.id,
        course_id: selectedCourse.id,
        score: r.score,
        grade: r.grade,
        grade_point: r.gradePoint,
        session,
        semester,
        level: r.studentLevelForSession || selectedCourse.level || level,
        is_carryover: r.isCarryover ? 1 : 0,
        is_waived: 0,
        waiver_grade: null,
        remark: r.isCarryover
          ? `Carry-over (${selectedCourse.course_code} in ${session})`
          : `Regular (${selectedCourse.course_code} in ${session})`,
        is_locked: true,
      }));

      // Bulk save via db service (handles LocalStorage & Supabase cloud sync)
      await db.saveBulkResults(recordsToSave);

      // Add detailed Audit Log entry
      db.addAuditLog({
        action: "EXCEL_RESULTS_IMPORTED",
        title: `Excel Broadsheet Processed: ${selectedCourse.course_code} (${recordsToSave.length} Students)`,
        course_code: selectedCourse.course_code,
        course_title: selectedCourse.course_title,
        session,
        semester,
        level,
        resolved_by: currentUser?.fullname || currentUser?.roleTitle || "Exam Officer",
        resolution_note: `Bulk imported ${recordsToSave.length} marks for ${selectedCourse.course_code}. File: ${file?.name || "upload.xlsx"} (${stats.carryovers} carryovers, ${stats.nameMatch} matched by name).`,
      });

      if (onResultsSaved) {
        onResultsSaved();
      }

      setSaveSuccessSummary({
        importedCount: recordsToSave.length,
        carryoverCount: rowsToImport.filter((r) => r.isCarryover).length,
        courseCode: selectedCourse.course_code,
        courseTitle: selectedCourse.course_title,
        session,
        semester,
      });
    } catch (err) {
      console.error("Failed to commit results:", err);
      alert("Failed to save results: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedCourse) {
      alert("Please select a target course first.");
      return;
    }
    generateResultTemplate({
      course: selectedCourse,
      session,
      semester,
      students: studentsForCourse,
    });
  };

  const handleReset = () => {
    setFile(null);
    setRows([]);
    setParseMetadata(null);
    setParseError("");
    setSaveSuccessSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-xl excel-processor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="title-icon-badge">
              <FileSpreadsheet size={20} className="icon-pulse" />
            </div>
            <div>
              <div className="modal-title-flex">
                <h3>Excel Result Broadsheet Processor</h3>
                <span className="badge-pro">SMART MATCH</span>
              </div>
              <p className="modal-subtitle">
                Upload lecturer mark sheets (.xlsx / .csv), auto-sort scores by matric no,
                detect carry-overs & resolve students entered by name.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="modal-body excel-processor-body">
          {/* SUCCESS BANNER */}
          {saveSuccessSummary ? (
            <div className="excel-success-screen">
              <div className="success-icon-circle">
                <CheckCircle size={48} />
              </div>
              <h3>Results Successfully Distributed & Locked!</h3>
              <p>
                <strong>{saveSuccessSummary.importedCount} student scores</strong> were
                successfully assigned to{" "}
                <span className="text-primary font-bold">
                  {saveSuccessSummary.courseCode}: {saveSuccessSummary.courseTitle}
                </span>{" "}
                for the <strong>{saveSuccessSummary.session}</strong> academic session (
                {saveSuccessSummary.semester} Semester).
              </p>
              {saveSuccessSummary.carryoverCount > 0 && (
                <div className="carryover-alert-pill">
                  <ShieldCheck size={16} />
                  <span>
                    {saveSuccessSummary.carryoverCount} Carry-over / Retake records
                    correctly capped according to Uniport 3.0 GP regulations.
                  </span>
                </div>
              )}
              <div className="success-action-btns">
                <button className="btn btn-secondary" onClick={handleReset}>
                  <RefreshCw size={15} /> Process Another Broadsheet
                </button>
                <button className="btn btn-primary" onClick={onClose}>
                  <Check size={16} /> Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* CONFIGURATION BAR (COURSE & SESSION SELECTOR) */}
              <div className="excel-config-bar">
                <div className="config-grid">
                  {/* Academic Session */}
                  <div className="config-col">
                    <label>Academic Session</label>
                    <select
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      disabled={rows.length > 0}
                    >
                      {sessionOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Level */}
                  <div className="config-col">
                    <label>Course Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      disabled={rows.length > 0}
                    >
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                      <option value="600">600 Level</option>
                    </select>
                  </div>

                  {/* Semester */}
                  <div className="config-col">
                    <label>Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      disabled={rows.length > 0}
                    >
                      <option value="First">First Semester</option>
                      <option value="Second">Second Semester</option>
                    </select>
                  </div>

                  {/* Program Filter */}
                  <div className="config-col">
                    <label>Program</label>
                    <select
                      value={programFilter}
                      onChange={(e) => setProgramFilter(e.target.value)}
                      disabled={rows.length > 0}
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="All">All Programs</option>
                    </select>
                  </div>

                  {/* Target Course */}
                  <div className="config-col config-col-wide">
                    <label>Target Course (Destination)</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      disabled={rows.length > 0}
                      className="course-select-highlight"
                    >
                      {filteredCourses.length === 0 ? (
                        <option value="">No courses found for this level/semester</option>
                      ) : (
                        filteredCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.course_code} — {c.course_title} ({c.credit_units} CU)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Download Template Action */}
                  <div className="config-col config-col-action">
                    <button
                      className="btn btn-outline-template"
                      onClick={handleDownloadTemplate}
                      title="Download standardized Excel template pre-filled with student list"
                    >
                      <Download size={15} />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* UPLOAD DROPZONE (SHOWN WHEN NO ROWS PARSED YET) */}
              {rows.length === 0 ? (
                <div
                  className={`excel-dropzone ${isDragging ? "dropzone-active" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls, .csv"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />
                  {isProcessing ? (
                    <div className="dropzone-processing">
                      <RefreshCw size={36} className="spin-icon text-primary" />
                      <h4>Analyzing Excel File & Matching Students...</h4>
                      <p>Running matric validation, name tokens & carry-over checks</p>
                    </div>
                  ) : (
                    <div className="dropzone-prompt">
                      <div className="dropzone-icon-bubble">
                        <UploadCloud size={38} />
                      </div>
                      <h4>Drag & Drop Lecturer's Excel Sheet Here</h4>
                      <p>
                        Supports <strong>.xlsx</strong>, <strong>.xls</strong>, or{" "}
                        <strong>.csv</strong> files.
                      </p>
                      <div className="dropzone-features-pill">
                        <span>✓ Auto-Detects CA & Exam</span>
                        <span>✓ Matches by Name if Matric Missing</span>
                        <span>✓ Flags Carry-Overs</span>
                      </div>
                      <button
                        className="btn btn-primary dropzone-browse-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Browse Files on Device
                      </button>
                    </div>
                  )}

                  {parseError && (
                    <div className="parse-error-box" onClick={(e) => e.stopPropagation()}>
                      <AlertCircle size={18} />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* PRE-FLIGHT REVIEW DASHBOARD */
                <div className="excel-preview-workspace">
                  {/* KPI STATS BAR */}
                  <div className="preview-kpi-bar">
                    <div className="kpi-card kpi-total">
                      <span className="kpi-num">{stats.total}</span>
                      <span className="kpi-label">Total Rows in File</span>
                    </div>

                    <div
                      className={`kpi-card kpi-ready ${filterTab === "READY" ? "kpi-active" : ""}`}
                      onClick={() => setFilterTab(filterTab === "READY" ? "ALL" : "READY")}
                    >
                      <span className="kpi-num text-success">{stats.ready}</span>
                      <span className="kpi-label">Ready to Save</span>
                    </div>

                    <div
                      className={`kpi-card kpi-name ${filterTab === "NAME_MATCH" ? "kpi-active" : ""}`}
                      onClick={() =>
                        setFilterTab(filterTab === "NAME_MATCH" ? "ALL" : "NAME_MATCH")
                      }
                    >
                      <span className="kpi-num text-warning">{stats.nameMatch}</span>
                      <span className="kpi-label">Matched by Name 🟡</span>
                    </div>

                    <div
                      className={`kpi-card kpi-carryover ${filterTab === "CARRYOVER" ? "kpi-active" : ""}`}
                      onClick={() =>
                        setFilterTab(filterTab === "CARRYOVER" ? "ALL" : "CARRYOVER")
                      }
                    >
                      <span className="kpi-num text-purple">{stats.carryovers}</span>
                      <span className="kpi-label">Carry-Overs Flagged 🟠</span>
                    </div>

                    <div
                      className={`kpi-card kpi-unmatched ${filterTab === "UNMATCHED" ? "kpi-active" : ""}`}
                      onClick={() =>
                        setFilterTab(filterTab === "UNMATCHED" ? "ALL" : "UNMATCHED")
                      }
                    >
                      <span className="kpi-num text-danger">{stats.unmatched}</span>
                      <span className="kpi-label">Unmatched 🔴</span>
                    </div>

                    <div className="preview-file-badge">
                      <FileSpreadsheet size={16} />
                      <span className="file-name-text">
                        {file?.name}{" "}
                        {parseMetadata?.sheetName && (
                          <span className="file-sheet-tag">[{parseMetadata.sheetName}]</span>
                        )}
                      </span>
                      <button
                        className="btn-link-action"
                        onClick={handleReset}
                        title="Upload a different file"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* TABLE FILTER & SEARCH TOOLBAR */}
                  <div className="table-toolbar">
                    <div className="filter-pill-group">
                      <button
                        className={`filter-pill ${filterTab === "ALL" ? "active" : ""}`}
                        onClick={() => setFilterTab("ALL")}
                      >
                        All Records ({stats.total})
                      </button>
                      <button
                        className={`filter-pill ${filterTab === "READY" ? "active" : ""}`}
                        onClick={() => setFilterTab("READY")}
                      >
                        Ready ({stats.ready})
                      </button>
                      {stats.nameMatch > 0 && (
                        <button
                          className={`filter-pill pill-warning ${filterTab === "NAME_MATCH" ? "active" : ""}`}
                          onClick={() => setFilterTab("NAME_MATCH")}
                        >
                          Matched by Name ({stats.nameMatch})
                        </button>
                      )}
                      {stats.carryovers > 0 && (
                        <button
                          className={`filter-pill pill-purple ${filterTab === "CARRYOVER" ? "active" : ""}`}
                          onClick={() => setFilterTab("CARRYOVER")}
                        >
                          Carry-Overs ({stats.carryovers})
                        </button>
                      )}
                      {stats.unmatched > 0 && (
                        <button
                          className={`filter-pill pill-danger ${filterTab === "UNMATCHED" ? "active" : ""}`}
                          onClick={() => setFilterTab("UNMATCHED")}
                        >
                          Needs Matching ({stats.unmatched})
                        </button>
                      )}
                    </div>

                    <div className="table-search-box">
                      <Search size={15} />
                      <input
                        type="text"
                        placeholder="Filter rows by matric or name..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                      />
                      {tableSearch && (
                        <button
                          className="search-clear-btn"
                          onClick={() => setTableSearch("")}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PREVIEW DATA TABLE */}
                  <div className="excel-table-container">
                    <table className="excel-table">
                      <thead>
                        <tr>
                          <th style={{ width: "40px", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={
                                rows.length > 0 &&
                                rows.every((r) => r.includeInImport)
                              }
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setRows((prev) =>
                                  prev.map((r) => ({
                                    ...r,
                                    includeInImport: r.matchedStudent ? checked : false,
                                  }))
                                );
                              }}
                              title="Toggle all valid rows"
                            />
                          </th>
                          <th style={{ width: "45px" }}>#</th>
                          <th>Excel Identification</th>
                          <th>Matched Student in CDRMS</th>
                          <th style={{ width: "115px", textAlign: "center" }}>Sorted Session</th>
                          <th style={{ width: "65px", textAlign: "center" }}>CA (30)</th>
                          <th style={{ width: "65px", textAlign: "center" }}>Exam (70)</th>
                          <th style={{ width: "75px", textAlign: "center" }}>Total Score</th>
                          <th style={{ width: "75px", textAlign: "center" }}>Grade</th>
                          <th style={{ width: "130px", textAlign: "center" }}>Course Status</th>
                          <th style={{ width: "50px", textAlign: "center" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="empty-table-cell">
                              No records match the current filter criteria.
                            </td>
                          </tr>
                        ) : (
                          displayedRows.map((row, idx) => {
                            const isNameMatch =
                              row.matchType === "NAME_MATCH" ||
                              row.matchType === "NAME_IN_MATRIC_CELL";
                            const isUnmatched = row.matchedStudent === null;

                            return (
                              <tr
                                key={row.rowId}
                                className={`excel-row ${
                                  !row.includeInImport ? "row-excluded" : ""
                                } ${isNameMatch ? "row-highlight-name" : ""} ${
                                  isUnmatched ? "row-highlight-unmatched" : ""
                                }`}
                              >
                                {/* Checkbox */}
                                <td style={{ textAlign: "center" }}>
                                  <input
                                    type="checkbox"
                                    checked={row.includeInImport}
                                    disabled={isUnmatched}
                                    onChange={() => toggleRowInclude(row.rowId)}
                                    title={
                                      isUnmatched
                                        ? "Match student before including"
                                        : "Include in import"
                                    }
                                  />
                                </td>

                                {/* Row Index */}
                                <td className="row-index-cell">{idx + 1}</td>

                                {/* Raw Excel Value */}
                                <td>
                                  <div className="excel-raw-cell">
                                    <div className="raw-matric font-mono">
                                      {row.rawMatric || (
                                        <span className="text-muted">(Blank Matric)</span>
                                      )}
                                    </div>
                                    {row.rawName && (
                                      <div className="raw-name">{row.rawName}</div>
                                    )}
                                  </div>
                                </td>

                                {/* Matched Student or Disambiguation Dropdown */}
                                <td>
                                  {isUnmatched ? (
                                    <div className="unmatched-resolution-cell">
                                      <div className="unmatched-badge">
                                        <UserX size={14} />
                                        <span>Student Not Found</span>
                                      </div>
                                      <select
                                        className="quick-link-select"
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleAssignStudent(row.rowId, e.target.value);
                                          }
                                        }}
                                        defaultValue=""
                                      >
                                        <option value="" disabled>
                                          🔍 Link to existing student...
                                        </option>
                                        {students.map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.matric_no} — {s.fullname} ({s.batch || "Set"})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <div className="matched-student-cell">
                                      <div className="student-main-info">
                                        <span className="student-fullname">
                                          {row.matchedStudent.fullname}
                                        </span>
                                        <span className="student-matric-pill">
                                          {row.matchedStudent.matric_no}
                                        </span>
                                        <span className="student-batch-pill">
                                          {row.matchedStudent.batch || "Regular"}
                                        </span>
                                      </div>

                                      {/* Indicator tag for name matches */}
                                      {isNameMatch && (
                                        <div className="name-match-tag">
                                          <span>
                                            🟡 Matched by Name (
                                            {Math.round(row.matchConfidence * 100)}% match)
                                          </span>
                                          <select
                                            className="quick-reassign-select"
                                            onChange={(e) =>
                                              handleAssignStudent(row.rowId, e.target.value)
                                            }
                                            value={row.matchedStudent.id}
                                            title="Click to reassign to a different student if this match is incorrect"
                                          >
                                            <option value={row.matchedStudent.id}>
                                              ✓ Confirm: {row.matchedStudent.fullname}
                                            </option>
                                            {students
                                              .filter(
                                                (s) => String(s.id) !== String(row.matchedStudent.id)
                                              )
                                              .map((s) => (
                                                <option key={s.id} value={s.id}>
                                                  {s.matric_no} — {s.fullname}
                                                </option>
                                              ))}
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Sorted Academic Session & Level */}
                                <td style={{ textAlign: "center" }}>
                                  <div className="session-target-pill">
                                    <span className="session-text">{session}</span>
                                    <span className="level-text">
                                      {row.studentLevelForSession || level}L{" "}
                                      {row.isCarryover ? "• Retake" : "• Reg"}
                                    </span>
                                  </div>
                                </td>

                                {/* CA Score */}
                                <td style={{ textAlign: "center" }}>
                                  <span className="score-sub-cell">{row.rawCA !== "" ? row.rawCA : "—"}</span>
                                </td>

                                {/* Exam Score */}
                                <td style={{ textAlign: "center" }}>
                                  <span className="score-sub-cell">{row.rawExam !== "" ? row.rawExam : "—"}</span>
                                </td>

                                {/* Total Score */}
                                <td style={{ textAlign: "center" }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="score-edit-input"
                                    value={row.score}
                                    onChange={(e) =>
                                      handleScoreChange(row.rowId, e.target.value)
                                    }
                                  />
                                </td>

                                {/* Grade & GP */}
                                <td style={{ textAlign: "center" }}>
                                  <div className="grade-badge-group">
                                    <span
                                      className={`grade-pill grade-${row.grade}`}
                                    >
                                      {row.grade}
                                    </span>
                                    <span className="gp-subtext">
                                      {row.gradePoint.toFixed(1)} GP
                                    </span>
                                  </div>
                                </td>

                                {/* Carry-Over Toggle Switch */}
                                <td style={{ textAlign: "center" }}>
                                  <button
                                    type="button"
                                    className={`status-toggle-btn ${
                                      row.isCarryover ? "toggle-carryover" : "toggle-regular"
                                    }`}
                                    onClick={() => toggleCarryover(row.rowId)}
                                    title={
                                      row.carryoverReason ||
                                      "Click to toggle between Regular and Carry-over"
                                    }
                                  >
                                    {row.isCarryover ? (
                                      <>
                                        <span className="status-dot dot-carryover" />
                                        <span>Carry-Over (CO)</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="status-dot dot-regular" />
                                        <span>Regular</span>
                                      </>
                                    )}
                                  </button>
                                </td>

                                {/* Action */}
                                <td style={{ textAlign: "center" }}>
                                  <button
                                    type="button"
                                    className="btn-icon-danger"
                                    onClick={() => handleRemoveRow(row.rowId)}
                                    title="Exclude row from import"
                                  >
                                    <X size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        {!saveSuccessSummary && (
          <div className="modal-footer excel-modal-footer">
            <div className="footer-left-info">
              {rows.length > 0 && selectedCourse && (
                <div className="import-summary-indicator">
                  <BookOpen size={16} />
                  <span>
                    Importing to: <strong>{selectedCourse.course_code}</strong> ({session}{" "}
                    • {semester} Sem) —{" "}
                    <span className="text-success font-semibold">
                      {stats.ready} scores ready
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="footer-right-buttons">
              <button className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              {rows.length > 0 && (
                <button
                  className="btn btn-primary btn-commit-import"
                  onClick={handleCommitResults}
                  disabled={isSaving || stats.ready === 0}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Saving & Distributing Scores...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Import & Save {stats.ready} Results</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
