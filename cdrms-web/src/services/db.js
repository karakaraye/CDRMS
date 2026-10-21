/**
 * db.js
 * Unified data layer for CDRMS Web.
 * Works seamlessly offline/locally via LocalStorage and syncs to Supabase Cloud Database!
 */

import { ALL_INITIAL_COURSES } from "../constants/courses";
import {
  getSupabaseClient,
  saveStudentToCloud,
  deleteStudentFromCloud,
  saveCourseToCloud,
  deleteCourseFromCloud,
  saveResultToCloud,
  saveBulkResultsToCloud,
  saveQueryToCloud,
  saveAuditLogToCloud
} from "./supabase";
import { scoreToGrade } from "./grading";

const STORAGE_KEY_STUDENTS = "cdrms_students_data";
const STORAGE_KEY_COURSES = "cdrms_courses_data";
const STORAGE_KEY_RESULTS = "cdrms_results_data";
const STORAGE_KEY_QUERIES = "cdrms_result_queries";
const STORAGE_KEY_AUDIT = "cdrms_audit_logs";

// Seed initial student records (including existing records from local db)
const INITIAL_STUDENTS = [
  {
    id: "1",
    matric_no: "U2022/0296",
    surname: "WARI-SYLVA",
    firstname: "HIMSON",
    other_name: "",
    fullname: "WARI-SYLVA HIMSON",
    batch: "U2022",
    student_type: "Part-Time",
    dob: "2000-05-14",
    sex: "Male",
    marital_status: "Single",
    gsm: "08012345678",
    sponsor_gsm: "08087654321",
    guardian_rel: "Parent",
    email: "wari.sylva@uniport.edu.ng",
    state_of_origin: "Rivers",
    lga: "Port Harcourt",
    faculty: "Management Sciences",
    department: "Department of Management",
    entry_year: "2022",
    passport_path: ""
  },
  {
    id: "2",
    matric_no: "2002",
    surname: "KARA",
    firstname: "23",
    other_name: "",
    fullname: "KARA 23",
    batch: "U2022",
    student_type: "Full-Time",
    dob: "2001-08-20",
    sex: "Female",
    marital_status: "Single",
    gsm: "08123456789",
    sponsor_gsm: "08198765432",
    guardian_rel: "Parent",
    email: "kara23@uniport.edu.ng",
    state_of_origin: "Rivers",
    lga: "Obio-Akpor",
    faculty: "Management Sciences",
    department: "Department of Management",
    entry_year: "2022",
    passport_path: ""
  },
  {
    id: "3",
    matric_no: "PM/2022/1001",
    surname: "OKONKWO",
    firstname: "EBUKA",
    other_name: "DAVID",
    fullname: "OKONKWO EBUKA DAVID",
    batch: "U2022",
    student_type: "Full-Time",
    dob: "2001-04-12",
    sex: "Male",
    marital_status: "Single",
    gsm: "08031122334",
    sponsor_gsm: "08039988776",
    guardian_rel: "Parent",
    email: "ebuka.okonkwo@uniport.edu.ng",
    state_of_origin: "Anambra",
    lga: "Awka North",
    faculty: "Management Sciences",
    department: "Department of Project Management",
    entry_year: "2022",
    passport_path: ""
  },
  {
    id: "4",
    matric_no: "ER/2022/2045",
    surname: "AMADI",
    firstname: "CHIOMA",
    other_name: "BLESSING",
    fullname: "AMADI CHIOMA BLESSING",
    batch: "U2022",
    student_type: "Full-Time",
    dob: "2002-09-18",
    sex: "Female",
    marital_status: "Single",
    gsm: "08145566778",
    sponsor_gsm: "08149988112",
    guardian_rel: "Parent",
    email: "chioma.amadi@uniport.edu.ng",
    state_of_origin: "Rivers",
    lga: "Ikwerre",
    faculty: "Management Sciences",
    department: "Department of Employee Relations and Human Resource Management",
    entry_year: "2022",
    passport_path: ""
  },
  {
    id: "5",
    matric_no: "IE/2022/3012",
    surname: "BRIGGS",
    firstname: "TAMUNO",
    other_name: "TONYE",
    fullname: "BRIGGS TAMUNO TONYE",
    batch: "U2022",
    student_type: "Full-Time",
    dob: "2001-11-05",
    sex: "Male",
    marital_status: "Single",
    gsm: "08051234889",
    sponsor_gsm: "08059876543",
    guardian_rel: "Guardian",
    email: "tamuno.briggs@uniport.edu.ng",
    state_of_origin: "Rivers",
    lga: "Akuku-Toru",
    faculty: "Management Sciences",
    department: "Department of Innovation and Entrepreneurship Management",
    entry_year: "2022",
    passport_path: ""
  },
  {
    id: "6",
    matric_no: "PR/2022/4088",
    surname: "DAN-JUMBO",
    firstname: "IBIERE",
    other_name: "GRACE",
    fullname: "DAN-JUMBO IBIERE GRACE",
    batch: "U2022",
    student_type: "Full-Time",
    dob: "2002-02-28",
    sex: "Female",
    marital_status: "Single",
    gsm: "07062233445",
    sponsor_gsm: "07068877665",
    guardian_rel: "Parent",
    email: "ibiere.danjumbo@uniport.edu.ng",
    state_of_origin: "Rivers",
    lga: "Bonny",
    faculty: "Management Sciences",
    department: "Department of Procurement Management",
    entry_year: "2022",
    passport_path: ""
  }
];

// Build initial courses with IDs
const INITIAL_COURSES = ALL_INITIAL_COURSES.map((c, idx) => ({
  id: String(idx + 1),
  ...c
}));

class DataStore {
  constructor() {
    this.students = this._load(STORAGE_KEY_STUDENTS, INITIAL_STUDENTS);
    this.courses = this._load(STORAGE_KEY_COURSES, INITIAL_COURSES);
    this._ensureCourses();
    this.results = this._load(STORAGE_KEY_RESULTS, []);
    this.queries = this._load(STORAGE_KEY_QUERIES, []);
    this.auditLogs = this._load(STORAGE_KEY_AUDIT, []);
  }

  _ensureCourses() {
    let changed = false;
    const hasProjectCourses = this.courses.some(c => (c.department || "").toLowerCase().includes("project"));

    if (!hasProjectCourses) {
      INITIAL_COURSES.forEach((initCourse) => {
        if ((initCourse.department || "").toLowerCase().includes("project")) {
          this.courses.push({
            ...initCourse,
            id: String(this.courses.length + 1)
          });
          changed = true;
        }
      });
    }

    const hasErCourses = this.courses.some(c => (c.department || "").toLowerCase().includes("employee") || (c.department || "").toLowerCase().includes("human resource"));

    if (!hasErCourses) {
      INITIAL_COURSES.forEach((initCourse) => {
        if ((initCourse.department || "").toLowerCase().includes("employee") || (initCourse.department || "").toLowerCase().includes("human resource")) {
          this.courses.push({
            ...initCourse,
            id: String(this.courses.length + 1)
          });
          changed = true;
        }
      });
    }

    const hasIemCourses = this.courses.some(c => (c.department || "").toLowerCase().includes("innovation") || (c.department || "").toLowerCase().includes("entrepreneurship") || (c.department || "").toLowerCase().includes("iem"));

    if (!hasIemCourses) {
      INITIAL_COURSES.forEach((initCourse) => {
        if ((initCourse.department || "").toLowerCase().includes("innovation") || (initCourse.department || "").toLowerCase().includes("entrepreneurship")) {
          this.courses.push({
            ...initCourse,
            id: String(this.courses.length + 1)
          });
          changed = true;
        }
      });
    }

    const hasPrmCourses = this.courses.some(c => (c.department || "").toLowerCase().includes("procurement") || (c.department || "").toLowerCase().includes("prm"));

    if (!hasPrmCourses) {
      INITIAL_COURSES.forEach((initCourse) => {
        if ((initCourse.department || "").toLowerCase().includes("procurement") || (initCourse.department || "").toLowerCase().includes("prm")) {
          this.courses.push({
            ...initCourse,
            id: String(this.courses.length + 1)
          });
          changed = true;
        }
      });
    }

    this.courses.forEach((c) => {
      if (!c.department) {
        c.department = "Department of Management";
        changed = true;
      }
    });

    if (changed) {
      this._save(STORAGE_KEY_COURSES, this.courses);
    }
  }

  _load(key, defaultVal) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading localStorage key:", key, e);
    }
    return defaultVal;
  }

  _save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Error writing localStorage key:", key, e);
    }
  }

  // -------------------------------------------------------------
  // STUDENTS
  // -------------------------------------------------------------
  getStudents() {
    return [...this.students];
  }

  getStudentById(id) {
    return this.students.find(s => String(s.id) === String(id)) || null;
  }

  async saveStudent(studentData) {
    const isNew = !studentData.id;
    const id = isNew ? String(Date.now()) : String(studentData.id);

    const fullname = studentData.fullname ||
      `${studentData.surname || ""} ${studentData.firstname || ""} ${studentData.other_name || ""}`.trim();

    const record = {
      ...studentData,
      id,
      fullname,
      student_type: studentData.student_type || "Full-Time",
      batch: studentData.batch || "U2022"
    };

    if (isNew) {
      this.students.unshift(record);
    } else {
      const idx = this.students.findIndex(s => String(s.id) === id);
      if (idx !== -1) {
        this.students[idx] = { ...this.students[idx], ...record };
      } else {
        this.students.unshift(record);
      }
    }

    this._save(STORAGE_KEY_STUDENTS, this.students);

    // Sync to Supabase cloud
    saveStudentToCloud(record).catch(err => {
      console.warn("Background Supabase student sync failed:", err);
    });

    return record;
  }

  async deleteStudent(id) {
    const student = this.getStudentById(id);
    this.students = this.students.filter(s => String(s.id) !== String(id));
    this.results = this.results.filter(r => String(r.student_id) !== String(id));
    this._save(STORAGE_KEY_STUDENTS, this.students);
    this._save(STORAGE_KEY_RESULTS, this.results);

    if (student && student.matric_no) {
      deleteStudentFromCloud(student.matric_no).catch(err => {
        console.warn("Background Supabase student delete failed:", err);
      });
    }
  }

  // -------------------------------------------------------------
  // COURSES
  // -------------------------------------------------------------
  getCourses(program = null, level = null) {
    this._ensureCourses();
    let list = [...this.courses];
    if (program) {
      list = list.filter(c => (c.program || "Full-Time") === program);
    }
    if (level) {
      list = list.filter(c => c.level === level);
    }
    return list;
  }

  getCourseById(id) {
    return this.courses.find(c => String(c.id) === String(id)) || null;
  }

  async saveCourse(courseData) {
    const isNew = !courseData.id;
    const id = isNew ? String(Date.now()) : String(courseData.id);

    const record = {
      ...courseData,
      id,
      credit_units: Number(courseData.credit_units || 2),
      program: courseData.program || "Full-Time"
    };

    if (isNew) {
      this.courses.push(record);
    } else {
      const idx = this.courses.findIndex(c => String(c.id) === id);
      if (idx !== -1) this.courses[idx] = { ...this.courses[idx], ...record };
    }

    this._save(STORAGE_KEY_COURSES, this.courses);

    saveCourseToCloud(record).catch(err => {
      console.warn("Background Supabase course sync failed:", err);
    });

    return record;
  }

  async deleteCourse(id) {
    const course = this.courses.find(c => String(c.id) === String(id));
    this.courses = this.courses.filter(c => String(c.id) !== String(id));
    this._save(STORAGE_KEY_COURSES, this.courses);

    if (course) {
      deleteCourseFromCloud(course).catch(err => {
        console.warn("Background Supabase course delete failed:", err);
      });
    }
  }

  // -------------------------------------------------------------
  // RESULTS
  // -------------------------------------------------------------
  getResultsByStudent(studentId) {
    return this.results.filter(r => String(r.student_id) === String(studentId));
  }

  async saveResult(resData) {
    const score = Number(resData.score || 0);
    const isCarryover = Boolean(resData.is_carryover);
    const isWaived = Boolean(resData.is_waived);
    const { letter, point } = scoreToGrade(score, isCarryover);

    const grade = isWaived ? (resData.waiver_grade || "W") : letter;
    const grade_point = isWaived ? 1.0 : point;

    const id = resData.id ? String(resData.id) : String(Date.now() + Math.random().toString(36).substr(2, 4));

    const record = {
      ...resData,
      id,
      score,
      grade,
      grade_point,
      is_carryover: isCarryover,
      is_waived: isWaived,
      is_locked: resData.is_locked !== undefined ? resData.is_locked : true,
    };

    const existingIdx = this.results.findIndex(r =>
      String(r.student_id) === String(record.student_id) &&
      String(r.course_id) === String(record.course_id) &&
      r.session === record.session &&
      r.semester === record.semester
    );

    if (existingIdx !== -1) {
      this.results[existingIdx] = record;
    } else {
      this.results.push(record);
    }

    this._save(STORAGE_KEY_RESULTS, this.results);

    saveResultToCloud(record).catch(err => {
      console.warn("Background Supabase result sync failed:", err);
    });

    return record;
  }

  async saveBulkResults(resultsList) {
    for (const r of resultsList) {
      const score = Number(r.score || 0);
      const isCarryover = Boolean(r.is_carryover);
      const isWaived = Boolean(r.is_waived);
      const { letter, point } = scoreToGrade(score, isCarryover);
      const grade = isWaived ? (r.waiver_grade || "W") : letter;
      const grade_point = isWaived ? 1.0 : point;
      const id = r.id ? String(r.id) : String(Date.now() + Math.random().toString(36).substr(2, 4));

      const record = {
        ...r,
        id,
        score,
        grade,
        grade_point,
        is_carryover: isCarryover,
        is_waived: isWaived,
        is_locked: r.is_locked !== undefined ? r.is_locked : true,
      };

      const existingIdx = this.results.findIndex(item =>
        String(item.student_id) === String(record.student_id) &&
        String(item.course_id) === String(record.course_id) &&
        item.session === record.session &&
        item.semester === record.semester
      );

      if (existingIdx !== -1) {
        this.results[existingIdx] = record;
      } else {
        this.results.push(record);
      }
    }

    this._save(STORAGE_KEY_RESULTS, this.results);

    // Fast bulk upsert to Supabase
    saveBulkResultsToCloud(resultsList).catch(err => {
      console.warn("Background Supabase bulk results sync failed:", err);
    });

    if (resultsList.length > 0) {
      this.addAuditLog({
        action: "RESULTS_BATCH_LOCKED",
        title: `Examination Marks Submitted & Locked (${resultsList.length} Entries)`,
        student_id: resultsList[0].student_id,
        session: resultsList[0].session,
        semester: resultsList[0].semester,
        level: resultsList[0].level,
        resolved_by: "Level Exam Officer",
        resolution_note: `Semester examination marks saved and permanently locked against local edits under academic regulations.`,
      });
    }
  }

  async deleteResult(id) {
    const res = this.results.find(r => String(r.id) === String(id));
    this.results = this.results.filter(r => String(r.id) !== String(id));
    this._save(STORAGE_KEY_RESULTS, this.results);

    const client = getSupabaseClient();
    if (client && res) {
      client.from("results").delete().eq("id", id).catch(e => console.warn(e));
    }
  }

  // -------------------------------------------------------------
  // RESULT EDIT QUERIES (SUPERVISING OFFICER -> HOD)
  // -------------------------------------------------------------
  getQueries() {
    return [...this.queries];
  }

  createQuery(qData) {
    const id = String(Date.now());
    const query = {
      ...qData,
      id,
      status: "PENDING",
      created_at: new Date().toISOString(),
    };
    this.queries.unshift(query);
    this._save(STORAGE_KEY_QUERIES, this.queries);

    saveQueryToCloud(query).catch(err => {
      console.warn("Background Supabase query sync failed:", err);
    });

    this.addAuditLog({
      action: "SCORE_QUERY_SUBMITTED",
      title: `Score Edit Query Logged for ${qData.student_name} (${qData.course_code})`,
      query_id: id,
      student_id: qData.student_id,
      student_name: qData.student_name,
      matric_no: qData.matric_no,
      course_code: qData.course_code,
      course_title: qData.course_title,
      original_score: qData.original_score,
      proposed_score: qData.proposed_score,
      requested_by: qData.requested_by,
      justification: qData.reason,
      resolved_by: "Pending HOD Review",
    });

    return query;
  }

  async resolveQuery(queryId, approvedScore, resolutionNote, resolvedBy) {
    const qIdx = this.queries.findIndex((q) => String(q.id) === String(queryId));
    if (qIdx === -1) throw new Error("Query record not found.");

    const query = this.queries[qIdx];
    const scoreNum = Number(approvedScore);
    let updatedResult = null;

    // Update the targeted result in results
    const rIdx = this.results.findIndex(
      (r) =>
        (query.result_id && String(r.id) === String(query.result_id)) ||
        (String(r.student_id) === String(query.student_id) &&
          String(r.course_id) === String(query.course_id) &&
          r.session === query.session &&
          r.semester === query.semester)
    );

    if (rIdx !== -1) {
      const existing = this.results[rIdx];
      const { letter, point } = scoreToGrade(scoreNum, existing.is_carryover);
      updatedResult = {
        ...existing,
        score: scoreNum,
        grade: existing.is_waived ? (existing.waiver_grade || "W") : letter,
        grade_point: existing.is_waived ? 1.0 : point,
        is_locked: true,
        remark: `Edited by HOD on Query #${query.id}`,
      };
      this.results[rIdx] = updatedResult;
      this._save(STORAGE_KEY_RESULTS, this.results);
      saveResultToCloud(updatedResult).catch(e => console.warn(e));
    }

    // Mark query resolved
    this.queries[qIdx] = {
      ...query,
      status: "RESOLVED",
      approved_score: scoreNum,
      resolution_note: resolutionNote || "Approved and ratified by HOD.",
      resolved_by: resolvedBy || "Head of Department (HOD)",
      resolved_at: new Date().toISOString(),
    };
    this._save(STORAGE_KEY_QUERIES, this.queries);
    saveQueryToCloud(this.queries[qIdx]).catch(e => console.warn(e));

    // Log to Audit Trail
    this.addAuditLog({
      action: "SCORE_AMENDMENT_APPROVED",
      title: `Score Alteration Approved for ${query.student_name} (${query.course_code})`,
      query_id: query.id,
      student_id: query.student_id,
      student_name: query.student_name,
      matric_no: query.matric_no,
      course_code: query.course_code,
      course_title: query.course_title,
      original_score: query.original_score,
      approved_score: scoreNum,
      score_delta: Number((scoreNum - query.original_score).toFixed(1)),
      requested_by: query.requested_by,
      justification: query.reason,
      resolved_by: resolvedBy || "Head of Department (HOD)",
      resolution_note: resolutionNote || "Approved and ratified by HOD.",
    });

    return this.queries[qIdx];
  }

  rejectQuery(queryId, rejectionNote, resolvedBy) {
    const qIdx = this.queries.findIndex((q) => String(q.id) === String(queryId));
    if (qIdx === -1) throw new Error("Query record not found.");

    this.queries[qIdx] = {
      ...this.queries[qIdx],
      status: "REJECTED",
      resolution_note: rejectionNote || "Rejected by HOD.",
      resolved_by: resolvedBy || "Head of Department (HOD)",
      resolved_at: new Date().toISOString(),
    };
    this._save(STORAGE_KEY_QUERIES, this.queries);
    saveQueryToCloud(this.queries[qIdx]).catch(e => console.warn(e));

    // Log to Audit Trail
    this.addAuditLog({
      action: "SCORE_QUERY_REJECTED",
      title: `Score Edit Query Declined for ${this.queries[qIdx].student_name} (${this.queries[qIdx].course_code})`,
      query_id: this.queries[qIdx].id,
      student_id: this.queries[qIdx].student_id,
      student_name: this.queries[qIdx].student_name,
      matric_no: this.queries[qIdx].matric_no,
      course_code: this.queries[qIdx].course_code,
      course_title: this.queries[qIdx].course_title,
      original_score: this.queries[qIdx].original_score,
      proposed_score: this.queries[qIdx].proposed_score,
      requested_by: this.queries[qIdx].requested_by,
      justification: this.queries[qIdx].reason,
      resolved_by: resolvedBy || "Head of Department (HOD)",
      resolution_note: rejectionNote || "Declined by HOD.",
    });

    return this.queries[qIdx];
  }

  // -------------------------------------------------------------
  // AUDIT TRAIL LOGGING
  // -------------------------------------------------------------
  getAuditLogs() {
    return [...this.auditLogs];
  }

  addAuditLog(entry) {
    const log = {
      ...entry,
      id: String(Date.now()) + Math.random().toString(36).substr(2, 4),
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this._save(STORAGE_KEY_AUDIT, this.auditLogs);
    saveAuditLogToCloud(log).catch(e => console.warn(e));
    return log;
  }

  // -------------------------------------------------------------
  // CLOUD SYNC HELPERS
  // -------------------------------------------------------------
  setAllFromCloud({ students, courses, results, queries, auditLogs }) {
    if (students && Array.isArray(students) && students.length > 0) {
      this.students = students.map(s => ({ ...s, id: String(s.id) }));
      this._save(STORAGE_KEY_STUDENTS, this.students);
    }
    if (courses && Array.isArray(courses) && courses.length > 0) {
      this.courses = courses.map(c => ({ ...c, id: String(c.id) }));
      this._save(STORAGE_KEY_COURSES, this.courses);
    }
    if (results && Array.isArray(results) && results.length > 0) {
      this.results = results.map(r => ({ ...r, id: String(r.id) }));
      this._save(STORAGE_KEY_RESULTS, this.results);
    }
    if (queries && Array.isArray(queries) && queries.length > 0) {
      this.queries = queries.map(q => ({ ...q, id: String(q.id) }));
      this._save(STORAGE_KEY_QUERIES, this.queries);
    }
    if (auditLogs && Array.isArray(auditLogs) && auditLogs.length > 0) {
      this.auditLogs = auditLogs.map(a => ({
        ...a,
        ...(a.details || {}),
        id: String(a.id),
        timestamp: a.created_at || a.timestamp
      }));
      this._save(STORAGE_KEY_AUDIT, this.auditLogs);
    }
  }

  getAllData() {
    return {
      students: this.students,
      courses: this.courses,
      results: this.results
    };
  }

  getBatches() {
    const set = new Set();
    this.students.forEach(s => {
      if (s.batch) set.add(s.batch);
    });
    return Array.from(set).sort();
  }
}

export const db = new DataStore();
