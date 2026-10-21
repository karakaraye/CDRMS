import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  User,
  BookOpen,
  FileText,
  AlertTriangle,
  Award,
  Search,
  History,
  Printer,
  ChevronRight,
  Filter,
  Check,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Paperclip,
  Download,
  Eye,
} from "lucide-react";
import { ROLES, auth } from "../services/auth";
import { db } from "../services/db";

export default function QueriesModal({
  isOpen,
  onClose,
  currentUser,
  queries,
  students,
  courses,
  results,
  auditLogs = [],
  onCreateQuery,
  onResolveQuery,
  onRejectQuery,
  initialTab = "list",
}) {
  const isHOD = currentUser?.role === ROLES.HOD;
  const isSupervisor =
    currentUser?.role === ROLES.SUPER_FT ||
    currentUser?.role === ROLES.SUPER_PT ||
    currentUser?.role === ROLES.SUPERVISING ||
    Boolean(currentUser?.roleTitle && currentUser.roleTitle.toLowerCase().includes("supervising"));

  const [activeTab, setActiveTab] = useState(initialTab || (isHOD ? "audit" : "list"));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const [selectedQueryToResolve, setSelectedQueryToResolve] = useState(null);
  const [resolutionScore, setResolutionScore] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");

  // Officer accounts & password security state
  const [officerResetSuccess, setOfficerResetSuccess] = useState("");
  const [officerSearch, setOfficerSearch] = useState("");
  const [confirmOfficerToReset, setConfirmOfficerToReset] = useState(null);
  const [endorsementNotes, setEndorsementNotes] = useState({});

  const [resetRequests, setResetRequests] = useState(() =>
    auth.getResetRequests(currentUser?.departmentId, currentUser?.program)
  );

  const refreshResetRequests = () => {
    setResetRequests(
      auth.getResetRequests(currentUser?.departmentId, currentUser?.program)
    );
  };

  const pendingSupervisorReqs = useMemo(() => {
    return resetRequests.filter((r) => r.status === "PENDING_HEAD_OFFICER");
  }, [resetRequests]);

  const approvedForHODReqs = useMemo(() => {
    return resetRequests.filter((r) => r.status === "APPROVED_BY_HEAD_OFFICER");
  }, [resetRequests]);

  const officerSecurityList = useMemo(() => {
    return auth.getOfficerSecurityList(
      currentUser?.departmentId || "management",
      currentUser?.program || "Full-Time"
    );
  }, [currentUser, officerResetSuccess, resetRequests]);

  const filteredOfficers = useMemo(() => {
    if (!officerSearch.trim()) return officerSecurityList;
    const q = officerSearch.toLowerCase().trim();
    return officerSecurityList.filter(
      (u) =>
        u.roleTitle.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        String(u.level).toLowerCase().includes(q)
    );
  }, [officerSecurityList, officerSearch]);

  const handleSupervisorApprove = (req) => {
    const note = endorsementNotes[req.id] || "";
    const res = auth.headOfficerApproveResetRequest(req.id, currentUser, note);
    if (res.success) {
      db.addAuditLog({
        action: "PASSWORD_RESET_ENDORSED",
        title: `Head Exam Officer endorsed password reset for ${req.roleTitle}`,
        matric_no: "-",
        student_name: "-",
        course_code: "-",
        requested_by: `${currentUser.roleTitle} (${currentUser.username})`,
        resolution_note: `Security verification cleared by Head Exam Officer. Forwarded to HOD for execution. Reason: ${req.reason || "N/A"}. Note: ${note || "Approved and endorsed."}`,
        justification: "Tier-1 security clearance in academic recovery chain.",
      });
      refreshResetRequests();
      setOfficerResetSuccess(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleSupervisorReject = (req, reason = "") => {
    const res = auth.headOfficerRejectResetRequest(req.id, currentUser, reason);
    if (res.success) {
      db.addAuditLog({
        action: "PASSWORD_RESET_DECLINED",
        title: `Head Exam Officer declined password reset for ${req.roleTitle}`,
        matric_no: "-",
        student_name: "-",
        course_code: "-",
        requested_by: `${currentUser.roleTitle} (${currentUser.username})`,
        resolution_note: `Reset request declined by Head Exam Officer. Reason: ${reason || "Declined during security verification."}`,
        justification: "Failed verification or duplicate request.",
      });
      refreshResetRequests();
      setOfficerResetSuccess(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleHODExecuteReset = (officer, req) => {
    const isHeadOfficerSelf =
      officer.role === ROLES.SUPERVISING ||
      officer.role === ROLES.SUPER_FT ||
      officer.role === ROLES.SUPER_PT;

    if (isHeadOfficerSelf) {
      const res = auth.resetPasswordToDefault(
        officer.username,
        `HOD ${currentUser.roleTitle} (${currentUser.username}) [Direct Superior Clearance]`
      );
      if (res.success) {
        db.addAuditLog({
          action: "OFFICER_PASSWORD_RESET_EXECUTED",
          title: `HOD reset password for Head Exam Officer (${officer.roleTitle})`,
          matric_no: "-",
          student_name: "-",
          course_code: "-",
          requested_by: `${currentUser.roleTitle} (${currentUser.username})`,
          resolution_note: `Direct HOD executive clearance for Head Examination Officer (${officer.username}). Password restored to 'password123'. Must change on next login.`,
          justification: "Executive Superior clearance.",
        });
        refreshResetRequests();
        setOfficerResetSuccess(`Password for ${officer.roleTitle} (${officer.username}) was successfully reset to 'password123'.`);
        setConfirmOfficerToReset(null);
      } else {
        alert(res.message);
      }
      return;
    }

    if (!req || req.status !== "APPROVED_BY_HEAD_OFFICER") {
      alert("Policy Mandate: The Head Examination Officer must approve this reset request before the HOD is able to reset the password.");
      return;
    }

    const res = auth.hodExecuteResetRequest(req.id, currentUser);
    if (res.success) {
      db.addAuditLog({
        action: "OFFICER_PASSWORD_RESET_EXECUTED",
        title: `HOD authorized & executed password reset for ${officer.roleTitle}`,
        matric_no: "-",
        student_name: "-",
        course_code: "-",
        requested_by: `${currentUser.roleTitle} (${currentUser.username})`,
        resolution_note: `Dual-Clearance Verified. Endorsed by Head Exam Officer (${req.headOfficerApproval?.approvedBy || "Supervising Officer"}) and executed by HOD (${currentUser.username}). Password reset to 'password123'. Must change on next login.`,
        justification: "Institutional Multi-Tier Academic Clearance Protocol.",
      });

      refreshResetRequests();
      setOfficerResetSuccess(`Password for ${officer.roleTitle} (${officer.username}) was successfully reset to 'password123'. Dual-clearance protocol complete.`);
      setConfirmOfficerToReset(null);
    } else {
      alert(res.message);
    }
  };

  const handleInitiateRequest = (officer) => {
    const res = auth.createPasswordResetRequest(
      officer.username,
      `Routed to Head Exam Officer by ${currentUser.roleTitle} (${currentUser.username})`
    );
    refreshResetRequests();
    setOfficerResetSuccess(res.message);
  };

  // Search dialogs state for supervisor query creation
  const [isStudentSearchOpen, setIsStudentSearchOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [isCourseSearchOpen, setIsCourseSearchOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState("");

  // Audit trail search filter
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");

  // Query Form
  const [queryForm, setQueryForm] = useState({
    student_id: "",
    course_id: "",
    result_id: "",
    current_score: "",
    proposed_score: "",
    reason: "",
    attachment_data: "",
    attachment_name: "",
    attachment_type: "",
  });

  const pendingQueries = queries.filter((q) => q.status === "PENDING");
  const pastQueries = queries.filter((q) => q.status !== "PENDING");

  // Selected student & course objects for display
  const selectedStudent = students.find((s) => String(s.id) === String(queryForm.student_id));
  const selectedCourse = courses.find((c) => String(c.id) === String(queryForm.course_id));

  // Available students for supervisor
  const availableStudents = useMemo(() => {
    return students.filter((s) => {
      if (currentUser?.program && currentUser.program !== "All") {
        return (s.student_type || "Full-Time") === currentUser.program;
      }
      return true;
    });
  }, [students, currentUser]);

  // Filtered students for search modal
  const filteredStudentsForSearch = useMemo(() => {
    if (!studentSearchQuery.trim()) return availableStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return availableStudents.filter(
      (s) =>
        s.matric_no?.toLowerCase().includes(q) ||
        s.fullname?.toLowerCase().includes(q) ||
        s.batch?.toLowerCase().includes(q)
    );
  }, [availableStudents, studentSearchQuery]);

  // Student results available for course selection
  const studentResultsList = useMemo(() => {
    if (!queryForm.student_id) return [];
    return results.filter((r) => String(r.student_id) === String(queryForm.student_id));
  }, [results, queryForm.student_id]);

  // Filtered courses for search modal
  const filteredCoursesForSearch = useMemo(() => {
    if (!queryForm.student_id) return [];
    const q = courseSearchQuery.toLowerCase().trim();

    return studentResultsList
      .map((r) => {
        const c = courses.find((crs) => String(crs.id) === String(r.course_id));
        return {
          result: r,
          course: c,
        };
      })
      .filter(({ course }) => {
        if (!course) return false;
        if (!q) return true;
        return (
          course.course_code.toLowerCase().includes(q) ||
          course.course_title.toLowerCase().includes(q)
        );
      });
  }, [studentResultsList, courses, courseSearchQuery, queryForm.student_id]);

  // Handlers
  const handleSelectStudent = (student) => {
    setQueryForm({
      ...queryForm,
      student_id: String(student.id),
      course_id: "",
      result_id: "",
      current_score: "",
    });
    setIsStudentSearchOpen(false);
    setStudentSearchQuery("");
  };

  const handleSelectCourse = (resObj) => {
    setQueryForm({
      ...queryForm,
      course_id: String(resObj.course.id),
      result_id: String(resObj.result.id),
      current_score: resObj.result.score !== undefined ? String(resObj.result.score) : "0",
    });
    setIsCourseSearchOpen(false);
    setCourseSearchQuery("");
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an attachment smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setQueryForm((prev) => ({
        ...prev,
        attachment_data: uploadEvent.target.result,
        attachment_name: file.name,
        attachment_type: file.type || "application/octet-stream",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setQueryForm((prev) => ({
      ...prev,
      attachment_data: "",
      attachment_name: "",
      attachment_type: "",
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!queryForm.student_id || !queryForm.course_id || !queryForm.proposed_score || !queryForm.reason) {
      alert("Please select student, select contested course, and enter proposed mark & justification.");
      return;
    }

    const contestedResult = results.find((r) => String(r.id) === String(queryForm.result_id));

    onCreateQuery({
      result_id: queryForm.result_id,
      student_id: queryForm.student_id,
      matric_no: selectedStudent?.matric_no || "",
      student_name: selectedStudent?.fullname || "",
      course_id: queryForm.course_id,
      course_code: selectedCourse?.course_code || "",
      course_title: selectedCourse?.course_title || "",
      original_score: Number(queryForm.current_score || 0),
      proposed_score: Number(queryForm.proposed_score),
      reason: queryForm.reason,
      requested_by: currentUser.roleTitle, // Official role only, no personal name
      session: contestedResult?.session || "",
      semester: contestedResult?.semester || "",
      attachment_data: queryForm.attachment_data || null,
      attachment_name: queryForm.attachment_name || null,
      attachment_type: queryForm.attachment_type || null,
    });

    setQueryForm({
      student_id: "",
      course_id: "",
      result_id: "",
      current_score: "",
      proposed_score: "",
      reason: "",
      attachment_data: "",
      attachment_name: "",
      attachment_type: "",
    });
    setActiveTab("list");
  };

  const handleResolveSubmit = async (query) => {
    const score = resolutionScore !== "" ? resolutionScore : query.proposed_score;
    if (isNaN(parseFloat(score))) {
      alert("Please enter a valid numeric score.");
      return;
    }

    await onResolveQuery(
      query.id,
      score,
      resolutionNote,
      "Head of Department (HOD)"
    );
    setSelectedQueryToResolve(null);
    setResolutionScore("");
    setResolutionNote("");
  };

  const handleRejectSubmit = async (query) => {
    if (!rejectionNote.trim()) {
      alert("Please provide an official rejection note explaining why this query was declined.");
      return;
    }

    await onRejectQuery(
      query.id,
      rejectionNote,
      "Head of Department (HOD)"
    );
    setSelectedQueryToResolve(null);
    setRejectionNote("");
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditActionFilter !== "ALL" && log.action !== auditActionFilter) return false;
      if (!auditSearchQuery.trim()) return true;
      const q = auditSearchQuery.toLowerCase().trim();
      return (
        log.matric_no?.toLowerCase().includes(q) ||
        log.student_name?.toLowerCase().includes(q) ||
        log.course_code?.toLowerCase().includes(q) ||
        log.title?.toLowerCase().includes(q) ||
        log.justification?.toLowerCase().includes(q) ||
        log.resolution_note?.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearchQuery, auditActionFilter]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-xl query-center-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldAlert size={18} />
            <h3>Result Audit & Score Query Center</h3>
            <span
              className="badge-count"
              style={{
                background: pendingQueries.length > 0 ? "#fee2e2" : "#e2e8f0",
                color: pendingQueries.length > 0 ? "#b91c1c" : "#475569",
              }}
            >
              {pendingQueries.length} Pending
            </span>
            <span className="role-chip-pill" style={{ marginLeft: "8px" }}>
              {currentUser?.roleTitle}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="modal-filter-bar">
          <button
            className={`btn btn-sm ${activeTab === "list" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setActiveTab("list");
              setSelectedQueryToResolve(null);
            }}
          >
            All Queries ({queries.length})
          </button>

          {isSupervisor && (
            <button
              className={`btn btn-sm ${activeTab === "new" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("new")}
            >
              <Send size={13} /> Submit New Query to HOD
            </button>
          )}

          {/* AUDIT TRAIL TAB FOR HOD (AND SUPERVISORS) */}
          <button
            className={`btn btn-sm ${activeTab === "audit" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setActiveTab("audit");
              setSelectedQueryToResolve(null);
            }}
          >
            <History size={13} />
            <span>Executive Audit Trail</span>
            <span className="badge-count" style={{ background: "rgba(255,255,255,0.25)", color: "inherit", marginLeft: "4px" }}>
              {auditLogs.length}
            </span>
          </button>

          {/* HEAD EXAM OFFICER ENDORSEMENT TAB */}
          {isSupervisor && (
            <button
              className={`btn btn-sm ${activeTab === "supervisor_resets" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                setActiveTab("supervisor_resets");
                setSelectedQueryToResolve(null);
              }}
            >
              <KeyRound size={13} />
              <span>Password Reset Endorsements</span>
              {pendingSupervisorReqs.length > 0 && (
                <span className="badge-count" style={{ background: "#ef4444", color: "#ffffff", marginLeft: "4px" }}>
                  {pendingSupervisorReqs.length} Pending
                </span>
              )}
            </button>
          )}

          {/* OFFICER SECURITY TAB FOR HOD */}
          {isHOD && (
            <button
              className={`btn btn-sm ${activeTab === "security" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                setActiveTab("security");
                setSelectedQueryToResolve(null);
              }}
            >
              <KeyRound size={13} />
              <span>Officer Accounts & Passwords</span>
              {approvedForHODReqs.length > 0 && (
                <span className="badge-count" style={{ background: "#10b981", color: "#ffffff", marginLeft: "4px" }}>
                  {approvedForHODReqs.length} Ready
                </span>
              )}
            </button>
          )}

          <div style={{ marginLeft: "auto", fontSize: "12px", color: "#64748b" }}>
            Role: <strong>{currentUser?.roleTitle}</strong>
          </div>
        </div>

        <div className="modal-body-padding" style={{ padding: "16px" }}>
          {/* =========================================================================
              TAB 1: ALL QUERIES LIST
              ========================================================================= */}
          {activeTab === "list" && (
            <div className="queries-list-wrapper">
              {queries.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                  <CheckCircle size={36} className="text-success" />
                  <h4>No Result Queries in Record</h4>
                  <p>All recorded marks are currently locked and in good standing. No edit queries have been submitted.</p>
                </div>
              ) : (
                <div className="queries-cards-container">
                  {queries.map((q) => {
                    const isPending = q.status === "PENDING";
                    const isResolved = q.status === "RESOLVED";

                    return (
                      <div
                        key={q.id}
                        className={`query-card ${isPending ? "query-pending" : isResolved ? "query-resolved" : "query-rejected"}`}
                      >
                        <div className="query-card-header">
                          <div className="query-meta-left">
                            <span className="query-id-tag">Query #{q.id.slice(-6)}</span>
                            <span className={`query-status-pill ${isPending ? "pill-pending" : isResolved ? "pill-resolved" : "pill-rejected"}`}>
                              {q.status}
                            </span>
                          </div>
                          <div className="query-date-tag">
                            <Clock size={12} /> {new Date(q.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="query-body-grid">
                          <div className="query-info-item">
                            <span className="query-label">Student:</span>
                            <span className="query-val"><strong>{q.student_name}</strong> ({q.matric_no})</span>
                          </div>
                          <div className="query-info-item">
                            <span className="query-label">Course:</span>
                            <span className="query-val"><strong>{q.course_code}</strong> — {q.course_title}</span>
                          </div>
                          <div className="query-info-item">
                            <span className="query-label">Original Score:</span>
                            <span className="query-val" style={{ textDecoration: "line-through", color: "#dc2626" }}>
                              {q.original_score} Marks
                            </span>
                          </div>
                          <div className="query-info-item">
                            <span className="query-label">Proposed Score:</span>
                            <span className="query-val" style={{ color: "#16a34a", fontWeight: "700" }}>
                              {q.proposed_score} Marks
                            </span>
                          </div>
                        </div>

                        <div className="query-reason-box">
                          <span className="query-reason-label">Supervisor Justification:</span>
                          <p>{q.reason}</p>
                          <span className="query-author">Submitted by: {q.requested_by}</span>
                          {q.attachment_data && (
                            <div className="query-attachment-row" style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                              <Paperclip size={14} color="#0284c7" />
                              <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>
                                Attachment: {q.attachment_name || "Supporting Document"}
                              </span>
                              <a
                                href={q.attachment_data}
                                download={q.attachment_name || "supporting_document"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-xs"
                                style={{ marginLeft: "auto", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Download size={12} /> View / Download
                              </a>
                            </div>
                          )}
                        </div>

                        {/* RESOLUTION DETAILS */}
                        {q.status === "RESOLVED" && (
                          <div className="query-resolution-box resolved">
                            <CheckCircle size={14} className="text-success" />
                            <div>
                              <strong>Approved Score: {q.approved_score} Marks</strong>
                              <p>{q.resolution_note}</p>
                              <span className="query-author">Authorized by: {q.resolved_by}</span>
                            </div>
                          </div>
                        )}

                        {q.status === "REJECTED" && (
                          <div className="query-resolution-box rejected">
                            <XCircle size={14} className="text-danger" />
                            <div>
                              <strong>Query Declined by HOD</strong>
                              <p>{q.resolution_note}</p>
                            </div>
                          </div>
                        )}

                        {/* HOD ACTION TRIGGER */}
                        {isHOD && isPending && (
                          <div className="query-hod-actions-bar">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setSelectedQueryToResolve(q);
                                setResolutionScore(String(q.proposed_score));
                                setResolutionNote(`Approved proposed correction of ${q.proposed_score} marks.`);
                              }}
                            >
                              Executive Review & Edit
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: SUBMIT NEW QUERY (WITH SEARCH BUTTONS FOR STUDENT & COURSE)
              ========================================================================= */}
          {activeTab === "new" && isSupervisor && (
            <form onSubmit={handleCreateSubmit} className="new-query-form">
              {/* 1. STUDENT SELECTOR VIA SEARCH BUTTON */}
              <div className="form-group">
                <label style={{ fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
                  <span>1. Student Selection *</span>
                  {selectedStudent && <span style={{ color: "#16a34a", fontSize: "11px" }}>✓ Selected</span>}
                </label>

                {!selectedStudent ? (
                  <button
                    type="button"
                    className="btn btn-secondary picker-search-trigger-btn"
                    onClick={() => {
                      setStudentSearchQuery("");
                      setIsStudentSearchOpen(true);
                    }}
                  >
                    <Search size={16} />
                    <span>Search & Select Student (Click to Open Search)</span>
                  </button>
                ) : (
                  <div className="selected-picker-card">
                    <div className="selected-picker-info">
                      <div className="picker-title">{selectedStudent.fullname}</div>
                      <div className="picker-meta">
                        Matric No: <strong>{selectedStudent.matric_no}</strong> • Program: {selectedStudent.student_type} • Batch: {selectedStudent.batch}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setStudentSearchQuery("");
                        setIsStudentSearchOpen(true);
                      }}
                    >
                      <Search size={13} /> Change Student
                    </button>
                  </div>
                )}
              </div>

              {/* 2. COURSE SELECTOR VIA SEARCH BUTTON */}
              {queryForm.student_id && (
                <div className="form-group" style={{ marginTop: "14px" }}>
                  <label style={{ fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
                    <span>2. Contested Course Result *</span>
                    {selectedCourse && <span style={{ color: "#16a34a", fontSize: "11px" }}>✓ Selected</span>}
                  </label>

                  {!selectedCourse ? (
                    <button
                      type="button"
                      className="btn btn-secondary picker-search-trigger-btn"
                      onClick={() => {
                        setCourseSearchQuery("");
                        setIsCourseSearchOpen(true);
                      }}
                    >
                      <Search size={16} />
                      <span>Search & Select Contested Course Result ({studentResultsList.length} Courses Found)</span>
                    </button>
                  ) : (
                    <div className="selected-picker-card">
                      <div className="selected-picker-info">
                        <div className="picker-title">
                          {selectedCourse.course_code} — {selectedCourse.course_title}
                        </div>
                        <div className="picker-meta">
                          Current Recorded Score: <strong style={{ color: "#b91c1c", fontSize: "13px" }}>{queryForm.current_score} Marks</strong>
                          {" "}• Credit Units: {selectedCourse.credit_units} CU
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setCourseSearchQuery("");
                          setIsCourseSearchOpen(true);
                        }}
                      >
                        <Search size={13} /> Change Course
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. SCORE INPUTS */}
              {queryForm.course_id && (
                <>
                  <div className="form-row-2" style={{ marginTop: "14px" }}>
                    <div className="form-group">
                      <label>Current Recorded Score (Locked)</label>
                      <input
                        type="text"
                        value={`${queryForm.current_score} Marks`}
                        readOnly
                        style={{ background: "#f1f5f9", fontWeight: "700", color: "#b91c1c" }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Proposed Corrected Score (0 - 100) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g. 65"
                        value={queryForm.proposed_score}
                        onChange={(e) => setQueryForm({ ...queryForm, proposed_score: e.target.value })}
                        required
                        style={{ fontWeight: "700", color: "#16a34a" }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Official Reason / Remarking Justification *</label>
                    <textarea
                      rows={3}
                      placeholder="Enter official justification (e.g. 'Script remarked per departmental petition; student was under-graded by 15 marks in Section B')."
                      value={queryForm.reason}
                      onChange={(e) => setQueryForm({ ...queryForm, reason: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "14px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700" }}>
                      <Paperclip size={14} color="#0284c7" />
                      <span>Attach Supporting Document (Optional: Exam Script Scan, Broadsheet Excerpt, Petition PDF / Image)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleAttachmentChange}
                      style={{ marginTop: "6px", fontSize: "13px" }}
                    />
                    {queryForm.attachment_name && (
                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          padding: "6px 12px",
                          borderRadius: "6px",
                        }}
                      >
                        <FileText size={16} color="#059669" />
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#065f46" }}>
                          {queryForm.attachment_name}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          style={{
                            marginLeft: "auto",
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                          title="Remove attached file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveTab("list")}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Send size={14} /> Submit Query to HOD
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* =========================================================================
              TAB 3: EXECUTIVE AUDIT TRAIL FOR HOD
              ========================================================================= */}
          {activeTab === "audit" && (
            <div className="audit-trail-view">
              <div className="audit-header-controls">
                <div className="audit-search-bar">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search audit trail by student matric, name, course code, remark..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                  />
                  {auditSearchQuery && (
                    <button className="search-clear" onClick={() => setAuditSearchQuery("")}>
                      ✕
                    </button>
                  )}
                </div>

                <div className="audit-filter-actions">
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="audit-filter-select"
                  >
                    <option value="ALL">All Event Types</option>
                    <option value="SCORE_AMENDMENT_APPROVED">Score Amendments Approved</option>
                    <option value="SCORE_QUERY_REJECTED">Queries Rejected</option>
                    <option value="SCORE_QUERY_SUBMITTED">Queries Logged</option>
                    <option value="RESULTS_BATCH_LOCKED">Marks Locked</option>
                  </select>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => window.print()}
                    title="Print Official Departmental Audit Log"
                  >
                    <Printer size={13} /> Print Audit Report
                  </button>
                </div>
              </div>

              {/* AUDIT SUMMARY KPI TILES */}
              <div className="audit-summary-kpis">
                <div className="audit-kpi-card">
                  <span className="audit-kpi-title">TOTAL AUDIT EVENTS</span>
                  <span className="audit-kpi-value">{auditLogs.length}</span>
                </div>
                <div className="audit-kpi-card text-success">
                  <span className="audit-kpi-title">RATIFIED AMENDMENTS</span>
                  <span className="audit-kpi-value">
                    {auditLogs.filter((l) => l.action === "SCORE_AMENDMENT_APPROVED").length}
                  </span>
                </div>
                <div className="audit-kpi-card text-danger">
                  <span className="audit-kpi-title">DECLINED QUERIES</span>
                  <span className="audit-kpi-value">
                    {auditLogs.filter((l) => l.action === "SCORE_QUERY_REJECTED").length}
                  </span>
                </div>
                <div className="audit-kpi-card">
                  <span className="audit-kpi-title">MARKS BATCHES LOCKED</span>
                  <span className="audit-kpi-value">
                    {auditLogs.filter((l) => l.action === "RESULTS_BATCH_LOCKED").length}
                  </span>
                </div>
              </div>

              {/* AUDIT LOG TABLE */}
              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th style={{ width: "135px" }}>Date & Time</th>
                      <th style={{ width: "160px" }}>Event Classification</th>
                      <th style={{ width: "180px" }}>Student</th>
                      <th style={{ width: "120px" }}>Course</th>
                      <th style={{ width: "130px", textAlign: "center" }}>Score Change</th>
                      <th style={{ width: "170px" }}>Requested By</th>
                      <th>Resolution Note & Justification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">
                          <History size={32} className="muted-icon" style={{ margin: "14px auto 6px", display: "block" }} />
                          <p style={{ textAlign: "center", color: "#64748b" }}>
                            {auditSearchQuery
                              ? `No audit trail entries matching "${auditSearchQuery}".`
                              : "No audit log entries recorded yet. Any score amendment or query decision will be permanently traced here."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => {
                        const isApproved = log.action === "SCORE_AMENDMENT_APPROVED";
                        const isRejected = log.action === "SCORE_QUERY_REJECTED";
                        const isLocked = log.action === "RESULTS_BATCH_LOCKED";

                        return (
                          <tr key={log.id}>
                            <td className="audit-date-cell">
                              <Clock size={11} /> {new Date(log.timestamp).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td>
                              <span
                                className={`audit-badge ${
                                  isApproved
                                    ? "audit-badge-approved"
                                    : isRejected
                                    ? "audit-badge-rejected"
                                    : isLocked
                                    ? "audit-badge-locked"
                                    : "audit-badge-query"
                                }`}
                              >
                                {isApproved
                                  ? "Score Amendment"
                                  : isRejected
                                  ? "Query Rejected"
                                  : isLocked
                                  ? "Marks Locked"
                                  : "Query Submitted"}
                              </span>
                            </td>
                            <td>
                              {log.student_name ? (
                                <div className="audit-student-cell">
                                  <strong>{log.student_name}</strong>
                                  <span className="audit-subtext">{log.matric_no}</span>
                                </div>
                              ) : (
                                <span className="audit-subtext">Departmental Batch</span>
                              )}
                            </td>
                            <td>
                              {log.course_code ? (
                                <span className="audit-course-pill">{log.course_code}</span>
                              ) : (
                                <span className="audit-subtext">Level {log.level || "Curriculum"}</span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {log.approved_score !== undefined ? (
                                <div className="audit-score-delta">
                                  <span style={{ textDecoration: "line-through", color: "#dc2626", marginRight: "4px" }}>
                                    {log.original_score}
                                  </span>
                                  ➔
                                  <span style={{ color: "#16a34a", fontWeight: "800", marginLeft: "4px" }}>
                                    {log.approved_score}
                                  </span>
                                  {log.score_delta !== undefined && (
                                    <span className="delta-tag">
                                      ({log.score_delta > 0 ? `+${log.score_delta}` : log.score_delta})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="audit-subtext">-</span>
                              )}
                            </td>
                            <td>
                              <div className="audit-officer-cell">
                                <strong>{log.requested_by || "Exam Officer"}</strong>
                              </div>
                            </td>
                            <td>
                              <div className="audit-note-cell">
                                <p className="audit-resolution-p">{log.resolution_note || log.title}</p>
                                {log.justification && (
                                  <span className="audit-justification-span">
                                    Justification: {log.justification}
                                  </span>
                                )}
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
          )}

          {/* =========================================================================
              TAB 4: HEAD EXAM OFFICER PASSWORD RESET ENDORSEMENTS
              ========================================================================= */}
          {activeTab === "supervisor_resets" && isSupervisor && (
            <div className="security-accounts-wrapper">
              <div className="security-header-banner supervisor-banner">
                <div className="security-banner-text">
                  <h4>Head Examination Officer • Password Reset Endorsement Station</h4>
                  <p>
                    As Head Examination Officer, you are the first-tier security clearance authority.
                    Verify the identity of level exam officers requesting password resets and endorse their request.
                    Once endorsed, the request is forwarded to the <strong>Head of Department (HOD)</strong> for final authorization and execution.
                  </p>
                </div>
                <div className="security-banner-stats">
                  <div className="sec-stat-pill">
                    <span className="sec-stat-num" style={{ color: pendingSupervisorReqs.length > 0 ? "#ef4444" : "#10b981" }}>
                      {pendingSupervisorReqs.length}
                    </span>
                    <span className="sec-stat-lbl">Pending Endorsement</span>
                  </div>
                </div>
              </div>

              {officerResetSuccess && (
                <div className="pwd-success-alert" style={{ marginBottom: "16px" }}>
                  <CheckCircle size={16} />
                  <span>{officerResetSuccess}</span>
                  <button
                    type="button"
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#6ee7b7", cursor: "pointer" }}
                    onClick={() => setOfficerResetSuccess("")}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="supervisor-reqs-section">
                <h5 style={{ color: "#ffffff", fontSize: "14px", margin: "0 0 12px 0", fontWeight: "700" }}>
                  Awaiting Your Clearance ({pendingSupervisorReqs.length})
                </h5>

                {pendingSupervisorReqs.length === 0 ? (
                  <div className="empty-state" style={{ padding: "30px", background: "rgba(15,23,42,0.4)", borderRadius: "8px" }}>
                    <CheckCircle size={32} className="text-success" />
                    <h4>All Clear — No Pending Reset Requests</h4>
                    <p>There are no level officers currently awaiting password reset endorsement in your division.</p>
                  </div>
                ) : (
                  <div className="queries-cards-container">
                    {pendingSupervisorReqs.map((req) => (
                      <div key={req.id} className="query-card query-pending">
                        <div className="query-card-header">
                          <div className="query-meta-left">
                            <span className="query-id-tag">Request #{req.id.slice(-6)}</span>
                            <span className="query-status-pill pill-pending">
                              Awaiting Head Exam Officer Approval
                            </span>
                          </div>
                          <div className="query-date-tag">
                            <Clock size={12} /> {new Date(req.requestedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="query-body-grid">
                          <div className="query-info-item">
                            <span className="query-label">Officer Role:</span>
                            <span className="query-val"><strong>{req.roleTitle}</strong> (Level {req.level})</span>
                          </div>
                          <div className="query-info-item">
                            <span className="query-label">Username:</span>
                            <span className="query-val"><code style={{ color: "#38bdf8" }}>{req.username}</code></span>
                          </div>
                          <div className="query-info-item" style={{ gridColumn: "1 / -1" }}>
                            <span className="query-label">Stated Reason:</span>
                            <span className="query-val">{req.reason || "Forgot password assistance"}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: "600" }}>
                            Head Exam Officer Endorsement Note:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Identity verified by phone. Recommended for HOD reset."
                            value={endorsementNotes[req.id] || ""}
                            onChange={(e) =>
                              setEndorsementNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            style={{
                              background: "rgba(15,23,42,0.8)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: "6px",
                              padding: "8px 12px",
                              color: "#ffffff",
                              fontSize: "12px",
                            }}
                          />
                        </div>

                        <div className="query-card-actions" style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSupervisorReject(req, endorsementNotes[req.id])}
                          >
                            <X size={13} />
                            <span>Decline</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ background: "#10b981", borderColor: "#059669" }}
                            onClick={() => handleSupervisorApprove(req)}
                          >
                            <Check size={13} />
                            <span>Approve & Forward to HOD</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 5: HOD OFFICER ACCOUNTS & SECURITY (PASSWORD RESET)
              ========================================================================= */}
          {activeTab === "security" && isHOD && (
            <div className="security-accounts-wrapper">
              <div className="security-header-banner">
                <div className="security-banner-text">
                  <h4>Departmental Officer Accounts & Security Governance</h4>
                  <p>
                    Review examination officers for {currentUser?.department || "the department"} ({currentUser?.program || "Full-Time"}).
                    <strong style={{ color: "#fbbf24", marginLeft: "4px" }}>
                      Institutional Policy: The Head Examination Officer must endorse a level officer's reset request before the HOD is able to authorize it.
                    </strong>
                  </p>
                </div>
                <div className="security-banner-stats">
                  <div className="sec-stat-pill">
                    <span className="sec-stat-num">{officerSecurityList.length}</span>
                    <span className="sec-stat-lbl">Authorized Officers</span>
                  </div>
                  <div className="sec-stat-pill">
                    <span className="sec-stat-num" style={{ color: "#10b981" }}>
                      {approvedForHODReqs.length}
                    </span>
                    <span className="sec-stat-lbl">Ready for HOD Reset</span>
                  </div>
                </div>
              </div>

              {officerResetSuccess && (
                <div className="pwd-success-alert" style={{ marginBottom: "16px" }}>
                  <CheckCircle size={16} />
                  <span>{officerResetSuccess}</span>
                  <button
                    type="button"
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#6ee7b7", cursor: "pointer" }}
                    onClick={() => setOfficerResetSuccess("")}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="security-filter-bar">
                <div className="search-bar" style={{ maxWidth: "340px" }}>
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search officer by role, level or username..."
                    value={officerSearch}
                    onChange={(e) => setOfficerSearch(e.target.value)}
                  />
                  {officerSearch && (
                    <button className="search-clear" onClick={() => setOfficerSearch("")}>
                      ✕
                    </button>
                  )}
                </div>
                <div className="sec-hint">
                  <KeyRound size={13} />
                  <span>Dual clearance required: Head Exam Officer endorsement ➔ HOD executive execution.</span>
                </div>
              </div>

              <div className="officers-security-table-wrap">
                <table className="audit-table security-officers-table">
                  <thead>
                    <tr>
                      <th style={{ width: "210px" }}>Designated Role</th>
                      <th style={{ width: "90px" }}>Level</th>
                      <th style={{ width: "100px" }}>Program</th>
                      <th style={{ width: "120px" }}>Username</th>
                      <th style={{ width: "160px" }}>Password Status</th>
                      <th style={{ width: "200px" }}>Head Officer Clearance</th>
                      <th style={{ textAlign: "right", width: "180px" }}>HOD Executive Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">
                          <p style={{ textAlign: "center", color: "#64748b" }}>
                            No officer accounts found matching "{officerSearch}".
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredOfficers.map((u) => {
                        const isSelf = u.username.toLowerCase() === currentUser?.username.toLowerCase();
                        const isHeadOfficerSelf =
                          u.role === ROLES.SUPERVISING ||
                          u.role === ROLES.SUPER_FT ||
                          u.role === ROLES.SUPER_PT;
                        const req = u.activeResetRequest;
                        const isEndorsedByHeadOfficer = req?.status === "APPROVED_BY_HEAD_OFFICER";
                        const isPendingHeadOfficer = req?.status === "PENDING_HEAD_OFFICER";

                        return (
                          <tr key={u.username} className={isSelf ? "self-row" : ""}>
                            <td>
                              <div className="officer-tbl-role">
                                <strong>{u.roleTitle}</strong>
                                {isSelf && <span className="self-tag">(You)</span>}
                              </div>
                            </td>
                            <td>
                              <span className="officer-level-chip">Level {u.level}</span>
                            </td>
                            <td>
                              <span className={`program-pill ${u.program === "Part-Time" ? "pill-part-time" : "pill-full-time"}`}>
                                {u.program || "Full-Time"}
                              </span>
                            </td>
                            <td>
                              <code className="officer-user-code">{u.username}</code>
                            </td>
                            <td>
                              {u.hasChangedPassword ? (
                                <span className="sec-status-badge status-active">
                                  <CheckCircle size={12} />
                                  <span>Custom Password</span>
                                </span>
                              ) : (
                                <span className="sec-status-badge status-default">
                                  <AlertTriangle size={12} />
                                  <span>Default (password123)</span>
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="sec-activity-info">
                                {isHeadOfficerSelf ? (
                                  <span style={{ color: "#38bdf8", fontWeight: "600" }}>Direct HOD Jurisdiction</span>
                                ) : isEndorsedByHeadOfficer ? (
                                  <span style={{ color: "#10b981", fontWeight: "700" }}>
                                    ✓ Endorsed by Head Exam Officer
                                  </span>
                                ) : isPendingHeadOfficer ? (
                                  <span style={{ color: "#f59e0b", fontWeight: "600" }}>
                                    ⏳ Awaiting Head Exam Officer
                                  </span>
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>No Active Request</span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {isHeadOfficerSelf ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setConfirmOfficerToReset({ officer: u, req: null })}
                                  title="Reset Head Examination Officer password directly"
                                >
                                  <RotateCcw size={12} />
                                  <span>Reset Head Officer</span>
                                </button>
                              ) : isEndorsedByHeadOfficer ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  style={{ background: "#10b981", borderColor: "#059669" }}
                                  onClick={() => setConfirmOfficerToReset({ officer: u, req })}
                                  title="Clearance verified! Authorize and execute password reset to password123"
                                >
                                  <CheckCircle size={13} />
                                  <span>Authorize & Reset</span>
                                </button>
                              ) : isPendingHeadOfficer ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  disabled
                                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                                  title="The Head Examination Officer must approve this request before the HOD is able to reset."
                                >
                                  <Clock size={12} />
                                  <span>Pending Head Officer</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleInitiateRequest(u)}
                                  title="Route reset request to Head Examination Officer for security verification"
                                >
                                  <Send size={12} />
                                  <span>Route to Head Officer</span>
                                </button>
                              )}
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

          {/* CONFIRMATION POPUP FOR HOD AUTHORIZATION */}
          {confirmOfficerToReset && (
            <div className="modal-overlay" style={{ zIndex: 1200 }}>
              <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
                <div className="modal-header">
                  <div className="modal-title-group">
                    <ShieldAlert size={18} color="#10b981" />
                    <h3 style={{ color: "#ffffff" }}>Authorize Password Reset</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setConfirmOfficerToReset(null)}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ padding: "20px" }}>
                  <p style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.5", margin: "0 0 14px 0" }}>
                    Executive Authorization for:
                  </p>
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                    <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "14px" }}>
                      {confirmOfficerToReset.officer.roleTitle}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                      Username: <code style={{ color: "#38bdf8" }}>{confirmOfficerToReset.officer.username}</code> • Level: {confirmOfficerToReset.officer.level}
                    </div>
                    {confirmOfficerToReset.req?.headOfficerApproval && (
                      <div style={{ fontSize: "11px", color: "#10b981", marginTop: "6px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px" }}>
                        ✓ Endorsed by: <strong>{confirmOfficerToReset.req.headOfficerApproval.approvedBy}</strong>
                        {confirmOfficerToReset.req.headOfficerApproval.note && (
                          <div style={{ fontStyle: "italic", color: "#cbd5e1", marginTop: "2px" }}>
                            "{confirmOfficerToReset.req.headOfficerApproval.note}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "#f59e0b", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                    ⚠️ Resetting will restore password to <strong><code>password123</code></strong> and mandate a new password change upon their next sign-in.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setConfirmOfficerToReset(null)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ background: "#10b981", borderColor: "#059669" }}
                      onClick={() => handleHODExecuteReset(confirmOfficerToReset.officer, confirmOfficerToReset.req)}
                    >
                      <CheckCircle size={14} />
                      <span>Authorize & Reset to password123</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              HOD RESOLUTION POPUP OVERLAY
              ========================================================================= */}
          {selectedQueryToResolve && (
            <div className="hod-resolution-modal-overlay">
              <div className="hod-resolution-card">
                <div className="hod-resolution-header">
                  <h4>HOD Executive Decision on Query #{selectedQueryToResolve.id.slice(-6)}</h4>
                  <button className="modal-close-btn" onClick={() => setSelectedQueryToResolve(null)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="hod-resolution-body">
                  <div className="hod-info-summary">
                    <p><strong>Student:</strong> {selectedQueryToResolve.student_name} ({selectedQueryToResolve.matric_no})</p>
                    <p><strong>Course:</strong> {selectedQueryToResolve.course_code} — {selectedQueryToResolve.course_title}</p>
                    <p><strong>Current Recorded Mark:</strong> <span style={{ color: "#dc2626", fontWeight: "700" }}>{selectedQueryToResolve.original_score} Marks</span></p>
                    <p><strong>Proposed Mark:</strong> <span style={{ color: "#16a34a", fontWeight: "700" }}>{selectedQueryToResolve.proposed_score} Marks</span></p>
                    <p><strong>Supervisor Justification:</strong> {selectedQueryToResolve.reason}</p>
                    <p><strong>Requested By:</strong> {selectedQueryToResolve.requested_by}</p>
                    {selectedQueryToResolve.attachment_data && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 14px",
                          background: "#f0f9ff",
                          border: "1px solid #bae6fd",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0369a1", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Paperclip size={15} /> Attached Document: {selectedQueryToResolve.attachment_name || "Supporting Document"}
                          </span>
                          <a
                            href={selectedQueryToResolve.attachment_data}
                            download={selectedQueryToResolve.attachment_name || "supporting_document"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-xs"
                            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Download size={12} /> Preview / Download Attachment
                          </a>
                        </div>
                        {selectedQueryToResolve.attachment_type?.startsWith("image/") && (
                          <div style={{ marginTop: "10px", maxHeight: "250px", overflow: "hidden", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                            <img
                              src={selectedQueryToResolve.attachment_data}
                              alt="Attached Script / Broadsheet"
                              style={{ width: "100%", maxHeight: "250px", objectFit: "contain", background: "#f8fafc" }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Approved Score to Save to Database (0 - 100):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={resolutionScore}
                      onChange={(e) => setResolutionScore(e.target.value)}
                      style={{ fontWeight: "700", fontSize: "15px" }}
                    />
                  </div>

                  <div className="form-group">
                    <label>HOD Approval / Executive Note:</label>
                    <input
                      type="text"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="e.g. Approved and ratified by HOD per departmental investigation."
                    />
                  </div>

                  <div className="hod-action-buttons">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const note = prompt("Please provide official reason for rejecting this query:");
                        if (note) handleRejectSubmit({ ...selectedQueryToResolve, rejectionNote: note });
                      }}
                      style={{ color: "#dc2626" }}
                    >
                      Reject Query
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResolveSubmit(selectedQueryToResolve)}
                    >
                      <CheckCircle size={14} /> Approve & Update Database Score
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* =========================================================================
          STUDENT SEARCH MODAL DRAWER
          ========================================================================= */}
      {isStudentSearchOpen && (
        <div className="search-picker-overlay" onClick={() => setIsStudentSearchOpen(false)}>
          <div className="search-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-picker-header">
              <div className="search-picker-title">
                <User size={16} />
                <span>Search & Select Student</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsStudentSearchOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="search-picker-input-wrap">
              <Search size={15} />
              <input
                type="text"
                autoFocus
                placeholder="Type matric number or student name..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
              />
              {studentSearchQuery && (
                <button className="search-clear" onClick={() => setStudentSearchQuery("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="search-picker-results-list">
              {filteredStudentsForSearch.length === 0 ? (
                <div className="picker-empty-state">
                  <p>No students found matching "{studentSearchQuery}".</p>
                </div>
              ) : (
                filteredStudentsForSearch.map((student) => (
                  <div
                    key={student.id}
                    className="picker-result-row"
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div className="picker-row-main">
                      <strong>{student.fullname}</strong>
                      <span className="picker-row-sub">
                        Matric: <strong>{student.matric_no}</strong> • Batch: {student.batch || "U2022"}
                      </span>
                    </div>
                    <div className="picker-row-right">
                      <span className={`program-pill ${student.student_type === "Part-Time" ? "pill-part-time" : "pill-full-time"}`}>
                        {student.student_type || "Full-Time"}
                      </span>
                      <button type="button" className="btn btn-primary btn-xs select-row-btn">
                        Select
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COURSE SEARCH MODAL DRAWER
          ========================================================================= */}
      {isCourseSearchOpen && (
        <div className="search-picker-overlay" onClick={() => setIsCourseSearchOpen(false)}>
          <div className="search-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-picker-header">
              <div className="search-picker-title">
                <BookOpen size={16} />
                <span>Search Contested Course Result for {selectedStudent?.fullname}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsCourseSearchOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="search-picker-input-wrap">
              <Search size={15} />
              <input
                type="text"
                autoFocus
                placeholder="Type course code (e.g. MGT 211, GES 100) or title..."
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
              />
              {courseSearchQuery && (
                <button className="search-clear" onClick={() => setCourseSearchQuery("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="search-picker-results-list">
              {filteredCoursesForSearch.length === 0 ? (
                <div className="picker-empty-state">
                  <p>
                    {studentResultsList.length === 0
                      ? "No recorded results found for this student yet."
                      : `No course results matching "${courseSearchQuery}".`}
                  </p>
                </div>
              ) : (
                filteredCoursesForSearch.map(({ result, course }) => (
                  <div
                    key={result.id}
                    className="picker-result-row"
                    onClick={() => handleSelectCourse({ result, course })}
                  >
                    <div className="picker-row-main">
                      <strong>{course.course_code}</strong> — {course.course_title}
                      <span className="picker-row-sub">
                        Level {result.level || course.level} • {result.semester || course.semester} Semester • {course.credit_units} CU
                      </span>
                    </div>
                    <div className="picker-row-right">
                      <span className="picker-score-pill">
                        Score: <strong>{result.score}</strong> ({result.grade || "F"})
                      </span>
                      <button type="button" className="btn btn-primary btn-xs select-row-btn">
                        Select
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
