/**
 * supabase.js
 * Cloud database integration service using @supabase/supabase-js
 * Supports Supabase (PostgreSQL in the cloud) with live testing & sync.
 */

import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY_URL = "cdrms_supabase_url";
const STORAGE_KEY_KEY = "cdrms_supabase_anon_key";

export function getStoredCloudCredentials() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || "";
  const key = localStorage.getItem(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  return { url, key };
}

export function saveCloudCredentials(url, key) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);

  // Reset cached client
  supabaseInstance = null;
}

let supabaseInstance = null;

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getStoredCloudCredentials();
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
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
    // Simple ping query to students or check system health
    const { data, error } = await client.from("students").select("id").limit(1);

    const latency = Math.round(performance.now() - start);

    if (error) {
      // If table doesn't exist yet, it's connected to Supabase but schema needs to be run!
      if (error.code === "PGRST204" || error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: true,
          schemaNeeded: true,
          latency,
          message: `Connected to Supabase (${latency}ms)! However, tables need to be created. Please run the setup SQL script in your Supabase SQL Editor.`
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
 * Uploads all local data (students, courses, results) to Supabase cloud database.
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
 * Pulls all records from Supabase cloud database down to the web client.
 */
export async function pullAllFromCloud() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Cloud database is not configured.");

  const [studentsRes, coursesRes, resultsRes] = await Promise.all([
    client.from("students").select("*").order("matric_no"),
    client.from("courses").select("*").order("course_code"),
    client.from("results").select("*")
  ]);

  if (studentsRes.error) throw new Error(`Students pull failed: ${studentsRes.error.message}`);
  if (coursesRes.error) throw new Error(`Courses pull failed: ${coursesRes.error.message}`);
  if (resultsRes.error) throw new Error(`Results pull failed: ${resultsRes.error.message}`);

  return {
    students: studentsRes.data || [],
    courses: coursesRes.data || [],
    results: resultsRes.data || []
  };
}
