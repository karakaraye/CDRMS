/**
 * session.js
 * Academic Calendar Session Engine for CDRMS (University of Port Harcourt).
 *
 * Core Regulation:
 * If a student's entry year is Y (e.g. 2022):
 * - 100 Level: Y / (Y + 1)         -> 2022/2023 (First Session)
 * - 200 Level: (Y + 1) / (Y + 2)   -> 2023/2024
 * - 300 Level: (Y + 2) / (Y + 3)   -> 2024/2025
 * - 400 Level: (Y + 3) / (Y + 4)   -> 2025/2026
 * - 500 Level: (Y + 4) / (Y + 5)   -> 2026/2027 (Extra Year I)
 * - 600 Level: (Y + 5) / (Y + 6)   -> 2027/2028 (Extra Year II)
 *
 * Offset formula:
 * offset = Math.floor(Level / 100) - 1
 * startYear = entryYear + offset
 * session = `${startYear}/${startYear + 1}`
 */

export function extractEntryYear(student) {
  if (!student) return 2022;

  // 1. Explicit entry_year field
  if (student.entry_year) {
    const parsed = parseInt(String(student.entry_year).trim(), 10);
    if (!isNaN(parsed) && parsed >= 1990 && parsed <= 2050) {
      return parsed;
    }
  }

  // 2. Batch format (e.g. "U2022", "2022")
  if (student.batch) {
    const match = String(student.batch).match(/(19\d{2}|20\d{2})/);
    if (match) {
      return parseInt(match[0], 10);
    }
  }

  // 3. Matriculation Number format (e.g. "U2022/0296")
  if (student.matric_no) {
    const match = String(student.matric_no).match(/(19\d{2}|20\d{2})/);
    if (match) {
      return parseInt(match[0], 10);
    }
  }

  return 2022;
}

export function getSessionForLevel(entryYearOrStudent, level = "100") {
  const entryYear =
    typeof entryYearOrStudent === "object" && entryYearOrStudent !== null
      ? extractEntryYear(entryYearOrStudent)
      : parseInt(entryYearOrStudent, 10) || 2022;

  const lvlNum = parseInt(level, 10) || 100;
  const offset = Math.max(0, Math.floor(lvlNum / 100) - 1);
  const startYear = entryYear + offset;
  const endYear = startYear + 1;
  return `${startYear}/${endYear}`;
}

export function getAllSessionsMap(student) {
  const y = extractEntryYear(student);
  return {
    "100": `${y}/${y + 1}`,
    "200": `${y + 1}/${y + 2}`,
    "300": `${y + 2}/${y + 3}`,
    "400": `${y + 3}/${y + 4}`,
    "500": `${y + 4}/${y + 5}`,
    "600": `${y + 5}/${y + 6}`,
  };
}

export function getStudentSessionOptions(student, currentLevel = "100") {
  const y = extractEntryYear(student);
  const official = getSessionForLevel(y, currentLevel);

  const sessions = [];
  for (let i = 0; i <= 6; i++) {
    const sy = y + i;
    sessions.push(`${sy}/${sy + 1}`);
  }

  return {
    official,
    options: sessions,
  };
}

/**
 * Calculates the exact academic level (100, 200, 300, 400, 500, 600)
 * that a student was in during a given academic session (e.g. "2023/2024").
 */
export function getLevelForStudentSession(student, session) {
  if (!student) return "100";
  const entryYear = extractEntryYear(student);
  const match = String(session || "").match(/(\d{4})/);
  if (!match) return "100";
  const sessionStartYear = parseInt(match[1], 10);
  const diff = sessionStartYear - entryYear;

  if (diff <= 0) return "100";
  if (diff === 1) return "200";
  if (diff === 2) return "300";
  if (diff === 3) return "400";
  if (diff === 4) return "500";
  return "600";
}

