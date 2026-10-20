/**
 * excelResultParser.js
 * Comprehensive Excel / CSV Result Sheet Parser & Smart Student Matcher
 * Built for CDRMS (University of Port Harcourt).
 *
 * Capabilities:
 * - Parses .xlsx, .xls, .csv files completely client-side via SheetJS
 * - Auto-detects table headers across varied lecturer formats
 * - Primary identification by Matriculation Number (with normalization)
 * - Intelligent Name Matching when lecturers enter names in place of matric numbers
 * - Multi-criteria Carry-Over / Repeat detection matching university regulations
 * - Automatic Total computation (CA + Exam) & Grade calculation via scoreToGrade
 * - Generates pre-filled Excel result templates for lecturers
 */

import * as XLSX from "xlsx";
import { scoreToGrade } from "./grading.js";
import { extractEntryYear, getLevelForStudentSession } from "./session.js";

/**
 * Normalizes matric numbers by stripping leading/trailing whitespace,
 * standardizing slashes/hyphens, and converting to uppercase.
 * Example: " u2022 / 0296 " -> "U2022/0296"
 */
export function normalizeMatric(str) {
  if (!str) return "";
  let s = String(str).trim().toUpperCase();
  // Remove inner spaces around slashes or hyphens
  s = s.replace(/\s*([/\-_])\s*/g, "$1");
  // Normalize consecutive spaces
  s = s.replace(/\s+/g, " ");
  return s;
}

/**
 * Detects if a text string looks like a student name rather than a matric number.
 * Matric numbers typically contain numbers (e.g. U2022/0296, 2002, PM/2022/1001).
 * If there are NO digits, or it contains standard name prefixes / words with only letters,
 * it is treated as a name.
 */
export function isLikelyName(str) {
  if (!str) return false;
  const s = String(str).trim();
  if (s.length === 0) return false;

  // If it has no numbers at all and has at least 3 letters
  const hasDigits = /\d/.test(s);
  if (!hasDigits && /[A-Za-z]{3,}/.test(s)) {
    return true;
  }

  // Common titles
  if (/^(MR|MRS|MISS|MS|PASTOR|DR)\.?\s+/i.test(s)) {
    return true;
  }

  return false;
}

/**
 * Normalizes a name string for tokenized comparison.
 */
export function normalizeNameTokens(name) {
  if (!name) return [];
  return String(name)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1); // ignore single characters
}

/**
 * Computes name similarity score (0 to 1) between query name tokens and a student.
 */
export function computeNameMatchScore(queryName, student) {
  const queryTokens = normalizeNameTokens(queryName);
  if (queryTokens.length === 0) return 0;

  const studentFullTokens = normalizeNameTokens(
    `${student.surname || ""} ${student.firstname || ""} ${student.other_name || ""} ${student.fullname || ""}`
  );
  if (studentFullTokens.length === 0) return 0;

  // Count matching tokens
  let matches = 0;
  for (const q of queryTokens) {
    if (studentFullTokens.includes(q)) {
      matches += 1;
    } else {
      // Check partial match (e.g. prefix match like "EBUKA" and "EBUKAD")
      const partial = studentFullTokens.some(
        (st) => (st.startsWith(q) || q.startsWith(st)) && Math.min(st.length, q.length) >= 4
      );
      if (partial) matches += 0.8;
    }
  }

  const score = matches / Math.max(queryTokens.length, Math.min(studentFullTokens.length, 3));
  return Math.min(1, score);
}

/**
 * Find student by matric number or name with confidence metadata.
 */
export function findStudentMatch(matricInput, nameInput, students = []) {
  const cleanMatric = normalizeMatric(matricInput);
  const matricIsName = isLikelyName(matricInput);

  // 1. Try exact or normalized Matric match if it doesn't look like a name
  if (cleanMatric && !matricIsName) {
    // Exact match
    const exact = students.find(
      (s) => normalizeMatric(s.matric_no) === cleanMatric
    );
    if (exact) {
      return {
        student: exact,
        matchType: "EXACT_MATRIC",
        confidence: 1.0,
        note: `Exact Matric Match: ${exact.matric_no}`,
      };
    }

    // Flexible match (e.g. matching without prefix, or suffix match)
    const flexible = students.find((s) => {
      const sMat = normalizeMatric(s.matric_no);
      if (!sMat) return false;
      return (
        sMat.endsWith(cleanMatric) ||
        cleanMatric.endsWith(sMat) ||
        sMat.replace(/[^A-Z0-9]/g, "") === cleanMatric.replace(/[^A-Z0-9]/g, "")
      );
    });

    if (flexible) {
      return {
        student: flexible,
        matchType: "FUZZY_MATRIC",
        confidence: 0.95,
        note: `Matric Match (${flexible.matric_no})`,
      };
    }
  }

  // 2. Name Matching: Either because matric was a name, or matric failed to match,
  // or matric is missing while name is provided.
  const targetName = matricIsName ? matricInput : nameInput;
  if (targetName && String(targetName).trim()) {
    let bestStudent = null;
    let bestScore = 0;

    for (const student of students) {
      const score = computeNameMatchScore(targetName, student);
      if (score > bestScore) {
        bestScore = score;
        bestStudent = student;
      }
    }

    if (bestStudent && bestScore >= 0.7) {
      return {
        student: bestStudent,
        matchType: matricIsName ? "NAME_IN_MATRIC_CELL" : "NAME_MATCH",
        confidence: Number(bestScore.toFixed(2)),
        note: matricIsName
          ? `Name found in Matric column: matched to ${bestStudent.fullname} (${bestStudent.matric_no})`
          : `Matched by Student Name: ${bestStudent.fullname} (${bestStudent.matric_no})`,
      };
    }
  }

  // 3. Fallback: Unmatched
  return {
    student: null,
    matchType: "UNMATCHED",
    confidence: 0,
    note: "No matching student found in database",
  };
}

/**
 * Detects whether this student should be marked as a carryover for this course.
 */
export function checkCarryoverStatus({
  student,
  course,
  excelStatusText = "",
  existingResults = [],
  targetSession = "",
}) {
  if (!student || !course) return { isCarryover: false, reason: "" };

  // 1. Explicit status indicated in Excel row
  const statusStr = String(excelStatusText).toUpperCase().trim();
  if (/(CO|C\/O|CARRY|REPEAT|SPILL|RESIT)/.test(statusStr)) {
    return {
      isCarryover: true,
      reason: `Flagged as Carry-over in Excel ("${excelStatusText}")`,
    };
  }

  // 2. Check student's prior results for this course
  const priorResult = existingResults.find(
    (r) =>
      String(r.student_id) === String(student.id) &&
      String(r.course_id) === String(course.id) &&
      r.session !== targetSession
  );

  if (priorResult) {
    if (priorResult.score < 40 || priorResult.grade === "F" || priorResult.is_carryover) {
      return {
        isCarryover: true,
        reason: `Previous attempt recorded (${priorResult.session}: ${priorResult.score}% - Grade ${priorResult.grade})`,
      };
    }
  }

  // 3. Cohort / Level Mismatch
  const studentLevelNum = parseInt(getLevelForStudentSession(student, targetSession), 10) || 100;
  const courseLevelNum = parseInt(course.level, 10) || 100;

  if (studentLevelNum > courseLevelNum) {
    return {
      isCarryover: true,
      reason: `Older cohort student (${student.batch || extractEntryYear(student)}) taking ${course.level}L course in ${studentLevelNum}L (${targetSession})`,
    };
  }

  return { isCarryover: false, reason: "" };
}

/**
 * Auto-detects Session, Course Code, and Semester from pre-header rows or sheet/file name.
 */
export function detectMetadataFromTopRows(rows, fileName = "") {
  let detectedSession = "";
  let detectedCourseCode = "";
  let detectedSemester = "";

  const textToScan = [
    fileName,
    ...rows.slice(0, 10).map((r) => (Array.isArray(r) ? r.join(" ") : String(r))),
  ].join(" ");

  // Match session: 2022/2023, 2023/2024, etc.
  const sessionMatch = textToScan.match(/\b(20\d{2}\s*[\/\-]\s*20\d{2})\b/);
  if (sessionMatch) {
    detectedSession = sessionMatch[1].replace(/\s+/g, "").replace("-", "/");
  }

  // Match course code: e.g. MGT 101, MGT 101.1, PM 201, GES 100.1, etc.
  const courseMatch = textToScan.match(/\b([A-Za-z]{2,4}\s*\d{3}(?:\.\d)?)\b/);
  if (courseMatch) {
    detectedCourseCode = courseMatch[1].replace(/\s+/g, " ").toUpperCase();
  }

  // Match semester: First, Second, Third
  if (/second\s*semester|2nd\s*semester/i.test(textToScan)) {
    detectedSemester = "Second";
  } else if (/first\s*semester|1st\s*semester/i.test(textToScan)) {
    detectedSemester = "First";
  }

  return { detectedSession, detectedCourseCode, detectedSemester };
}

/**
 * Searches an array of sheet rows (2D array) to locate the main table header row.
 */
function findHeaderRowIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const rowStr = row.map((cell) => String(cell || "").toLowerCase()).join(" ");

    const hasMatric = /(matric|reg.*no|student.*id|mat.*no)/.test(rowStr);
    const hasScore = /(total|score|mark|grade|ca|exam)/.test(rowStr);
    const hasName = /(name|candidate|student)/.test(rowStr);

    if ((hasMatric && hasScore) || (hasMatric && hasName) || (hasName && hasScore)) {
      return i;
    }
  }
  return 0; // Default to first row
}

/**
 * Maps column headers to standardized keys.
 */
function mapColumnIndices(headerRow) {
  const map = {
    matricIdx: -1,
    nameIdx: -1,
    caIdx: -1,
    examIdx: -1,
    totalIdx: -1,
    statusIdx: -1,
  };

  headerRow.forEach((col, idx) => {
    const header = String(col || "").trim().toLowerCase();
    if (!header) return;

    if (map.matricIdx === -1 && /(matric|reg.*no|student.*id|mat.*no)/.test(header)) {
      map.matricIdx = idx;
    } else if (map.nameIdx === -1 && /(student.*name|full.*name|^name$|candidate)/.test(header)) {
      map.nameIdx = idx;
    } else if (map.caIdx === -1 && /(\bca\b|c\.a\.|test|continuous|assessment|quiz)/.test(header)) {
      map.caIdx = idx;
    } else if (map.examIdx === -1 && /(\bexam\b|examination|finals)/.test(header)) {
      map.examIdx = idx;
    } else if (map.statusIdx === -1 && /(status|remark|type|\bco\b|carry)/.test(header)) {
      map.statusIdx = idx;
    } else if (
      map.totalIdx === -1 &&
      (header.includes("total") ||
        header.includes("overall") ||
        header.includes("final") ||
        /^(score|mark|grade)$/.test(header))
    ) {
      map.totalIdx = idx;
    }
  });

  // Fallback pass: if totalIdx is still -1, check for general score/mark column that wasn't CA or Exam
  if (map.totalIdx === -1) {
    headerRow.forEach((col, idx) => {
      const header = String(col || "").trim().toLowerCase();
      if (!header) return;
      if (idx !== map.caIdx && idx !== map.examIdx && idx !== map.statusIdx && idx !== map.matricIdx && idx !== map.nameIdx) {
        if (/(score|mark|total)/.test(header)) {
          map.totalIdx = idx;
        }
      }
    });
  }

  return map;
}

/**
 * Parses raw Excel file data (ArrayBuffer or File) into processed student score rows.
 */
export async function parseExcelResultsFile({
  fileData,
  course,
  session,
  semester,
  students = [],
  existingResults = [],
}) {
  let workbook;
  if (fileData instanceof ArrayBuffer) {
    workbook = XLSX.read(fileData, { type: "array" });
  } else {
    const arrayBuffer = await fileData.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: "array" });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("The uploaded Excel workbook contains no readable sheets.");
  }

  // Convert sheet to array of rows (2D array)
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (!rows || rows.length === 0) {
    throw new Error("The selected Excel sheet appears to be completely empty.");
  }

  const headerIdx = findHeaderRowIndex(rows);
  const headerRow = rows[headerIdx];
  const colMap = mapColumnIndices(headerRow);
  const detectedMeta = detectMetadataFromTopRows(rows, fileData?.name || "");

  // If matricIdx wasn't found, try to find any column with "matric" or fallback to column 1
  if (colMap.matricIdx === -1) {
    colMap.matricIdx = colMap.nameIdx === 1 ? 0 : 1;
  }

  const processedRows = [];
  const rawDataRows = rows.slice(headerIdx + 1);

  rawDataRows.forEach((row, index) => {
    if (!Array.isArray(row) || row.every((c) => String(c).trim() === "")) {
      return; // skip completely empty rows
    }

    const rawMatric = colMap.matricIdx >= 0 ? String(row[colMap.matricIdx] || "").trim() : "";
    const rawName = colMap.nameIdx >= 0 ? String(row[colMap.nameIdx] || "").trim() : "";
    const rawCA = colMap.caIdx >= 0 ? row[colMap.caIdx] : "";
    const rawExam = colMap.examIdx >= 0 ? row[colMap.examIdx] : "";
    const rawTotal = colMap.totalIdx >= 0 ? row[colMap.totalIdx] : "";
    const rawStatus = colMap.statusIdx >= 0 ? String(row[colMap.statusIdx] || "").trim() : "";

    // Ignore header repeats or non-data rows
    if (
      normalizeMatric(rawMatric).toLowerCase().includes("matric") ||
      rawName.toLowerCase().includes("student name")
    ) {
      return;
    }

    // Parse scores
    const caNum = parseFloat(rawCA);
    const examNum = parseFloat(rawExam);
    let totalNum = parseFloat(rawTotal);

    // Compute Total if missing or NaN but CA and Exam are provided
    if (isNaN(totalNum)) {
      if (!isNaN(caNum) && !isNaN(examNum)) {
        totalNum = caNum + examNum;
      } else if (!isNaN(examNum)) {
        totalNum = examNum;
      } else if (!isNaN(caNum)) {
        totalNum = caNum;
      } else {
        totalNum = 0;
      }
    }

    // Clamp score to valid academic range [0, 100]
    totalNum = Math.max(0, Math.min(100, Math.round(totalNum * 10) / 10));

    // Perform Student Matching
    const match = findStudentMatch(rawMatric, rawName, students);
    const matchedStudent = match.student;

    // Detect Carry-over Status
    const carryoverInfo = checkCarryoverStatus({
      student: matchedStudent,
      course,
      excelStatusText: rawStatus,
      existingResults,
      targetSession: session,
    });

    const isCarryover = carryoverInfo.isCarryover;
    const { letter: grade, point: gradePoint } = scoreToGrade(totalNum, isCarryover);

    // Compute student's academic level during this session
    const studentLevelForSession = matchedStudent
      ? getLevelForStudentSession(matchedStudent, session)
      : (course?.level || "100");

    processedRows.push({
      rowId: `row-${index + 1}`,
      originalRowIndex: headerIdx + 1 + index + 1,
      rawMatric,
      rawName,
      rawCA: !isNaN(caNum) ? caNum : "",
      rawExam: !isNaN(examNum) ? examNum : "",
      score: totalNum,
      grade,
      gradePoint,
      isCarryover,
      carryoverReason: carryoverInfo.reason,
      studentLevelForSession,
      targetSession: session,
      matchType: match.matchType,
      matchConfidence: match.confidence,
      matchNote: match.note,
      matchedStudentId: matchedStudent ? String(matchedStudent.id) : null,
      matchedStudent,
      includeInImport: matchedStudent !== null,
    });
  });

  return {
    sheetName,
    session,
    semester,
    detectedSession: detectedMeta.detectedSession,
    detectedCourseCode: detectedMeta.detectedCourseCode,
    detectedSemester: detectedMeta.detectedSemester,
    headerRowIndex: headerIdx + 1,
    columnMapping: colMap,
    rows: processedRows,
  };
}

/**
 * Generates and downloads an Excel template for lecturers for a specific course.
 * Pre-populates students in the department/program if provided.
 */
export function generateResultTemplate({
  course,
  session,
  semester,
  students = [],
}) {
  const headers = [
    "S/N",
    "Matric No",
    "Student Full Name",
    "CA Score (30)",
    "Exam Score (70)",
    "Total Score (100)",
    "Status (Regular / Carryover)",
    "Remarks",
  ];

  const data = [];

  if (students && students.length > 0) {
    // Sort students by matric_no
    const sorted = [...students].sort((a, b) =>
      String(a.matric_no).localeCompare(String(b.matric_no))
    );

    sorted.forEach((student, idx) => {
      data.push([
        idx + 1,
        student.matric_no,
        student.fullname || `${student.surname || ""} ${student.firstname || ""}`.trim(),
        "", // CA
        "", // Exam
        "", // Total
        "Regular",
        "",
      ]);
    });
  } else {
    // Sample rows
    data.push([1, "U2022/0296", "WARI-SYLVA HIMSON", 24, 52, 76, "Regular", ""]);
    data.push([2, "PM/2022/1001", "OKONKWO EBUKA DAVID", 20, 48, 68, "Regular", ""]);
    data.push([3, "ER/2021/0450", "AMADI CHIOMA", 18, 42, 60, "Carryover", "Carry-over from 2021"]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 6 },  // S/N
    { wch: 18 }, // Matric No
    { wch: 32 }, // Student Name
    { wch: 15 }, // CA
    { wch: 16 }, // Exam
    { wch: 18 }, // Total
    { wch: 26 }, // Status
    { wch: 20 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Course Results");

  const safeCode = (course?.course_code || "COURSE").replace(/[^a-zA-Z0-9]/g, "_");
  const safeSession = (session || "2022_2023").replace(/[^a-zA-Z0-9]/g, "_");
  const safeSemester = (semester || "First").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${safeCode}_${safeSession}_${safeSemester}_Results_Template.xlsx`;

  XLSX.writeFile(workbook, filename);
}
