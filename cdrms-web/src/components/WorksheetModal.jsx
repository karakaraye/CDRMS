import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FileSpreadsheet,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Info,
  Lock,
  HelpCircle,
  ShieldAlert
} from "lucide-react";
import { scoreToGrade, canWaiveCourse, calculateStudentMetrics } from "../services/grading";
import { ROLES } from "../services/auth";
import { getSessionForLevel, getStudentSessionOptions } from "../services/session";
import { db } from "../services/db";

export default function WorksheetModal({
  isOpen,
  onClose,
  students,
  courses,
  results,
  initialStudentId,
  onSaveResults,
  currentUser,
  onOpenQueryModal,
  onOpenExcelUpload,
}) {
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Determine initial level based on user role
  const initialLevel = useMemo(() => {
    if (!currentUser) return "100";
    if (currentUser.role === ROLES.OFFICER_100) return "100";
    if (currentUser.role === ROLES.OFFICER_200) return "200";
    if (currentUser.role === ROLES.OFFICER_300) return "300";
    if (currentUser.role === ROLES.OFFICER_400) return "400";
    if (currentUser.role === ROLES.SUPER_FT || currentUser.role === ROLES.SUPER_PT) return "500";
    return "100";
  }, [currentUser]);

  const [level, setLevel] = useState(initialLevel);
  const [session, setSession] = useState("2022/2023");
  const [semester, setSemester] = useState("First");

  // Synchronize level with user role on mount or user change
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === ROLES.OFFICER_100) setLevel("100");
      else if (currentUser.role === ROLES.OFFICER_200) setLevel("200");
      else if (currentUser.role === ROLES.OFFICER_300) setLevel("300");
      else if (currentUser.role === ROLES.OFFICER_400) setLevel("400");
    }
  }, [currentUser, isOpen]);

  // Standard courses entries: { [courseId]: { score, is_carryover, is_waived, waiver_grade, remark, id, is_locked } }
  const [standardEntries, setStandardEntries] = useState({});

  // Extra / Selectable courses for 200L-400L (extra) or 500L-600L (up to 10 max)
  const [extraEntries, setExtraEntries] = useState([]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(String(initialStudentId));
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(String(students[0].id));
    }
  }, [initialStudentId, students]);

  const activeStudent = students.find((s) => String(s.id) === String(selectedStudentId));
  const studentProgram = activeStudent?.student_type || "Full-Time";

  // Official session calculation based on entry year:
  // e.g. Entry 2022 -> 100L: 2022/2023, 200L: 2023/2024, 300L: 2024/2025, 400L: 2025/2026, 500L: 2026/2027, 600L: 2027/2028
  const officialSessionForLevel = useMemo(() => {
    return getSessionForLevel(activeStudent, level);
  }, [activeStudent, level]);

  const sessionOptions = useMemo(() => {
    return getStudentSessionOptions(activeStudent, level).options;
  }, [activeStudent, level]);

  // Synchronize session automatically whenever the active student or level changes
  useEffect(() => {
    if (activeStudent) {
      setSession(officialSessionForLevel);
    }
  }, [activeStudent, level, officialSessionForLevel]);

  const isExtraYear = level === "500" || level === "600";
  const allowsExtraCourses = level === "200" || level === "300" || level === "400";
  const MAX_COURSES_EXTRA_YEAR = 10;

  const studentDept = activeStudent?.department || "Department of Management";

  const matchesStudentDept = (courseDept, studDept) => {
    const s = (studDept || "").toLowerCase();
    const c = (courseDept || "").toLowerCase();
    if (s.includes("project")) {
      return c.includes("project");
    }
    if (s.includes("employee") || s.includes("erhrm") || s.includes("human resource")) {
      return c.includes("employee") || c.includes("erhrm") || c.includes("human resource");
    }
    if (s.includes("innovation") || s.includes("entrepreneurship") || s.includes("iem")) {
      return c.includes("innovation") || c.includes("entrepreneurship") || c.includes("iem");
    }
    if (s.includes("procurement") || s.includes("prm")) {
      return c.includes("procurement") || c.includes("prm");
    }
    return !c.includes("project") && !c.includes("employee") && !c.includes("human resource") && !c.includes("innovation") && !c.includes("procurement");
  };

  // Fallback to live db catalogue if passed courses prop is stale
  const allCourses = useMemo(() => {
    const list = courses && courses.length > 0 ? courses : [];
    if (
      list.some((c) => (c.department || "").toLowerCase().includes("project")) &&
      list.some((c) => (c.department || "").toLowerCase().includes("employee")) &&
      list.some((c) => (c.department || "").toLowerCase().includes("innovation")) &&
      list.some((c) => (c.department || "").toLowerCase().includes("procurement"))
    ) {
      return list;
    }
    return db.getCourses();
  }, [courses]);

  // Catalogue options lookup
  const courseOptions = useMemo(() => {
    return allCourses
      .filter((c) => {
        const progMatch = (c.program || "Full-Time") === studentProgram;
        const cDept = c.department || "Department of Management";
        const deptMatch = matchesStudentDept(cDept, studentDept);
        return progMatch && deptMatch;
      })
      .map((c) => ({
        id: String(c.id),
        code: c.course_code,
        title: c.course_title,
        cu: Number(c.credit_units || 2),
        level: c.level,
        semester: c.semester,
        displayText: `${c.course_code} — ${c.course_title} (${c.credit_units} CU) [${c.level}L ${c.semester}]`,
      }));
  }, [allCourses, studentProgram, studentDept]);

  // Standard curriculum courses for 100L-400L
  const standardCurriculumCourses = useMemo(() => {
    if (isExtraYear) return [];
    return allCourses.filter((c) => {
      const progMatch = (c.program || "Full-Time") === studentProgram;
      const levelMatch = String(c.level) === String(level);
      const semMatch = c.semester === semester;
      const cDept = c.department || "Department of Management";
      const deptMatch = matchesStudentDept(cDept, studentDept);
      return progMatch && levelMatch && semMatch && deptMatch;
    });
  }, [allCourses, studentProgram, level, semester, isExtraYear, studentDept]);

  // Load results from storage
  useEffect(() => {
    if (!selectedStudentId) return;

    const currentResults = results.filter(
      (r) =>
        (String(r.student_id) === String(selectedStudentId) ||
          (student?.matric_no && String(r.student_id) === String(student.matric_no)) ||
          (student?.matric_no && r.matric_no && String(r.matric_no) === String(student.matric_no))) &&
        (r.session === session || (!r.session && String(r.level) === String(level))) &&
        r.semester === semester &&
        (String(r.level) === String(level) || (!r.level && !isExtraYear))
    );

    // 1. Populate standard curriculum courses
    const stdMap = {};
    const stdCourseIdSet = new Set();

    standardCurriculumCourses.forEach((c) => {
      stdCourseIdSet.add(String(c.id));
      const existing = currentResults.find(
        (r) =>
          String(r.course_id) === String(c.id) ||
          (c.course_code &&
            r.course_code &&
            r.course_code.trim().toUpperCase() === c.course_code.trim().toUpperCase())
      );
      if (existing) {
        stdMap[c.id] = {
          id: existing.id,
          score: existing.score !== undefined ? String(existing.score) : "",
          is_carryover: Boolean(existing.is_carryover),
          is_waived: Boolean(existing.is_waived),
          waiver_grade: existing.waiver_grade || "",
          remark: existing.remark || "",
          is_locked: existing.score !== "" && existing.score !== undefined,
        };
      } else {
        stdMap[c.id] = {
          score: "",
          is_carryover: false,
          is_waived: false,
          waiver_grade: "",
          remark: "",
          is_locked: false,
        };
      }
    });
    setStandardEntries(stdMap);

    // 2. Populate extra / elective / carryover courses
    const extras = [];
    currentResults.forEach((r) => {
      if (isExtraYear || !stdCourseIdSet.has(String(r.course_id))) {
        extras.push({
          slotId: `slot_${r.id || Date.now()}_${Math.random()}`,
          courseId: String(r.course_id),
          score: r.score !== undefined ? String(r.score) : "",
          is_carryover: Boolean(r.is_carryover),
          is_waived: Boolean(r.is_waived),
          waiver_grade: r.waiver_grade || "",
          remark: r.remark || "",
          id: r.id,
          is_locked: r.score !== "" && r.score !== undefined,
        });
      }
    });

    if (isExtraYear && extras.length === 0) {
      extras.push({
        slotId: `slot_init_1`,
        courseId: "",
        score: "",
        is_carryover: true,
        is_waived: false,
        waiver_grade: "",
        remark: "",
        is_locked: false,
      });
      extras.push({
        slotId: `slot_init_2`,
        courseId: "",
        score: "",
        is_carryover: true,
        is_waived: false,
        waiver_grade: "",
        remark: "",
        is_locked: false,
      });
    }

    setExtraEntries(extras);
    setSaveSuccess(false);
    setErrorMessage("");
  }, [selectedStudentId, level, session, semester, standardCurriculumCourses, results, isExtraYear]);

  if (!isOpen) return null;

  // Permission logic
  const isLevelOfficer =
    currentUser?.role === ROLES.OFFICER_100 ||
    currentUser?.role === ROLES.OFFICER_200 ||
    currentUser?.role === ROLES.OFFICER_300 ||
    currentUser?.role === ROLES.OFFICER_400;

  const isSupervisor =
    currentUser?.role === ROLES.SUPER_FT || currentUser?.role === ROLES.SUPER_PT;

  const isHOD = currentUser?.role === ROLES.HOD;

  // Level officers can only edit if not already locked
  // Supervising officers can only enter scores for 500 & 600 in their program
  // HOD cannot routinely edit scores
  const canEditEntry = (entry) => {
    if (isHOD) return false;
    if (isSupervisor) {
      // Supervisor can edit 500L & 600L for their assigned program
      const progMatch =
        currentUser.program === "All" || studentProgram === currentUser.program;
      return isExtraYear && progMatch;
    }
    if (isLevelOfficer) {
      // Level officer can enter scores if not already locked
      return !entry?.is_locked;
    }
    return true;
  };

  // Handlers for Standard Courses
  const handleStandardScoreChange = (courseId, value) => {
    if (!canEditEntry(standardEntries[courseId])) return;
    setStandardEntries((prev) => ({
      ...prev,
      [courseId]: { ...prev[courseId], score: value },
    }));
  };

  const handleStandardCheckChange = (courseId, field, checked) => {
    if (!canEditEntry(standardEntries[courseId])) return;
    if (field === "is_waived" && checked) {
      const course = courses.find((c) => String(c.id) === String(courseId));
      const studentResults = results.filter((r) => String(r.student_id) === String(selectedStudentId));
      const entry = standardEntries[courseId];
      const check = canWaiveCourse(course, studentResults, entry?.id);
      if (!check.allowed) {
        setErrorMessage(check.reason);
        return;
      }
      setErrorMessage("");
      setStandardEntries((prev) => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          is_waived: true,
          is_carryover: false,
          waiver_grade: "W",
        },
      }));
      return;
    }

    setStandardEntries((prev) => ({
      ...prev,
      [courseId]: { ...prev[courseId], [field]: checked },
    }));
  };

  const handleStandardRemarkChange = (courseId, value) => {
    if (!canEditEntry(standardEntries[courseId])) return;
    setStandardEntries((prev) => ({
      ...prev,
      [courseId]: { ...prev[courseId], remark: value },
    }));
  };

  // Handlers for Extra / Selectable Courses
  const handleAddExtraCourseSlot = () => {
    if (isExtraYear && extraEntries.length >= MAX_COURSES_EXTRA_YEAR) {
      setErrorMessage(`Maximum limit of ${MAX_COURSES_EXTRA_YEAR} courses per semester reached for ${level} Level.`);
      return;
    }
    setErrorMessage("");
    setExtraEntries((prev) => [
      ...prev,
      {
        slotId: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        courseId: "",
        score: "",
        is_carryover: isExtraYear,
        is_waived: false,
        waiver_grade: "",
        remark: "",
        is_locked: false,
      },
    ]);
  };

  const handleRemoveExtraSlot = (slotId) => {
    const slot = extraEntries.find((s) => s.slotId === slotId);
    if (!canEditEntry(slot)) {
      setErrorMessage("Cannot delete locked course. Submit an edit query to request removal.");
      return;
    }
    setExtraEntries((prev) => prev.filter((item) => item.slotId !== slotId));
    setErrorMessage("");
  };

  const handleExtraSlotChange = (slotId, field, value) => {
    const targetSlot = extraEntries.find((item) => item.slotId === slotId);
    if (!canEditEntry(targetSlot)) return;

    if (field === "is_waived" && value) {
      if (!targetSlot?.courseId) {
        setErrorMessage("Please select a course before marking it as waived.");
        return;
      }
      const course = courses.find((c) => String(c.id) === String(targetSlot.courseId));
      const studentResults = results.filter((r) => String(r.student_id) === String(selectedStudentId));
      const check = canWaiveCourse(course, studentResults, targetSlot.id);
      if (!check.allowed) {
        setErrorMessage(check.reason);
        return;
      }
      setErrorMessage("");
      setExtraEntries((prev) =>
        prev.map((item) => {
          if (item.slotId === slotId) {
            return { ...item, is_waived: true, is_carryover: false, waiver_grade: "W" };
          }
          return item;
        })
      );
      return;
    }

    setExtraEntries((prev) =>
      prev.map((item) => {
        if (item.slotId === slotId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Compute Live Totals
  let totalCU = 0;
  let totalQP = 0;

  // Standard courses
  standardCurriculumCourses.forEach((c) => {
    const entry = standardEntries[c.id];
    if (entry && (entry.score !== "" || entry.is_waived)) {
      const cu = Number(c.credit_units || 0);
      const isWaived = entry.is_waived;
      const scoreNum = parseFloat(entry.score);

      let gp = 0;
      if (isWaived) {
        gp = 1.0;
      } else if (!isNaN(scoreNum)) {
        gp = scoreToGrade(scoreNum, entry.is_carryover).point;
      }
      totalCU += cu;
      totalQP += cu * gp;
    }
  });

  // Extra courses
  extraEntries.forEach((item) => {
    if (item.courseId && (item.score !== "" || item.is_waived)) {
      const course = courses.find((c) => String(c.id) === String(item.courseId));
      const cu = Number(course?.credit_units || 0);
      const isWaived = item.is_waived;
      const scoreNum = parseFloat(item.score);

      let gp = 0;
      if (isWaived) {
        gp = 1.0;
      } else if (!isNaN(scoreNum)) {
        gp = scoreToGrade(scoreNum, item.is_carryover).point;
      }
      totalCU += cu;
      totalQP += cu * gp;
    }
  });

  const semesterGPA = totalCU > 0 ? (totalQP / totalCU).toFixed(2) : "0.00";

  // Live Cumulative CGPA calculation across all student results
  const cumulativeMetrics = useMemo(() => {
    if (!activeStudent) return { cgpa: "0.00", tcu: 0, tqp: 0, degreeClass: "N/A" };

    // 1. Get other historical results for this student, excluding current session & semester & level
    const otherResults = results.filter((r) => {
      const isThisStudent =
        String(r.student_id) === String(selectedStudentId) ||
        (activeStudent.matric_no && String(r.matric_no) === String(activeStudent.matric_no)) ||
        (activeStudent.matric_no && String(r.student_id) === String(activeStudent.matric_no)) ||
        (activeStudent.fullname && r.student_name && r.student_name.trim().toLowerCase() === activeStudent.fullname.trim().toLowerCase());

      if (!isThisStudent) return false;

      const isCurrentSessionSem =
        (r.session === session || (!r.session && String(r.level) === String(level))) &&
        r.semester === semester &&
        String(r.level) === String(level);

      return !isCurrentSessionSem;
    });

    // 2. Synthesize current session results from standard and extra entries
    const currentSessionResults = [];

    standardCurriculumCourses.forEach((c) => {
      const entry = standardEntries[c.id];
      if (entry && (entry.score !== "" || entry.is_waived)) {
        const scoreNum = parseFloat(entry.score) || 0;
        const isCarryover = Boolean(entry.is_carryover);
        const isWaived = Boolean(entry.is_waived);
        const { letter, point } = scoreToGrade(scoreNum, isCarryover);

        currentSessionResults.push({
          student_id: selectedStudentId,
          matric_no: activeStudent?.matric_no || null,
          student_name: activeStudent?.fullname || null,
          course_id: c.id,
          course_code: c.course_code,
          credit_units: Number(c.credit_units || 2),
          score: scoreNum,
          grade: isWaived ? (entry.waiver_grade || "W") : letter,
          grade_point: isWaived ? 1.0 : point,
          session,
          semester,
          level,
          is_carryover: isCarryover ? 1 : 0,
          is_waived: isWaived ? 1 : 0,
        });
      }
    });

    extraEntries.forEach((item) => {
      if (item.courseId && (item.score !== "" || item.is_waived)) {
        const course = courses.find((c) => String(c.id) === String(item.courseId));
        const scoreNum = parseFloat(item.score) || 0;
        const isCarryover = Boolean(item.is_carryover);
        const isWaived = Boolean(item.is_waived);
        const { letter, point } = scoreToGrade(scoreNum, isCarryover);

        currentSessionResults.push({
          student_id: selectedStudentId,
          matric_no: activeStudent?.matric_no || null,
          student_name: activeStudent?.fullname || null,
          course_id: item.courseId,
          course_code: course?.course_code,
          credit_units: Number(course?.credit_units || 2),
          score: scoreNum,
          grade: isWaived ? (item.waiver_grade || "W") : letter,
          grade_point: isWaived ? 1.0 : point,
          session,
          semester,
          level,
          is_carryover: isCarryover ? 1 : 0,
          is_waived: isWaived ? 1 : 0,
        });
      }
    });

    const merged = [...otherResults, ...currentSessionResults];
    return calculateStudentMetrics(merged, courses);
  }, [activeStudent, results, selectedStudentId, session, semester, level, standardCurriculumCourses, standardEntries, extraEntries, courses]);

  // Save All Results
  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    if (isHOD) {
      setErrorMessage("Notice: HOD role cannot modify results directly. Please use the Query Center to approve edits.");
      return;
    }

    if (isSupervisor && !isExtraYear) {
      setErrorMessage("Supervising Officers can only directly enter 500L and 600L scores. To modify 100L-400L, submit an Edit Query.");
      return;
    }

    if (isExtraYear && extraEntries.length > MAX_COURSES_EXTRA_YEAR) {
      setErrorMessage(`Cannot save: ${level} Level allows a maximum of ${MAX_COURSES_EXTRA_YEAR} courses per semester.`);
      return;
    }

    const resultsToSave = [];

    // 1. Standard Courses
    standardCurriculumCourses.forEach((c) => {
      const entry = standardEntries[c.id];
      if (entry && (entry.score !== "" || entry.is_waived)) {
        const scoreNum = parseFloat(entry.score) || 0;
        const isCarryover = Boolean(entry.is_carryover);
        const isWaived = Boolean(entry.is_waived);
        const { letter, point } = scoreToGrade(scoreNum, isCarryover);

        resultsToSave.push({
          ...(entry.id ? { id: entry.id } : {}),
          student_id: selectedStudentId,
          student_name: activeStudent?.fullname || null,
          matric_no: activeStudent?.matric_no || null,
          course_id: c.id,
          course_code: c.course_code,
          credit_units: Number(c.credit_units || 2),
          score: scoreNum,
          grade: isWaived ? (entry.waiver_grade || "W") : letter,
          grade_point: isWaived ? 1.0 : point,
          session,
          semester,
          level,
          is_carryover: isCarryover ? 1 : 0,
          is_waived: isWaived ? 1 : 0,
          waiver_grade: entry.waiver_grade || null,
          remark: entry.remark || null,
          is_locked: true, // Permanent lock once saved by Level Officer
        });
      }
    });

    // 2. Extra Courses
    for (const item of extraEntries) {
      if (item.courseId && (item.score !== "" || item.is_waived)) {
        const scoreNum = parseFloat(item.score) || 0;
        const isCarryover = Boolean(item.is_carryover);
        const isWaived = Boolean(item.is_waived);
        const { letter, point } = scoreToGrade(scoreNum, isCarryover);
        const course = courses.find((c) => String(c.id) === String(item.courseId));

        resultsToSave.push({
          ...(item.id ? { id: item.id } : {}),
          student_id: selectedStudentId,
          student_name: activeStudent?.fullname || null,
          matric_no: activeStudent?.matric_no || null,
          course_id: item.courseId,
          course_code: course?.course_code || null,
          credit_units: Number(course?.credit_units || 2),
          score: scoreNum,
          grade: isWaived ? (item.waiver_grade || "W") : letter,
          grade_point: isWaived ? 1.0 : point,
          session,
          semester,
          level,
          is_carryover: isCarryover ? 1 : 0,
          is_waived: isWaived ? 1 : 0,
          waiver_grade: item.waiver_grade || null,
          remark: item.remark || null,
          is_locked: true,
        });
      }
    }

    await onSaveResults(resultsToSave);
    setSaveSuccess(true);
    setErrorMessage("");
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <FileSpreadsheet size={18} />
            <h3>Results Worksheet & Score Entry</h3>
            {isExtraYear && (
              <span className="badge-count" style={{ background: "#fef3c7", color: "#b45309" }}>
                Extra Year Mode (Max 10 Courses)
              </span>
            )}
            {currentUser && (
              <span className="role-chip-pill" style={{ marginLeft: "8px", background: "rgba(255,255,255,0.2)", color: "#ffffff", fontSize: "11px", padding: "2px 8px", borderRadius: "12px" }}>
                {currentUser.roleTitle}
              </span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* CONTROLS BAR: STUDENT, LEVEL, SESSION, SEMESTER */}
        <div className="worksheet-filter-bar">
          <div className="filter-group student-select-group">
            <label>Student:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullname} {s.matric_no ? `(${s.matric_no})` : "(No Matric)"} — {s.student_type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={isLevelOfficer} // Level Officers can only view their designated level
              style={{ opacity: isLevelOfficer ? 0.7 : 1, cursor: isLevelOfficer ? "not-allowed" : "pointer" }}
            >
              {(!isLevelOfficer || currentUser.role === ROLES.OFFICER_100) && <option value="100">100 Level</option>}
              {(!isLevelOfficer || currentUser.role === ROLES.OFFICER_200) && <option value="200">200 Level</option>}
              {(!isLevelOfficer || currentUser.role === ROLES.OFFICER_300) && <option value="300">300 Level</option>}
              {(!isLevelOfficer || currentUser.role === ROLES.OFFICER_400) && <option value="400">400 Level</option>}
              {!isLevelOfficer && <option value="500">500 Level (Extra Year I)</option>}
              {!isLevelOfficer && <option value="600">600 Level (Extra Year II)</option>}
            </select>
          </div>

          <div className="filter-group">
            <label>
              Session:
              {activeStudent && (
                <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "700", marginLeft: "4px" }}>
                  ({level}L Official: {officialSessionForLevel})
                </span>
              )}
            </label>
            <select value={session} onChange={(e) => setSession(e.target.value)}>
              {sessionOptions.map((sOpt) => (
                <option key={sOpt} value={sOpt}>
                  {sOpt} {sOpt === officialSessionForLevel ? `★ (Official ${level}L Session)` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Semester / Term:</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="First">First Semester</option>
              <option value="Second">Second Semester</option>
              {studentProgram === "Part-Time" && <option value="Third">Third Term</option>}
            </select>
          </div>

          {onOpenExcelUpload && (
            <div className="filter-group" style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onOpenExcelUpload}
                style={{
                  height: "36px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#059669",
                  background: "#ecfdf5",
                  borderColor: "#a7f3d0",
                  cursor: "pointer",
                }}
                title="Batch process broadsheet results from Excel file"
              >
                <FileSpreadsheet size={15} />
                <span>Upload Excel Results</span>
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="modal-error-banner" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* WORKSHEET SCROLLABLE BODY */}
        <div className="modal-table-scroll">
          {/* SECTION 1: STANDARD CURRICULUM COURSES (100L-400L) */}
          {!isExtraYear && (
            <>
              <div className="worksheet-section-bar">
                <span className="worksheet-section-title">
                  STANDARD CURRICULUM COURSES ({standardCurriculumCourses.length})
                </span>
              </div>
              <table className="data-table worksheet-table">
                <thead>
                  <tr>
                    <th style={{ width: "110px" }}>Course Code</th>
                    <th>Course Title</th>
                    <th style={{ width: "50px", textAlign: "center" }}>CU</th>
                    <th style={{ width: "90px" }}>Status</th>
                    <th style={{ width: "110px", textAlign: "center" }}>Score (0-100)</th>
                    <th style={{ width: "70px", textAlign: "center" }}>Grade</th>
                    <th style={{ width: "60px", textAlign: "center" }}>GP</th>
                    <th style={{ width: "60px", textAlign: "center" }}>QP</th>
                    <th style={{ width: "70px", textAlign: "center" }}>Repeat?</th>
                    <th style={{ width: "70px", textAlign: "center" }}>Waived?</th>
                    <th style={{ width: "110px" }}>Remark</th>
                    <th style={{ width: "80px", textAlign: "center" }}>Lock / Query</th>
                  </tr>
                </thead>
                <tbody>
                  {standardCurriculumCourses.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="empty-table-cell">
                        No standard courses found for {level} Level • {semester} Semester.
                      </td>
                    </tr>
                  ) : (
                    standardCurriculumCourses.map((c) => {
                      const entry = standardEntries[c.id] || {
                        score: "",
                        is_carryover: false,
                        is_waived: false,
                        waiver_grade: "",
                        remark: "",
                        is_locked: false,
                      };

                      const cu = Number(c.credit_units || 0);
                      const scoreNum = parseFloat(entry.score);
                      const isWaived = entry.is_waived;
                      const isCarryover = entry.is_carryover;

                      let grade = "-";
                      let gp = "-";
                      let qp = "-";

                      if (isWaived) {
                        grade = entry.waiver_grade || "W";
                        gp = "1.0";
                        qp = (cu * 1.0).toFixed(1);
                      } else if (!isNaN(scoreNum) && entry.score !== "") {
                        const res = scoreToGrade(scoreNum, isCarryover);
                        grade = res.letter;
                        gp = res.point.toFixed(1);
                        qp = (cu * res.point).toFixed(1);
                      }

                      const isFail = grade === "F";
                      const isEditable = canEditEntry(entry);

                      return (
                        <tr key={c.id}>
                          <td><strong>{c.course_code}</strong></td>
                          <td>{c.course_title}</td>
                          <td style={{ textAlign: "center" }}>{cu}</td>
                          <td>
                            <span
                              className={`status-pill ${
                                c.status === "Compulsory" ? "pill-compulsory" : "pill-required"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              className={`score-input ${!isEditable ? "locked-input" : ""}`}
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="Score"
                              value={entry.score}
                              onChange={(e) => handleStandardScoreChange(c.id, e.target.value)}
                              disabled={!isEditable}
                              title={!isEditable ? "Saved score is locked under academic regulation." : "Enter score"}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`grade-tag ${isFail ? "grade-f" : grade !== "-" ? "grade-pass" : ""}`}>
                              {grade}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>{gp}</td>
                          <td style={{ textAlign: "center" }}>{qp}</td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={entry.is_carryover}
                              onChange={(e) => handleStandardCheckChange(c.id, "is_carryover", e.target.checked)}
                              disabled={!isEditable}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={entry.is_waived}
                              onChange={(e) => handleStandardCheckChange(c.id, "is_waived", e.target.checked)}
                              disabled={!isEditable}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="table-text-input"
                              placeholder="Remark"
                              value={entry.remark}
                              onChange={(e) => handleStandardRemarkChange(c.id, e.target.value)}
                              disabled={!isEditable}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {entry.is_locked ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                <span title="Score Locked by Examination Regulations" style={{ color: "#b45309" }}>
                                  <Lock size={13} />
                                </span>
                                {isSupervisor && (
                                  <button
                                    type="button"
                                    className="btn-action btn-action-edit"
                                    title="Query this score (submit edit request to HOD)"
                                    onClick={() => onOpenQueryModal && onOpenQueryModal(entry.id)}
                                  >
                                    <HelpCircle size={13} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#16a34a" }}>Open</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* SECTION 2: EXTRA COURSES (200L-400L) OR SELECTABLE COURSES (500L-600L MAX 10) */}
          {(allowsExtraCourses || isExtraYear) && (
            <div className="extra-courses-block" style={{ marginTop: isExtraYear ? 0 : "16px" }}>
              <div className="worksheet-section-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="worksheet-section-title">
                  {isExtraYear
                    ? `SELECT COURSES FOR ${level} LEVEL (${extraEntries.length} / ${MAX_COURSES_EXTRA_YEAR} MAXIMUM)`
                    : `EXTRA / ELECTIVE / CARRYOVER COURSES (${extraEntries.length})`}
                </span>
                {(isLevelOfficer || (isSupervisor && isExtraYear)) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddExtraCourseSlot}
                    disabled={isExtraYear && extraEntries.length >= MAX_COURSES_EXTRA_YEAR}
                    style={{
                      opacity: isExtraYear && extraEntries.length >= MAX_COURSES_EXTRA_YEAR ? 0.5 : 1,
                      cursor: isExtraYear && extraEntries.length >= MAX_COURSES_EXTRA_YEAR ? "not-allowed" : "pointer",
                    }}
                  >
                    <Plus size={13} /> {isExtraYear ? "Add Course Slot" : "Add Extra Course"}
                  </button>
                )}
              </div>

              {isExtraYear && (
                <div className="extra-info-banner">
                  <Info size={14} />
                  <span>
                    In <strong>{level} Level (Extra Year)</strong>, the <strong>Supervising Exam Officer</strong> registers carryover/repeat courses (<strong>up to 10 courses maximum</strong> per semester).
                  </span>
                </div>
              )}

              <table className="data-table worksheet-table">
                <thead>
                  <tr>
                    <th style={{ width: "360px" }}>Course Selection</th>
                    <th style={{ width: "45px", textAlign: "center" }}>CU</th>
                    <th style={{ width: "100px", textAlign: "center" }}>Score (0-100)</th>
                    <th style={{ width: "65px", textAlign: "center" }}>Grade</th>
                    <th style={{ width: "55px", textAlign: "center" }}>GP</th>
                    <th style={{ width: "55px", textAlign: "center" }}>QP</th>
                    <th style={{ width: "70px", textAlign: "center" }}>Repeat?</th>
                    <th style={{ width: "70px", textAlign: "center" }}>Waived?</th>
                    <th style={{ width: "110px" }}>Remark</th>
                    <th style={{ width: "80px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {extraEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="empty-table-cell">
                        {isExtraYear
                          ? "No courses added yet. Click '+ Add Course Slot' above to select up to 10 courses."
                          : "No extra courses added for this semester. Click '+ Add Extra Course' to add carryover or elective courses."}
                      </td>
                    </tr>
                  ) : (
                    extraEntries.map((item, idx) => {
                      const selectedCourse = courses.find((c) => String(c.id) === String(item.courseId));
                      const cu = Number(selectedCourse?.credit_units || 0);
                      const scoreNum = parseFloat(item.score);
                      const isWaived = item.is_waived;
                      const isCarryover = item.is_carryover;

                      let grade = "-";
                      let gp = "-";
                      let qp = "-";

                      if (isWaived) {
                        grade = item.waiver_grade || "W";
                        gp = "1.0";
                        qp = (cu * 1.0).toFixed(1);
                      } else if (!isNaN(scoreNum) && item.score !== "" && item.courseId) {
                        const res = scoreToGrade(scoreNum, isCarryover);
                        grade = res.letter;
                        gp = res.point.toFixed(1);
                        qp = (cu * res.point).toFixed(1);
                      }

                      const isFail = grade === "F";
                      const isEditable = canEditEntry(item);

                      return (
                        <tr key={item.slotId}>
                          <td>
                            <select
                              value={item.courseId}
                              onChange={(e) => handleExtraSlotChange(item.slotId, "courseId", e.target.value)}
                              disabled={!isEditable}
                              style={{ width: "100%", padding: "4px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                            >
                              <option value="">
                                {isExtraYear
                                  ? `-- Select Course ${idx + 1} (Max 10) --`
                                  : `-- Select Extra Course ${idx + 1} --`}
                              </option>
                              {courseOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.displayText}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <strong>{cu || "-"}</strong>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              className={`score-input ${!isEditable ? "locked-input" : ""}`}
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="Score"
                              value={item.score}
                              onChange={(e) => handleExtraSlotChange(item.slotId, "score", e.target.value)}
                              disabled={!item.courseId || !isEditable}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`grade-tag ${isFail ? "grade-f" : grade !== "-" ? "grade-pass" : ""}`}>
                              {grade}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>{gp}</td>
                          <td style={{ textAlign: "center" }}>{qp}</td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={item.is_carryover}
                              onChange={(e) => handleExtraSlotChange(item.slotId, "is_carryover", e.target.checked)}
                              disabled={!isEditable}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={item.is_waived}
                              onChange={(e) => handleExtraSlotChange(item.slotId, "is_waived", e.target.checked)}
                              disabled={!isEditable}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="table-text-input"
                              placeholder="Remark"
                              value={item.remark}
                              onChange={(e) => handleExtraSlotChange(item.slotId, "remark", e.target.value)}
                              disabled={!isEditable}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {item.is_locked ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                <Lock size={13} style={{ color: "#b45309" }} title="Score Locked" />
                                {isSupervisor && (
                                  <button
                                    type="button"
                                    className="btn-action btn-action-edit"
                                    title="Query this score"
                                    onClick={() => onOpenQueryModal && onOpenQueryModal(item.id)}
                                  >
                                    <HelpCircle size={13} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn-action btn-action-delete"
                                title="Remove slot"
                                onClick={() => handleRemoveExtraSlot(item.slotId)}
                              >
                                <Trash2 size={13} />
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
          )}
        </div>

        {/* LIVE SEMESTER & CUMULATIVE SUMMARY FOOTER */}
        <div className="worksheet-summary-footer">
          <div className="summary-stat-box">
            <span className="summary-stat-label">Semester CU:</span>
            <span className="summary-stat-val">{totalCU}</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-stat-label">Semester TQP:</span>
            <span className="summary-stat-val">{totalQP.toFixed(1)}</span>
          </div>
          <div className="summary-stat-box highlight-stat">
            <span className="summary-stat-label">Semester GPA:</span>
            <span className="summary-stat-val">{semesterGPA}</span>
          </div>
          <div className="summary-stat-box highlight-stat" style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid #10b981", borderRadius: "6px" }}>
            <span className="summary-stat-label" style={{ color: "#065f46", fontWeight: "700" }}>Live Cumulative CGPA:</span>
            <span className="summary-stat-val" style={{ color: "#047857", fontSize: "17px", fontWeight: "800" }}>{cumulativeMetrics.cgpa}</span>
            <span style={{ fontSize: "10px", color: "#047857", fontWeight: "600", marginLeft: "4px" }}>({cumulativeMetrics.degreeClass})</span>
          </div>

          <div className="summary-right-actions">
            {saveSuccess && (
              <span className="save-success-msg">
                <CheckCircle size={15} /> All scores & extra courses successfully saved!
              </span>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {!isHOD && (!isSupervisor || isExtraYear) && (
              <button className="btn btn-primary" onClick={handleSaveAll}>
                <Save size={15} /> Save & Lock Scores
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
