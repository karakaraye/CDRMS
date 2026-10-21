/**
 * supabase.js
 * Cloud database integration service using @supabase/supabase-js
 * Supports Supabase (PostgreSQL in the cloud) with live testing, sync & Realtime replication.
 */

import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY_URL = "cdrms_supabase_url";
const STORAGE_KEY_KEY = "cdrms_supabase_anon_key";

// Permanent cloud configuration defaults (Online-First mode)
export const DEFAULT_SUPABASE_URL = "https://fqvmfkpknsaquayjlkwk.supabase.co";
export const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdm1ma3BrbnNhcXVheWpsa3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDA2NjcsImV4cCI6MjEwNzQ3NjY2N30.KO5vX6MwBbR7S0jt3lWh67TLPqs6IK79pQvMpesAX3o";

export function getStoredCloudCredentials() {
  let localUrl = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY_URL) : null;
  let localKey = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY_KEY) : null;
  const envUrl = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : null;
  const envKey = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : null;

  // Validate local storage credentials to prevent corrupted or stale URLs from breaking cloud sync
  if (localUrl) {
    localUrl = localUrl.trim();
    if (!localUrl.startsWith("https://") || !localUrl.includes(".supabase.co")) {
      localUrl = null;
    }
  }
  if (localKey) {
    localKey = localKey.trim();
    if (localKey.length < 20) {
      localKey = null;
    }
  }

  const url = localUrl || envUrl || DEFAULT_SUPABASE_URL;
  const key = localKey || envKey || DEFAULT_SUPABASE_KEY;
  return { url, key };
}

export function saveCloudCredentials(url, key) {
  if (typeof localStorage !== "undefined") {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }

  // Reset cached client
  if (supabaseInstance) {
    try {
      supabaseInstance.removeAllChannels();
    } catch (e) {
      // ignore
    }
    supabaseInstance = null;
  }
}

let supabaseInstance = null;

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getStoredCloudCredentials();
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn("Could not instantiate Supabase client:", e);
      return null;
    }
  }
  return null;
}

/**
 * Tests live connection to Supabase cloud.
 */
export async function testCloudConnection(customUrl = null, customKey = null) {
  const url = customUrl || getStoredCloudCredentials().url;
  const key = customKey || getStoredCloudCredentials().key;

  if (!url || !key) {
    return {
      success: false,
      message: "Supabase URL and Anon Key are required."
    };
  }

  const start = performance.now();
  try {
    const client = createClient(url, key);
    const { error } = await client.from("students").select("id").limit(1);

    const latency = Math.round(performance.now() - start);

    if (error) {
      if (error.code === "PGRST204" || error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: true,
          schemaNeeded: true,
          latency,
          message: `Connected to Supabase (${latency}ms)! However, tables need to be created.`
        };
      }
      return {
        success: false,
        latency,
        message: `Supabase Error: ${error.message} (code: ${error.code})`
      };
    }

    return {
      success: true,
      schemaNeeded: false,
      latency,
      message: `Successfully connected to Cloud Database (${latency}ms)!`
    };
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${err.message}`
    };
  }
}

/**
 * Pulls all records from Supabase cloud database down to the web client.
 */
export async function pullAllFromCloud() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Cloud database is not configured.");

  const [studentsRes, coursesRes, resultsRes, queriesRes, auditRes] = await Promise.all([
    client.from("students").select("*").order("matric_no"),
    client.from("courses").select("*").order("course_code"),
    client.from("results").select("*"),
    client.from("result_queries").select("*").order("created_at", { ascending: false }),
    client.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  if (studentsRes.error) console.warn("Students pull warning:", studentsRes.error.message);
  if (coursesRes.error) console.warn("Courses pull warning:", coursesRes.error.message);
  if (resultsRes.error) console.warn("Results pull warning:", resultsRes.error.message);
  if (queriesRes.error) console.warn("Queries pull warning:", queriesRes.error.message);
  if (auditRes.error) console.warn("Audit logs pull warning:", auditRes.error.message);

  return {
    students: studentsRes.data || [],
    courses: coursesRes.data || [],
    results: resultsRes.data || [],
    queries: queriesRes.data || [],
    auditLogs: auditRes.data || [],
  };
}

/**
 * Uploads local data to Supabase cloud database.
 */
export async function pushAllToCloud(localData) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Cloud database is not configured. Please add your credentials in Cloud Settings.");

  const results = { students: 0, courses: 0, resultsCount: 0 };

  // 1. Sync courses
  if (localData.courses && localData.courses.length > 0) {
    const coursesToUpload = localData.courses.map(c => ({
      course_code: c.course_code,
      course_title: c.course_title,
      credit_units: c.credit_units,
      level: c.level,
      semester: c.semester,
      status: c.status,
      program: c.program || "Full-Time",
      remark: c.remark || null
    }));

    const { error: coursesErr } = await client
      .from("courses")
      .upsert(coursesToUpload, { onConflict: "course_code,level,semester,program" });

    if (coursesErr) throw new Error(`Courses sync failed: ${coursesErr.message}`);
    results.courses = coursesToUpload.length;
  }

  // 2. Sync students
  if (localData.students && localData.students.length > 0) {
    const studentsToUpload = localData.students.map(s => ({
      matric_no: s.matric_no,
      surname: s.surname,
      firstname: s.firstname,
      other_name: s.other_name,
      fullname: s.fullname || `${s.surname || ""} ${s.firstname || ""} ${s.other_name || ""}`.trim(),
      batch: s.batch || "U2022",
      student_type: s.student_type || "Full-Time",
      dob: s.dob || null,
      sex: s.sex || null,
      marital_status: s.marital_status || null,
      gsm: s.gsm || null,
      sponsor_gsm: s.sponsor_gsm || null,
      guardian_rel: s.guardian_rel || null,
      email: s.email || null,
      state_of_origin: s.state_of_origin || null,
      lga: s.lga || null,
      faculty: s.faculty || "Management Sciences",
      department: s.department || "Management",
      entry_year: s.entry_year || null
    }));

    const { error: studentErr } = await client
      .from("students")
      .upsert(studentsToUpload, { onConflict: "matric_no" });

    if (studentErr) throw new Error(`Students sync failed: ${studentErr.message}`);
    results.students = studentsToUpload.length;
  }

  return results;
}

/**
 * Save single student to Supabase
 */
export async function saveStudentToCloud(student) {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = {
    matric_no: student.matric_no?.trim() || null,
    surname: student.surname || "",
    firstname: student.firstname || "",
    other_name: student.other_name || null,
    fullname: student.fullname || `${student.surname || ""} ${student.firstname || ""} ${student.other_name || ""}`.trim(),
    batch: student.batch || "U2022",
    student_type: student.student_type || "Full-Time",
    dob: student.dob || null,
    sex: student.sex || null,
    marital_status: student.marital_status || null,
    gsm: student.gsm || null,
    sponsor_gsm: student.sponsor_gsm || null,
    guardian_rel: student.guardian_rel || null,
    email: student.email || null,
    state_of_origin: student.state_of_origin || null,
    lga: student.lga || null,
    faculty: student.faculty || "Management Sciences",
    department: student.department || "Department of Management",
    entry_year: student.entry_year || null
  };

  try {
    // 1. If student has an existing serial id from cloud database, update by id
    if (student.id && !isNaN(Number(student.id)) && Number(student.id) < 10000000000) {
      const { error } = await client.from("students").upsert({ id: Number(student.id), ...payload }, { onConflict: "id" });
      if (error) console.warn("Supabase student upsert on id error:", error.message);
      return;
    }

    // 2. If student has a valid matric_no, check if row exists by matric_no
    if (payload.matric_no) {
      const { data: existing } = await client.from("students").select("id").eq("matric_no", payload.matric_no).maybeSingle();
      if (existing?.id) {
        const { error } = await client.from("students").update(payload).eq("id", existing.id);
        if (error) console.warn("Supabase student update error:", error.message);
        return;
      }
    }

    // 3. Check if a student with the same fullname and department exists
    const { data: nameMatch } = await client
      .from("students")
      .select("id")
      .eq("department", payload.department)
      .ilike("fullname", payload.fullname)
      .maybeSingle();

    if (nameMatch?.id) {
      const { error } = await client.from("students").update(payload).eq("id", nameMatch.id);
      if (error) console.warn("Supabase student update by name error:", error.message);
      return;
    }

    // 4. Clean insert for new student
    const { error: insertErr } = await client.from("students").insert(payload);
    if (insertErr) console.warn("Supabase student insert error:", insertErr.message);
  } catch (err) {
    console.warn("Supabase student sync exception:", err);
  }
}

/**
 * Delete student from Supabase
 */
export async function deleteStudentFromCloud(studentId, matricNo) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    if (studentId && !isNaN(Number(studentId)) && Number(studentId) < 10000000000) {
      const { error } = await client.from("students").delete().eq("id", Number(studentId));
      if (error) console.warn("Supabase student delete by id error:", error.message);
    } else if (matricNo) {
      const { error } = await client.from("students").delete().eq("matric_no", matricNo);
      if (error) console.warn("Supabase student delete by matric error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase student delete exception:", err);
  }
}

/**
 * Save single course to Supabase
 */
export async function saveCourseToCloud(course) {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = {
    course_code: course.course_code,
    course_title: course.course_title,
    credit_units: Number(course.credit_units || 3),
    level: String(course.level || "100"),
    semester: String(course.semester || "First"),
    status: course.status || "Compulsory",
    program: course.program || "Full-Time",
    remark: course.remark || null
  };

  const { error } = await client.from("courses").upsert(payload, { onConflict: "course_code,level,semester,program" });
  if (error) console.warn("Supabase course sync error:", error.message);
}

/**
 * Delete course from Supabase
 */
export async function deleteCourseFromCloud(course) {
  const client = getSupabaseClient();
  if (!client || !course) return;
  const query = client.from("courses").delete().eq("course_code", course.course_code);
  if (course.level) query.eq("level", course.level);
  if (course.semester) query.eq("semester", course.semester);
  if (course.program) query.eq("program", course.program);
  const { error } = await query;
  if (error) console.warn("Supabase course delete error:", error.message);
}

/**
 * Save single result to Supabase
 */
export async function saveResultToCloud(record) {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = {
    student_id: String(record.student_id),
    student_name: record.student_name || null,
    matric_no: record.matric_no || null,
    course_id: String(record.course_id),
    course_code: record.course_code || null,
    credit_units: record.credit_units ? Number(record.credit_units) : null,
    score: Number(record.score || 0),
    grade: record.grade || "F",
    grade_point: Number(record.grade_point || 0),
    session: record.session || "2022/2023",
    semester: record.semester || "First",
    is_carryover: record.is_carryover ? 1 : 0,
    sitting_type: record.sitting_type || (record.is_carryover ? "CARRYOVER" : "REGULAR"),
    is_waived: record.is_waived ? 1 : 0,
    waiver_grade: record.waiver_grade || null,
    remark: record.remark || null,
    level: record.level || null
  };

  const { error } = await client.from("results").upsert(payload, {
    onConflict: "student_id,course_id,session,semester"
  });
  if (error) console.warn("Supabase result sync error:", error.message);
}

/**
 * Save bulk results to Supabase in chunks
 */
export async function saveBulkResultsToCloud(resultsList) {
  const client = getSupabaseClient();
  if (!client || !resultsList || resultsList.length === 0) return;

  const payloads = resultsList.map(r => ({
    student_id: String(r.student_id),
    student_name: r.student_name || null,
    matric_no: r.matric_no || null,
    course_id: String(r.course_id),
    course_code: r.course_code || null,
    credit_units: r.credit_units ? Number(r.credit_units) : null,
    score: Number(r.score || 0),
    grade: r.grade || "F",
    grade_point: Number(r.grade_point || 0),
    session: r.session || "2022/2023",
    semester: r.semester || "First",
    is_carryover: r.is_carryover ? 1 : 0,
    sitting_type: r.sitting_type || (r.is_carryover ? "CARRYOVER" : "REGULAR"),
    is_waived: r.is_waived ? 1 : 0,
    waiver_grade: r.waiver_grade || null,
    remark: r.remark || null,
    level: r.level || null
  }));

  // Batch in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < payloads.length; i += chunkSize) {
    const chunk = payloads.slice(i, i + chunkSize);
    const { error } = await client.from("results").upsert(chunk, {
      onConflict: "student_id,course_id,session,semester"
    });
    if (error) console.warn("Supabase bulk result chunk sync error:", error.message);
  }
}

/**
 * Save query to Supabase
 */
export async function saveQueryToCloud(query) {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = {
    id: String(query.id),
    student_id: String(query.student_id || ""),
    student_name: query.student_name || "",
    matric_no: query.matric_no || "",
    course_id: String(query.course_id || ""),
    course_code: query.course_code || "",
    course_title: query.course_title || "",
    original_score: query.original_score !== undefined ? Number(query.original_score) : null,
    proposed_score: query.proposed_score !== undefined ? Number(query.proposed_score) : null,
    approved_score: query.approved_score !== undefined ? Number(query.approved_score) : null,
    reason: query.reason || "",
    requested_by: query.requested_by || "",
    status: query.status || "PENDING",
    resolution_note: query.resolution_note || null,
    resolved_by: query.resolved_by || null,
    resolved_at: query.resolved_at || null,
    session: query.session || "",
    semester: query.semester || "",
    attachment_data: query.attachment_data || null,
    attachment_name: query.attachment_name || null,
    attachment_type: query.attachment_type || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await client.from("result_queries").upsert(payload, { onConflict: "id" });
  if (error) console.warn("Supabase query sync error:", error.message);
}

/**
 * Save audit log entry to Supabase
 */
export async function saveAuditLogToCloud(log) {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = {
    id: String(log.id),
    action: log.action || "SYSTEM_ACTION",
    title: log.title || "",
    details: log,
    created_at: log.timestamp || new Date().toISOString()
  };

  const { error } = await client.from("audit_logs").upsert(payload, { onConflict: "id" });
  if (error) console.warn("Supabase audit log sync error:", error.message);
}

/**
 * Realtime multi-user subscription across all laptops.
 * Calls onChange whenever another user inserts, updates, or deletes data.
 */
export function subscribeToRealtime(onChange) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel("public-all-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public" },
      (payload) => {
        if (typeof onChange === "function") {
          onChange(payload);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Supabase Realtime connected: multi-user updates active.");
      }
    });

  return () => {
    try {
      client.removeChannel(channel);
    } catch (e) {
      // ignore
    }
  };
}

/**
 * Fetch all officer credentials from Supabase cloud
 */
export async function fetchOfficerCredentialsFromCloud() {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client.from("officer_credentials").select("*");
    if (error) {
      console.warn("fetchOfficerCredentialsFromCloud error:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn("fetchOfficerCredentialsFromCloud exception:", err);
    return [];
  }
}

/**
 * Fetch credential for a specific officer by username
 */
export async function fetchOfficerCredential(username) {
  const client = getSupabaseClient();
  if (!client || !username) return null;
  try {
    const cleanUser = username.trim().toLowerCase();
    const { data, error } = await client
      .from("officer_credentials")
      .select("*")
      .eq("username", cleanUser)
      .maybeSingle();
    if (error) {
      console.warn("fetchOfficerCredential error:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("fetchOfficerCredential exception:", err);
    return null;
  }
}

/**
 * Save / update officer credential in Supabase cloud
 */
export async function saveOfficerCredentialToCloud({ username, password, hasChangedPassword, roleTitle, department, resetBy, resetAt }) {
  const client = getSupabaseClient();
  if (!client || !username) {
    return { success: false, error: "Cloud client unavailable or username missing" };
  }
  try {
    const cleanUser = username.trim().toLowerCase();
    const payload = {
      username: cleanUser,
      password: password || "password123",
      has_changed_password: Boolean(hasChangedPassword),
      role_title: roleTitle || null,
      department: department || null,
      reset_by: resetBy || null,
      reset_at: resetAt || null,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await client.from("officer_credentials").upsert(payload, { onConflict: "username" }).select();
    if (error) {
      console.warn("Supabase officer credential sync error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.warn("Supabase officer credential sync exception:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Fetch officer reset requests from Supabase cloud
 */
export async function fetchOfficerResetRequestsFromCloud() {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client.from("officer_reset_requests").select("*").order("requested_at", { ascending: false });
    if (error) {
      console.warn("fetchOfficerResetRequestsFromCloud error:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn("fetchOfficerResetRequestsFromCloud exception:", err);
    return [];
  }
}

/**
 * Save officer reset request to Supabase cloud
 */
export async function saveOfficerResetRequestToCloud(req) {
  const client = getSupabaseClient();
  if (!client || !req?.id) return { success: false, error: "Client or request missing" };
  try {
    const payload = {
      id: req.id,
      username: (req.username || "").toLowerCase().trim(),
      role_title: req.roleTitle || null,
      department_id: req.departmentId || null,
      department: req.department || null,
      program: req.program || null,
      level: req.level || null,
      reason: req.reason || "",
      status: req.status || "PENDING_HEAD_OFFICER",
      head_officer_approval: req.headOfficerApproval || null,
      hod_execution: req.hodExecution || null,
      requested_at: req.requestedAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await client.from("officer_reset_requests").upsert(payload, { onConflict: "id" }).select();
    if (error) {
      console.warn("Supabase reset request sync error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.warn("Supabase reset request sync exception:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

