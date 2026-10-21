/**
 * auth.js
 * Role-Based Access Control (RBAC) and Multi-Department Authentication Service for CDRMS.
 *
 * Supported Departments (Faculty of Management Sciences, University of Port Harcourt):
 * 1. Department of Management (Has both Full-Time and Part-Time)
 * 2. Department of Project Management (Full-Time only)
 * 3. Department of Employee Relations and Human Resource Management (Full-Time only)
 * 4. Department of Innovation and Entrepreneurship Management (Full-Time only)
 * 5. Department of Procurement Management (Full-Time only)
 */

export const DEPARTMENTS = [
  {
    id: "management",
    name: "Department of Management",
    shortName: "Management",
    code: "MGT",
    hasPartTime: true,
    programs: ["Full-Time", "Part-Time"],
    description: "General Management, Administrative Sciences, and Dual Division Studies.",
  },
  {
    id: "project_management",
    name: "Department of Project Management",
    shortName: "Project Management",
    code: "PM",
    hasPartTime: false,
    programs: ["Full-Time"],
    description: "Project Planning, Execution, Agile Strategy, and Project Risk Governance.",
  },
  {
    id: "employee_relations",
    name: "Department of Employee Relations and Human Resource Management",
    shortName: "Employee Relations & HRM",
    code: "ERHRM",
    hasPartTime: false,
    programs: ["Full-Time"],
    description: "Industrial Relations, Human Capital Management, Labour Law, and Strategic HRM.",
  },
  {
    id: "innovation_entrepreneurship",
    name: "Department of Innovation and Entrepreneurship Management",
    shortName: "Innovation & Entrepreneurship",
    code: "IEM",
    hasPartTime: false,
    programs: ["Full-Time"],
    description: "Business Innovation, Venture Incubation, Technology Commercialization, and Enterprise Strategy.",
  },
  {
    id: "procurement_management",
    name: "Department of Procurement Management",
    shortName: "Procurement Management",
    code: "PRM",
    hasPartTime: false,
    programs: ["Full-Time"],
    description: "Supply Chain Logistics, Strategic Sourcing, Contract Governance, and Public Procurement.",
  },
];

export const ROLES = {
  OFFICER_100: "officer_100",
  OFFICER_200: "officer_200",
  OFFICER_300: "officer_300",
  OFFICER_400: "officer_400",
  SUPERVISING: "supervising",
  SUPER_FT: "super_ft",
  SUPER_PT: "super_pt",
  HOD: "hod",
};

const DEPT_PREFIX_MAP = {
  management: { "Full-Time": "mgt_ft_", "Part-Time": "mgt_pt_" },
  project_management: { "Full-Time": "pm_" },
  employee_relations: { "Full-Time": "erhrm_" },
  innovation_entrepreneurship: { "Full-Time": "iem_" },
  procurement_management: { "Full-Time": "prm_" },
};

// Builder for departmental users
function createDepartmentUsers(deptId, deptName, program) {
  const isManagement = deptId === "management";
  const pTag = isManagement ? (program === "Full-Time" ? " (FT)" : " (PT)") : "";
  const prefix = DEPT_PREFIX_MAP[deptId]?.[program] || `${deptId.slice(0, 4)}_`;

  return [
    {
      username: `${prefix}100`,
      password: "password123",
      role: ROLES.OFFICER_100,
      roleTitle: `100 Level Exam Officer${pTag}`,
      level: "100",
      department: deptName,
      departmentId: deptId,
      program,
      description: `Responsible for 100 Level ${program}. Scores are locked upon saving.`,
    },
    {
      username: `${prefix}200`,
      password: "password123",
      role: ROLES.OFFICER_200,
      roleTitle: `200 Level Exam Officer${pTag}`,
      level: "200",
      department: deptName,
      departmentId: deptId,
      program,
      description: `Responsible for 200 Level ${program}. Scores are locked upon saving.`,
    },
    {
      username: `${prefix}300`,
      password: "password123",
      role: ROLES.OFFICER_300,
      roleTitle: `300 Level Exam Officer${pTag}`,
      level: "300",
      department: deptName,
      departmentId: deptId,
      program,
      description: `Responsible for 300 Level ${program}. Scores are locked upon saving.`,
    },
    {
      username: `${prefix}400`,
      password: "password123",
      role: ROLES.OFFICER_400,
      roleTitle: `400 Level Exam Officer${pTag}`,
      level: "400",
      department: deptName,
      departmentId: deptId,
      program,
      description: `Responsible for 400 Level ${program}. Scores are locked upon saving.`,
    },
    {
      username: `${prefix}super`,
      password: "password123",
      role: program === "Part-Time" ? ROLES.SUPER_PT : ROLES.SUPER_FT,
      roleTitle: `Supervising Exam Officer${pTag}`,
      level: "500-600",
      department: deptName,
      departmentId: deptId,
      program,
      description: `Supervises 100-400L ${program}. Enters 500L & 600L ${program} scores. Submits edit queries.`,
    },
    {
      username: `${prefix}hod`,
      password: "password123",
      role: ROLES.HOD,
      roleTitle: isManagement
        ? `Head of Department (HOD) - ${program}`
        : "Head of Department (HOD)",
      level: "All",
      department: deptName,
      departmentId: deptId,
      program,
      description: `Executive departmental oversight of ${program} records. Resolves queries & authorizes edits.`,
    },
  ];
}

// Generate users across all departments and programs
export const DEFAULT_USERS = [
  // 1. Department of Management - Full-Time
  ...createDepartmentUsers("management", "Department of Management", "Full-Time"),

  // 2. Department of Management - Part-Time
  ...createDepartmentUsers("management", "Department of Management", "Part-Time"),

  // 3. Department of Project Management - Full-Time
  ...createDepartmentUsers("project_management", "Department of Project Management", "Full-Time"),

  // 4. Department of Employee Relations and Human Resource Management - Full-Time
  ...createDepartmentUsers(
    "employee_relations",
    "Department of Employee Relations and Human Resource Management",
    "Full-Time"
  ),

  // 5. Department of Innovation and Entrepreneurship Management - Full-Time
  ...createDepartmentUsers(
    "innovation_entrepreneurship",
    "Department of Innovation and Entrepreneurship Management",
    "Full-Time"
  ),

  // 6. Department of Procurement Management - Full-Time
  ...createDepartmentUsers(
    "procurement_management",
    "Department of Procurement Management",
    "Full-Time"
  ),

  // Backwards compatibility legacy aliases:
  {
    username: "officer100",
    password: "password123",
    role: ROLES.OFFICER_100,
    roleTitle: "100 Level Exam Officer (FT)",
    level: "100",
    department: "Department of Management",
    departmentId: "management",
    program: "Full-Time",
    description: "Responsible for 100 Level Full-Time. Cannot edit after save.",
  },
  {
    username: "officer200",
    password: "password123",
    role: ROLES.OFFICER_200,
    roleTitle: "200 Level Exam Officer (FT)",
    level: "200",
    department: "Department of Management",
    departmentId: "management",
    program: "Full-Time",
    description: "Responsible for 200 Level Full-Time. Cannot edit after save.",
  },
  {
    username: "officer300",
    password: "password123",
    role: ROLES.OFFICER_300,
    roleTitle: "300 Level Exam Officer (FT)",
    level: "300",
    department: "Department of Management",
    departmentId: "management",
    program: "Full-Time",
    description: "Responsible for 300 Level Full-Time. Cannot edit after save.",
  },
  {
    username: "officer400",
    password: "password123",
    role: ROLES.OFFICER_400,
    roleTitle: "400 Level Exam Officer (FT)",
    level: "400",
    department: "Department of Management",
    departmentId: "management",
    program: "Full-Time",
    description: "Responsible for 400 Level Full-Time. Cannot edit after save.",
  },
  {
    username: "super_ft",
    password: "password123",
    role: ROLES.SUPER_FT,
    roleTitle: "Supervising Exam Officer (Full-Time)",
    level: "500-600",
    department: "Department of Management",
    departmentId: "management",
    program: "Full-Time",
    description: "Supervises 100-400L FT. Enters 500L & 600L FT scores. Submits edit queries.",
  },
  {
    username: "super_pt",
    password: "password123",
    role: ROLES.SUPER_PT,
    roleTitle: "Supervising Exam Officer (Part-Time)",
    level: "500-600",
    department: "Department of Management",
    departmentId: "management",
    program: "Part-Time",
    description: "Supervises 100-400L PT. Enters 500L & 600L PT scores. Submits edit queries.",
  },
  {
    username: "hod",
    password: "password123",
    role: ROLES.HOD,
    roleTitle: "Head of Department (HOD) - Full-Time",
    level: "All",
    department: "Department of Management",
    departmentId: "management",
    program: "Full-Time",
    description: "Executive oversight of all records. Resolves queries & authorizes edits.",
  },

  // Global Administrative & Faculty-Wide Accounts (Access All 5 Departments)
  {
    username: "admin",
    password: "password123",
    role: ROLES.HOD,
    roleTitle: "Faculty System Administrator",
    level: "All",
    department: "All Departments",
    departmentId: "all",
    program: "All",
    description: "Universal administrative access across all 5 departments and all student records.",
  },
  {
    username: "dean",
    password: "password123",
    role: ROLES.HOD,
    roleTitle: "Dean of Faculty (Management Sciences)",
    level: "All",
    department: "All Departments",
    departmentId: "all",
    program: "All",
    description: "Executive faculty-wide oversight across all departmental programs and batches.",
  },
];
 
export function getUsersForTrack(deptId, program) {
  const legacyUsernames = ["officer100", "officer200", "officer300", "officer400", "super_ft", "super_pt", "hod"];
  return DEFAULT_USERS.filter((u) => {
    if (legacyUsernames.includes(u.username)) return false;
    if (deptId === "all") return u.departmentId === "all";
    if (u.departmentId !== deptId) return false;
    if (program && program !== "All" && u.program !== program) return false;
    return true;
  });
}

const STORAGE_KEY_AUTH = "cdrms_auth_session";
const STORAGE_KEY_USER_CREDS = "cdrms_user_credentials";
const STORAGE_KEY_RESET_REQUESTS = "cdrms_password_reset_requests";

class AuthService {
  constructor() {
    this._credentialsCache = null;
    this._resetRequestsCache = null;
    this.currentUser = this._loadUser();
  }

  _getUserCredentials() {
    if (this._credentialsCache) {
      return this._credentialsCache;
    }
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEY_USER_CREDS);
        if (data) {
          this._credentialsCache = JSON.parse(data);
          return this._credentialsCache;
        }
      }
    } catch (e) {
      console.error("Error reading credentials state:", e);
    }
    this._credentialsCache = {};
    return this._credentialsCache;
  }

  _saveUserCredentials(creds) {
    this._credentialsCache = { ...creds };
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY_USER_CREDS, JSON.stringify(creds));
      }
    } catch (e) {
      console.error("Error saving credentials state:", e);
    }
  }

  getUserPasswordInfo(username) {
    const creds = this._getUserCredentials();
    const key = (username || "").toLowerCase().trim();
    if (creds[key]) {
      return creds[key];
    }
    // Default initial password and hasChangedPassword = false
    return {
      password: "password123",
      hasChangedPassword: false,
    };
  }

  _loadUser() {
    try {
      let data = null;
      if (typeof localStorage !== "undefined") {
        data = localStorage.getItem(STORAGE_KEY_AUTH);
      }
      if (!data && typeof sessionStorage !== "undefined") {
        data = sessionStorage.getItem(STORAGE_KEY_AUTH);
      }
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed?.username) {
          const credInfo = this.getUserPasswordInfo(parsed.username);
          parsed.mustChangePassword = !credInfo.hasChangedPassword;
        }
        return parsed;
      }
    } catch (e) {
      console.error("Error reading auth state:", e);
    }
    return null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  login(username, password) {
    const cleanUser = (username || "").trim().toLowerCase();
    const user = DEFAULT_USERS.find(
      (u) => u.username.toLowerCase() === cleanUser
    );

    if (!user) {
      return { success: false, message: "Invalid username or password. Please check your credentials." };
    }

    const credInfo = this.getUserPasswordInfo(cleanUser);
    if (password !== credInfo.password) {
      return { success: false, message: "Invalid username or password. Please check your credentials." };
    }

    const mustChangePassword = !credInfo.hasChangedPassword;

    this.currentUser = {
      ...user,
      mustChangePassword,
    };
    delete this.currentUser.password;

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
    }

    return {
      success: true,
      user: this.currentUser,
      mustChangePassword,
    };
  }

  changePassword(username, currentPassword, newPassword) {
    const cleanUser = (username || "").trim().toLowerCase();
    const user = DEFAULT_USERS.find(
      (u) => u.username.toLowerCase() === cleanUser
    );

    if (!user) {
      return { success: false, message: "User account not found." };
    }

    const credInfo = this.getUserPasswordInfo(cleanUser);
    if (currentPassword !== credInfo.password) {
      return { success: false, message: "Current password does not match our records." };
    }

    const trimmedNew = (newPassword || "").trim();
    if (trimmedNew.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    if (trimmedNew === "password123") {
      return {
        success: false,
        message: "New password cannot be the default 'password123'. Please choose a secure personalized password.",
      };
    }

    if (trimmedNew === currentPassword) {
      return { success: false, message: "New password must be different from your current password." };
    }

    const creds = this._getUserCredentials();
    creds[cleanUser] = {
      password: trimmedNew,
      hasChangedPassword: true,
      updatedAt: new Date().toISOString(),
    };
    this._saveUserCredentials(creds);

    if (this.currentUser && this.currentUser.username.toLowerCase() === cleanUser) {
      this.currentUser.mustChangePassword = false;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
      }
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
      }
    }

    return {
      success: true,
      user: this.currentUser,
      message: "Password updated successfully! Welcome to your departmental workspace.",
    };
  }

  resetPasswordToDefault(username, authorizedBy = null) {
    const cleanUser = (username || "").trim().toLowerCase();
    const user = DEFAULT_USERS.find(
      (u) => u.username.toLowerCase() === cleanUser
    );

    if (!user) {
      return { success: false, message: `Officer account '${username}' was not found.` };
    }

    const creds = this._getUserCredentials();
    creds[cleanUser] = {
      password: "password123",
      hasChangedPassword: false,
      resetAt: new Date().toISOString(),
      resetBy: authorizedBy || "Self-Service Recovery",
    };
    this._saveUserCredentials(creds);

    // If currently logged in as this user, flag them to change password
    if (this.currentUser && this.currentUser.username.toLowerCase() === cleanUser) {
      this.currentUser.mustChangePassword = true;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
      }
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.currentUser));
      }
    }

    return {
      success: true,
      user,
      message: `Password for ${user.roleTitle} (${user.username}) has been reset to default 'password123'. Next sign-in will require setting a new password.`,
    };
  }

  _getResetRequests() {
    if (this._resetRequestsCache) {
      return this._resetRequestsCache;
    }
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEY_RESET_REQUESTS);
        if (data) {
          this._resetRequestsCache = JSON.parse(data);
          return this._resetRequestsCache;
        }
      }
    } catch (e) {
      console.error("Error reading reset requests:", e);
    }
    this._resetRequestsCache = [];
    return this._resetRequestsCache;
  }

  _saveResetRequests(requests) {
    this._resetRequestsCache = [...requests];
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY_RESET_REQUESTS, JSON.stringify(requests));
      }
    } catch (e) {
      console.error("Error saving reset requests:", e);
    }
  }

  createPasswordResetRequest(username, reason = "") {
    const cleanUser = (username || "").trim().toLowerCase();
    const user = DEFAULT_USERS.find(
      (u) => u.username.toLowerCase() === cleanUser
    );

    if (!user) {
      return { success: false, message: `Officer account '${username}' does not exist.` };
    }

    const requests = this._getResetRequests();
    // Check if there is already an active pending request
    const existing = requests.find(
      (r) =>
        r.username.toLowerCase() === cleanUser &&
        (r.status === "PENDING_HEAD_OFFICER" || r.status === "APPROVED_BY_HEAD_OFFICER")
    );

    if (existing) {
      return {
        success: true,
        alreadyPending: true,
        request: existing,
        message: existing.status === "PENDING_HEAD_OFFICER"
          ? "A password reset request is already pending review by the Head Examination Officer."
          : "Your request was approved by the Head Examination Officer and is awaiting final HOD authorization.",
      };
    }

    const isSupervisorSelf =
      user.role === ROLES.SUPERVISING ||
      user.role === ROLES.SUPER_FT ||
      user.role === ROLES.SUPER_PT;

    const newReq = {
      id: "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      username: user.username,
      roleTitle: user.roleTitle,
      departmentId: user.departmentId,
      department: user.department,
      program: user.program,
      level: user.level,
      reason: reason || "Forgot password recovery",
      requestedAt: new Date().toISOString(),
      // Head Exam Officer reports directly to HOD
      status: isSupervisorSelf ? "APPROVED_BY_HEAD_OFFICER" : "PENDING_HEAD_OFFICER",
      headOfficerApproval: isSupervisorSelf
        ? {
            approvedBy: "Direct Executive Officer (Self)",
            officerUsername: user.username,
            approvedAt: new Date().toISOString(),
            note: "Head Exam Officer account resets proceed directly to HOD executive clearance.",
          }
        : null,
      hodExecution: null,
    };

    requests.unshift(newReq);
    this._saveResetRequests(requests);

    return {
      success: true,
      request: newReq,
      message: newReq.status === "PENDING_HEAD_OFFICER"
        ? `Password reset request submitted for ${user.roleTitle}. Forwarded to Head Examination Officer for security verification.`
        : `Password reset request submitted for ${user.roleTitle}. Forwarded to Head of Department (HOD) for final execution.`,
    };
  }

  getResetRequests(deptId = null, program = null) {
    const list = this._getResetRequests();
    return list.filter((r) => {
      if (deptId && r.departmentId !== deptId) return false;
      if (program && program !== "All" && r.program !== program) return false;
      return true;
    });
  }

  headOfficerApproveResetRequest(requestId, headOfficer, note = "") {
    const requests = this._getResetRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      return { success: false, message: "Reset request not found." };
    }

    requests[idx].status = "APPROVED_BY_HEAD_OFFICER";
    requests[idx].headOfficerApproval = {
      approvedBy: headOfficer.roleTitle || headOfficer.username,
      officerUsername: headOfficer.username,
      approvedAt: new Date().toISOString(),
      note: note.trim() || "Verified by Head Examination Officer. Recommended for HOD reset.",
    };

    this._saveResetRequests(requests);

    return {
      success: true,
      request: requests[idx],
      message: `Reset request for ${requests[idx].roleTitle} approved and forwarded to Head of Department (HOD) for final execution.`,
    };
  }

  headOfficerRejectResetRequest(requestId, headOfficer, reason = "") {
    const requests = this._getResetRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      return { success: false, message: "Reset request not found." };
    }

    requests[idx].status = "REJECTED_BY_HEAD_OFFICER";
    requests[idx].rejection = {
      rejectedBy: headOfficer.roleTitle || headOfficer.username,
      rejectedAt: new Date().toISOString(),
      reason: reason.trim() || "Declined by Head Examination Officer.",
    };

    this._saveResetRequests(requests);

    return {
      success: true,
      request: requests[idx],
      message: `Reset request for ${requests[idx].roleTitle} was declined.`,
    };
  }

  hodExecuteResetRequest(requestId, hodUser) {
    const requests = this._getResetRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: "Reset request not found." };
    }

    if (req.status !== "APPROVED_BY_HEAD_OFFICER") {
      return {
        success: false,
        message: "Policy Violation: The Head Examination Officer must endorse this request before the HOD can execute a password reset.",
      };
    }

    // Execute actual password reset back to default 'password123'
    const resetResult = this.resetPasswordToDefault(
      req.username,
      `HOD ${hodUser.roleTitle || hodUser.username} (Cleared by Head Exam Officer: ${req.headOfficerApproval?.approvedBy || "Yes"})`
    );

    if (!resetResult.success) {
      return resetResult;
    }

    req.status = "EXECUTED";
    req.hodExecution = {
      executedBy: hodUser.roleTitle || hodUser.username,
      executedAt: new Date().toISOString(),
    };

    this._saveResetRequests(requests);

    return {
      success: true,
      message: `Password for ${req.roleTitle} (${req.username}) was successfully reset to default 'password123' with Head Exam Officer endorsement.`,
      request: req,
    };
  }

  getOfficerSecurityList(deptId, program) {
    const officers = getUsersForTrack(deptId, program);
    const requests = this._getResetRequests();

    return officers.map((u) => {
      const credInfo = this.getUserPasswordInfo(u.username);
      const activeReq = requests.find(
        (r) =>
          r.username.toLowerCase() === u.username.toLowerCase() &&
          (r.status === "PENDING_HEAD_OFFICER" || r.status === "APPROVED_BY_HEAD_OFFICER")
      );

      return {
        ...u,
        hasChangedPassword: credInfo.hasChangedPassword,
        updatedAt: credInfo.updatedAt || null,
        resetAt: credInfo.resetAt || null,
        resetBy: credInfo.resetBy || null,
        activeResetRequest: activeReq || null,
      };
    });
  }

  logout() {
    this.currentUser = null;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem("cdrms_auth_user");
      }
    } catch (e) {}
  }

  // Permission Checks
  canAccessLevel(user, targetLevel) {
    if (!user) return false;
    if (user.role === ROLES.HOD) return true;

    if (
      user.role === ROLES.SUPERVISING ||
      user.role === ROLES.SUPER_FT ||
      user.role === ROLES.SUPER_PT
    ) {
      // Supervising officers oversee 100-400 and enter 500-600
      return true;
    }

    // Level officers only have access to their exact level
    return String(user.level) === String(targetLevel);
  }

  canAccessProgram(user, targetProgram) {
    if (!user) return false;
    return user.program === targetProgram || user.program === "All";
  }

  canAccessDepartment(user, targetDept) {
    if (!user) return false;
    return user.department === targetDept || user.departmentId === targetDept;
  }

  canEnterScores(user, targetLevel, targetProgram) {
    if (!user) return false;
    if (user.role === ROLES.HOD) return false; // HOD only edits via Query Center

    // 100L - 400L Exam Officers
    if (
      user.role === ROLES.OFFICER_100 ||
      user.role === ROLES.OFFICER_200 ||
      user.role === ROLES.OFFICER_300 ||
      user.role === ROLES.OFFICER_400
    ) {
      return String(user.level) === String(targetLevel) && user.program === targetProgram;
    }

    // Supervising Officers enter scores specifically for 500L and 600L in their program
    if (user.role === ROLES.SUPER_FT || (user.role === ROLES.SUPERVISING && user.program === "Full-Time")) {
      return (String(targetLevel) === "500" || String(targetLevel) === "600") && targetProgram === "Full-Time";
    }
    if (user.role === ROLES.SUPER_PT || (user.role === ROLES.SUPERVISING && user.program === "Part-Time")) {
      return (String(targetLevel) === "500" || String(targetLevel) === "600") && targetProgram === "Part-Time";
    }

    return false;
  }

  canQueryResults(user) {
    if (!user) return false;
    return (
      user.role === ROLES.SUPERVISING ||
      user.role === ROLES.SUPER_FT ||
      user.role === ROLES.SUPER_PT
    );
  }

  canResolveAndEdit(user) {
    if (!user) return false;
    return user.role === ROLES.HOD;
  }
}

export const auth = new AuthService();

export function isHeadExamOfficer(user) {
  if (!user) return false;
  return (
    user.role === ROLES.SUPERVISING ||
    user.role === ROLES.SUPER_FT ||
    user.role === ROLES.SUPER_PT
  );
}

export function isHOD(user) {
  if (!user) return false;
  return user.role === ROLES.HOD;
}
