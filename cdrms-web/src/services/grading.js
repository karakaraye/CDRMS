/**
 * grading.js
 * Comprehensive academic grading and CGPA computation logic
 * matching Uniport Department of Management regulations.
 */

export const GRADE_SCALE = [
  { min: 70, max: 100, letter: "A", point: 5.0 },
  { min: 60, max: 69.99, letter: "B", point: 4.0 },
  { min: 50, max: 59.99, letter: "C", point: 3.0 },
  { min: 45, max: 49.99, letter: "D", point: 2.0 },
  { min: 40, max: 44.99, letter: "E", point: 1.0 },
  { min: 0, max: 39.99, letter: "F", point: 0.0 },
];

/**
 * Converts a numeric score to letter grade and grade point.
 * Repeat attempts cap A/B/C at 3.0 GP.
 */
export function scoreToGrade(score, isRepeat = false) {
  const num = parseFloat(score);
  if (isNaN(num)) {
    return { letter: "F", point: 0.0 };
  }

  for (const row of GRADE_SCALE) {
    if (num >= row.min && num <= row.max) {
      if (isRepeat && ["A", "B", "C"].includes(row.letter)) {
        return { letter: row.letter, point: 3.0 };
      }
      return { letter: row.letter, point: row.point };
    }
  }

  if (num > 100) return { letter: "A", point: isRepeat ? 3.0 : 5.0 };
  return { letter: "F", point: 0.0 };
}

/**
 * Returns official degree classification.
 */
export function getDegreeClass(cgpa, numeric = true) {
  const val = parseFloat(cgpa) || 0;
  if (val >= 4.50) return numeric ? "1st Class" : "FIRST CLASS HONOURS";
  if (val >= 3.50) return numeric ? "2¹" : "SECOND CLASS (UPPER DIVISION)";
  if (val >= 2.40) return numeric ? "2²" : "SECOND CLASS (LOWER DIVISION)";
  if (val >= 1.50) return numeric ? "3rd Class" : "THIRD CLASS";
  if (val >= 1.00) return numeric ? "Pass" : "PASS";
  if (val > 0) return numeric ? "Fail" : "FAIL";
  return "N/A";
}

/**
 * Selects best scoring Required courses (up to target CU, default 38 CU).
 * Compulsory courses are always included in total calculations.
 */
export function selectBestRequiredCourses(reqCourses, targetCU = 38) {
  // Sort descending by GP, then score
  const sorted = [...reqCourses].sort((a, b) => {
    if (b.grade_point !== a.grade_point) return b.grade_point - a.grade_point;
    return (b.score || 0) - (a.score || 0);
  });

  const selectedIds = new Set();
  let accumulatedCU = 0;

  for (const item of sorted) {
    const cu = Number(item.credit_units || 0);
    if (accumulatedCU + cu <= targetCU) {
      selectedIds.add(item.id);
      accumulatedCU += cu;
    }
  }

  return selectedIds;
}

/**
 * Calculates complete student academic summary from results.
 */
export function calculateStudentMetrics(results = [], courses = []) {
  if (!results.length) {
    return {
      tcu: 0,
      tqp: 0,
      cgpa: "0.00",
      degreeClass: "N/A",
      degreeClassFull: "N/A",
      passedCount: 0,
      failedCount: 0,
      totalRegistered: 0,
      semesterBreakdown: {},
      yearBreakdown: {},
      outstandingCourses: []
    };
  }

  // Create course map
  const courseMap = new Map();
  courses.forEach(c => courseMap.set(c.id, c));

  let totalRegisteredCU = 0;
  let totalEarnedCU = 0;
  let totalQP = 0;
  let passedCount = 0;
  let failedCount = 0;

  const semesterBreakdown = {};
  const yearBreakdown = {};
  const outstandingMap = new Map();

  results.forEach(res => {
    const course = courseMap.get(res.course_id) || {};
    const cu = Number(course.credit_units || res.credit_units || 0);
    const score = Number(res.score || 0);
    const isWaived = Boolean(res.is_waived);
    const grade = isWaived ? (res.waiver_grade || "W") : (res.grade || scoreToGrade(score, res.is_carryover).letter);
    const gp = isWaived ? 1.0 : (res.grade_point !== undefined ? Number(res.grade_point) : scoreToGrade(score, res.is_carryover).point);
    const qp = cu * gp;

    const level = res.level || course.level || "100";
    const semester = res.semester || course.semester || "First";
    const session = res.session || "Default";
    const periodKey = `${level} - ${semester} (${session})`;
    const yearKey = `${level} Level`;

    const isPassed = isWaived || (grade !== "F" && score >= 40);

    // TCU for GPA and CGPA includes all registered courses
    totalRegisteredCU += cu;
    totalQP += qp;

    if (isPassed) {
      passedCount++;
      totalEarnedCU += cu;
      // remove from outstanding if passed
      outstandingMap.delete(course.course_code || res.course_id);
    } else {
      failedCount++;
      if (course.course_code) {
        outstandingMap.set(course.course_code, {
          code: course.course_code,
          title: course.course_title,
          cu,
          level,
          semester,
          status: course.status || "Compulsory"
        });
      }
    }

    // Period breakdown
    if (!semesterBreakdown[periodKey]) {
      semesterBreakdown[periodKey] = { cu: 0, qp: 0, courses: [] };
    }
    semesterBreakdown[periodKey].cu += cu;
    semesterBreakdown[periodKey].qp += qp;
    semesterBreakdown[periodKey].courses.push({
      ...res,
      course_code: course.course_code,
      course_title: course.course_title,
      credit_units: cu,
      grade,
      gp,
      qp
    });

    // Year breakdown
    if (!yearBreakdown[yearKey]) {
      yearBreakdown[yearKey] = { cu: 0, qp: 0 };
    }
    yearBreakdown[yearKey].cu += cu;
    yearBreakdown[yearKey].qp += qp;
  });

  const cgpa = totalRegisteredCU > 0 ? (totalQP / totalRegisteredCU).toFixed(2) : "0.00";

  return {
    tcu: totalRegisteredCU,
    earnedCU: totalEarnedCU,
    tqp: totalQP,
    cgpa,
    degreeClass: getDegreeClass(parseFloat(cgpa), true),
    degreeClassFull: getDegreeClass(parseFloat(cgpa), false),
    passedCount,
    failedCount,
    totalRegistered: results.length,
    semesterBreakdown,
    yearBreakdown,
    outstandingCourses: Array.from(outstandingMap.values())
  };
}

/**
 * Validates course waiver eligibility according to Uniport academic regulations:
 * 1. Maximum of 2 courses can be waived per student across their entire program.
 * 2. GES (General Studies) courses CANNOT be waived (mandatory university requirement).
 * 3. FMS / Project courses CANNOT be waived (mandatory degree requirement).
 * 4. Internship / Industrial Exposure CANNOT be waived.
 */
export function canWaiveCourse(course, existingStudentResults = [], currentResultId = null) {
  if (!course) return { allowed: false, reason: "Course details not found." };

  const code = (course.course_code || "").toUpperCase().trim();
  const title = (course.course_title || "").toLowerCase().trim();

  // 1. GES courses
  if (code.startsWith("GES")) {
    return {
      allowed: false,
      reason: `GES courses (${course.course_code}) cannot be waived. General Studies are mandatory university requirements.`
    };
  }

  // 2. Project / FMS courses
  if (code.startsWith("FMS") || title.includes("project")) {
    return {
      allowed: false,
      reason: `Project / FMS courses (${course.course_code} — ${course.course_title}) cannot be waived. These are mandatory degree requirements.`
    };
  }

  // 3. Internship
  if (title.includes("internship") || title.includes("industrial exposure") || code === "MGT 420.1") {
    return {
      allowed: false,
      reason: `Internship (${course.course_code} — ${course.course_title}) cannot be waived. Internship is a mandatory degree requirement.`
    };
  }

  // 4. Max 2 waived courses per student
  const otherWaived = existingStudentResults.filter(
    (r) =>
      Boolean(r.is_waived) &&
      String(r.id) !== String(currentResultId) &&
      String(r.course_id) !== String(course.id)
  );

  if (otherWaived.length >= 2) {
    return {
      allowed: false,
      reason: "Maximum Waiver Limit Reached: A student is only allowed to waive a maximum of two (2) courses across their entire program."
    };
  }

  return { allowed: true, reason: "" };
}

