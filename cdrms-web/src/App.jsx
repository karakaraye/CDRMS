import React, { useState, useEffect, useMemo } from "react";
import { Users, FolderOpen, User } from "lucide-react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StudentList from "./components/StudentList";
import StudentOverview from "./components/StudentOverview";
import StudentModal from "./components/StudentModal";
import CourseManagerModal from "./components/CourseManagerModal";
import WorksheetModal from "./components/WorksheetModal";
import TranscriptModal from "./components/TranscriptModal";
import CloudSettingsModal from "./components/CloudSettingsModal";
import LoginPage from "./components/LoginPage";
import QueriesModal from "./components/QueriesModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import ExcelResultUploadModal from "./components/ExcelResultUploadModal";

import { db } from "./services/db";
import { testCloudConnection, pullAllFromCloud, subscribeToRealtime } from "./services/supabase";
import { auth, ROLES, DEPARTMENTS } from "./services/auth";
import "./App.css";

export default function App() {
  // Mobile active tab state: "students" | "sidebar" | "overview"
  const [mobileTab, setMobileTab] = useState("students");

  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => auth.getCurrentUser());

  // Database state
  const [students, setStudents] = useState(() => db.getStudents());
  const [courses, setCourses] = useState(() => db.getCourses());
  const [results, setResults] = useState(() => db.getAllData().results);
  const [queries, setQueries] = useState(() => db.getQueries());
  const [auditLogs, setAuditLogs] = useState(() => db.getAuditLogs());

  // Department filter state: "all" or specific deptId
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState(() => {
    const u = auth.getCurrentUser();
    if (!u || u.departmentId === "all" || u.department === "All Departments") return "all";
    return u.departmentId || "all";
  });

  // Filter & Selection state
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    const list = db.getStudents();
    return list.length > 0 ? list[0].id : null;
  });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeProgram, setActiveProgram] = useState(() => {
    const u = auth.getCurrentUser();
    if (u && u.program && u.program !== "All") return u.program;
    return "Full-Time";
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Cloud state
  const [cloudConnected, setCloudConnected] = useState(false);
  const [cloudChecking, setCloudChecking] = useState(true);

  // Modal Dialogs state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [isCourseManagerOpen, setIsCourseManagerOpen] = useState(false);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);
  const [worksheetStudentId, setWorksheetStudentId] = useState(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [transcriptStudentId, setTranscriptStudentId] = useState(null);
  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState(false);
  const [isQueriesModalOpen, setIsQueriesModalOpen] = useState(false);
  const [queriesModalTab, setQueriesModalTab] = useState("list");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);

  // Auto-sync with cloud on mount and listen to realtime updates across all laptops
  useEffect(() => {
    let unsubscribe = null;

    async function initCloudSync() {
      setCloudChecking(true);
      try {
        const res = await testCloudConnection();
        const isOk = res.success && !res.schemaNeeded;
        setCloudConnected(isOk);

        if (isOk) {
          // Immediately sync cloud credentials & reset requests across devices
          auth.syncCloudCredentials().catch(() => {});
          auth.syncCloudResetRequests().catch(() => {});

          // Immediately fetch the latest cloud database records so all laptops see fresh data
          try {
            const cloudData = await pullAllFromCloud();
            db.setAllFromCloud(cloudData);
            refreshData();
          } catch (e) {
            console.warn("Initial cloud data pull error:", e);
          }

          // Subscribe to live multi-user changes from other laptops
          unsubscribe = subscribeToRealtime(async (payload) => {
            console.log("Realtime event from another user:", payload);
            try {
              if (payload?.table === "officer_credentials") {
                auth.syncCloudCredentials().catch(() => {});
                return;
              }
              if (payload?.table === "officer_reset_requests") {
                auth.syncCloudResetRequests().catch(() => {});
                return;
              }
              const freshData = await pullAllFromCloud();
              db.setAllFromCloud(freshData);
              refreshData();
            } catch (err) {
              console.warn("Realtime re-fetch error:", err);
            }
          });
        }
      } catch (e) {
        setCloudConnected(false);
      } finally {
        setCloudChecking(false);
      }
    }

    initCloudSync();

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setStudentToEdit(null);
        setIsStudentModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reload views
  const refreshData = () => {
    const s = db.getStudents();
    const c = db.getCourses();
    const r = db.getAllData().results;
    const q = db.getQueries();
    const a = db.getAuditLogs();
    setStudents(s);
    setCourses(c);
    setResults(r);
    setQueries(q);
    setAuditLogs(a);
    if (selectedStudentId && !s.some((item) => String(item.id) === String(selectedStudentId))) {
      setSelectedStudentId(s.length > 0 ? s[0].id : null);
    }
  };

  // Manual cloud refresh handler
  const handleManualRefresh = async () => {
    setCloudChecking(true);
    try {
      const cloudData = await pullAllFromCloud();
      db.setAllFromCloud(cloudData);
    } catch (e) {
      console.warn("Manual refresh pull error:", e);
    } finally {
      setCloudChecking(false);
      refreshData();
    }
  };

  // Keep all data synchronized whenever current user session changes
  useEffect(() => {
    refreshData();
  }, [currentUser]);

  // Auth logout handler
  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
  };

  // Student CRUD
  const handleSaveStudent = async (studentData) => {
    await db.saveStudent(studentData);
    refreshData();
    if (!studentData.id) {
      // newly created student
      const updated = db.getStudents();
      if (updated.length > 0) setSelectedStudentId(updated[0].id);
    }
  };

  const handleDeleteStudent = async (id) => {
    await db.deleteStudent(id);
    refreshData();
    const remaining = db.getStudents();
    setSelectedStudentId(remaining.length > 0 ? remaining[0].id : null);
  };

  // Course CRUD
  const handleSaveCourse = async (courseData) => {
    await db.saveCourse(courseData);
    refreshData();
  };

  const handleDeleteCourse = async (id) => {
    await db.deleteCourse(id);
    refreshData();
  };

  // Results saving
  const handleSaveResults = async (resultsList) => {
    await db.saveBulkResults(resultsList);
    refreshData();
  };

  // Queries Handlers
  const handleCreateQuery = (queryData) => {
    const created = db.createQuery(queryData);
    setQueries(db.getQueries());
    setAuditLogs(db.getAuditLogs());
    return created;
  };

  const handleResolveQuery = async (queryId, approvedScore, note, resolvedBy) => {
    await db.resolveQuery(queryId, approvedScore, note, resolvedBy);
    refreshData();
  };

  const handleRejectQuery = async (queryId, note, resolvedBy) => {
    db.rejectQuery(queryId, note, resolvedBy);
    setQueries(db.getQueries());
    setAuditLogs(db.getAuditLogs());
  };

  const pendingQueriesCount = useMemo(() => {
    return queries.filter((q) => q.status === "PENDING").length;
  }, [queries]);

  // Cloud synced data handler
  const handleDataSynced = (cloudData) => {
    db.setAllFromCloud(cloudData);
    refreshData();
  };

  // Department-scoped students
  const deptStudents = useMemo(() => {
    if (!selectedDepartmentFilter || selectedDepartmentFilter === "all") return students;
    return students.filter((s) => {
      const sDept = (s.department || "").toLowerCase().trim();
      return (
        (selectedDepartmentFilter === "management" &&
          (sDept === "management" ||
            (sDept.includes("management") &&
              !sDept.includes("project") &&
              !sDept.includes("employee") &&
              !sDept.includes("innovation") &&
              !sDept.includes("procurement")))) ||
        (selectedDepartmentFilter === "project_management" && sDept.includes("project")) ||
        (selectedDepartmentFilter === "employee_relations" && sDept.includes("employee")) ||
        (selectedDepartmentFilter === "innovation_entrepreneurship" &&
          (sDept.includes("innovation") || sDept.includes("entrepreneurship"))) ||
        (selectedDepartmentFilter === "procurement_management" && sDept.includes("procurement"))
      );
    });
  }, [students, selectedDepartmentFilter]);

  // Filtered students computation
  const filteredStudents = useMemo(() => {
    return deptStudents.filter((s) => {
      // Role program restriction (e.g. Supervising FT vs PT)
      if (currentUser?.program && currentUser.program !== "All") {
        const prog = s.student_type || "Full-Time";
        if (prog !== currentUser.program) return false;
      }
      // Program filter
      if (activeProgram !== "All") {
        const prog = s.student_type || "Full-Time";
        if (prog !== activeProgram) return false;
      }
      // Batch filter
      if (selectedBatch) {
        if (s.batch !== selectedBatch) return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matricMatch = s.matric_no?.toLowerCase().includes(q);
        const nameMatch = s.fullname?.toLowerCase().includes(q);
        const batchMatch = s.batch?.toLowerCase().includes(q);
        if (!matricMatch && !nameMatch && !batchMatch) return false;
      }
      return true;
    });
  }, [deptStudents, activeProgram, selectedBatch, searchTerm, currentUser]);

  // Active selected student object
  const currentStudent = useMemo(() => {
    return filteredStudents.find((s) => String(s.id) === String(selectedStudentId)) || filteredStudents[0] || null;
  }, [filteredStudents, selectedStudentId]);

  // Batches scoped to current department
  const batches = useMemo(() => {
    const set = new Set();
    deptStudents.forEach((s) => {
      if (s.batch) set.add(s.batch);
    });
    return Array.from(set).sort();
  }, [deptStudents]);

  // Counts scoped to current department
  const fullTimeCount = useMemo(
    () => deptStudents.filter((s) => (s.student_type || "Full-Time") === "Full-Time").length,
    [deptStudents]
  );
  const partTimeCount = useMemo(
    () => deptStudents.filter((s) => s.student_type === "Part-Time").length,
    [deptStudents]
  );

  // If not logged in, render LoginPage as landing screen
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.departmentId === "all" || user.department === "All Departments") {
            setSelectedDepartmentFilter("all");
          } else if (user.departmentId) {
            setSelectedDepartmentFilter(user.departmentId);
          }
          if (user.program && user.program !== "All") {
            setActiveProgram(user.program);
          } else {
            setActiveProgram("Full-Time");
          }
        }}
      />
    );
  }

  return (
    <div className="app-wrapper">
      {/* 1. TOP NAVBAR */}
      <Navbar
        cloudConnected={cloudConnected}
        cloudChecking={cloudChecking}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenAddStudent={() => {
          setStudentToEdit(null);
          setIsStudentModalOpen(true);
        }}
        onOpenCourses={() => setIsCourseManagerOpen(true)}
        onOpenWorksheet={() => {
          setWorksheetStudentId(selectedStudentId || (students.length > 0 ? students[0].id : null));
          setIsWorksheetOpen(true);
        }}
        onOpenTranscript={() => {
          setTranscriptStudentId(selectedStudentId || (students.length > 0 ? students[0].id : null));
          setIsTranscriptOpen(true);
        }}
        onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
        onRefresh={handleManualRefresh}
        currentUser={currentUser}
        departments={DEPARTMENTS}
        selectedDepartmentFilter={selectedDepartmentFilter}
        onSelectDepartmentFilter={setSelectedDepartmentFilter}
        allStudents={students}
        onLogout={handleLogout}
        onOpenQueries={() => {
          setQueriesModalTab("list");
          setIsQueriesModalOpen(true);
        }}
        onOpenAuditTrail={() => {
          setQueriesModalTab("audit");
          setIsQueriesModalOpen(true);
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenOfficerAccounts={() => {
          setQueriesModalTab("security");
          setIsQueriesModalOpen(true);
        }}
        onOpenExcelUpload={() => setIsExcelUploadOpen(true)}
        pendingQueriesCount={pendingQueriesCount}
      />

      {/* 2. MAIN 3-COLUMN BODY */}
      <main className="main-workspace">
        {/* MOBILE VIEW SWITCHER (visible only on screens <= 768px) */}
        <div className="mobile-view-tabs-bar">
          <button
            type="button"
            className={`mobile-tab-btn ${mobileTab === "students" ? "active" : ""}`}
            onClick={() => setMobileTab("students")}
          >
            <Users size={14} />
            <span>Students ({filteredStudents.length})</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${mobileTab === "sidebar" ? "active" : ""}`}
            onClick={() => setMobileTab("sidebar")}
          >
            <FolderOpen size={14} />
            <span>Filter & Batches</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${mobileTab === "overview" ? "active" : ""}`}
            onClick={() => setMobileTab("overview")}
          >
            <User size={14} />
            <span>Student Biodata</span>
          </button>
        </div>

        {/* Left Column: Records Tree */}
        <div className={`workspace-col-sidebar ${mobileTab === "sidebar" ? "mobile-show" : "mobile-hide"}`}>
          <Sidebar
            batches={batches}
            selectedBatch={selectedBatch}
            onSelectBatch={(b) => {
              setSelectedBatch(b);
              setMobileTab("students");
            }}
            activeProgram={activeProgram}
            onSelectProgram={(p) => {
              setActiveProgram(p);
              setMobileTab("students");
            }}
            totalStudents={students.length}
            fullTimeCount={fullTimeCount}
            partTimeCount={partTimeCount}
            coursesCount={courses.length}
            cloudConnected={cloudConnected}
            currentUser={currentUser}
          />
        </div>

        {/* Center Column: Main Student Table */}
        <div className={`workspace-col-students ${mobileTab === "students" ? "mobile-show" : "mobile-hide"}`}>
          <StudentList
            students={filteredStudents}
            selectedStudentId={selectedStudentId}
            onSelectStudent={(id) => {
              setSelectedStudentId(id);
            }}
            onEditStudent={(s) => {
              setStudentToEdit(s);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onOpenWorksheet={(id) => {
              setSelectedStudentId(id);
              setWorksheetStudentId(id);
              setIsWorksheetOpen(true);
            }}
            onOpenTranscript={(id) => {
              setSelectedStudentId(id);
              setTranscriptStudentId(id);
              setIsTranscriptOpen(true);
            }}
            onOpenAddStudent={() => {
              setStudentToEdit(null);
              setIsStudentModalOpen(true);
            }}
            activeProgram={activeProgram}
            onSelectProgram={setActiveProgram}
            selectedBatch={selectedBatch}
            searchTerm={searchTerm}
            currentUser={currentUser}
            allStudentsCount={students.length}
            selectedDepartmentFilter={selectedDepartmentFilter}
            onSwitchToAllDepartments={() => setSelectedDepartmentFilter("all")}
          />
        </div>

        {/* Right Column: Quick Overview */}
        <div className={`workspace-col-overview ${mobileTab === "overview" ? "mobile-show" : "mobile-hide"}`}>
          <StudentOverview
            student={currentStudent}
            results={results}
            courses={courses}
            onOpenTranscript={(id) => {
              setTranscriptStudentId(id);
              setIsTranscriptOpen(true);
            }}
            onOpenWorksheet={(id) => {
              setWorksheetStudentId(id);
              setIsWorksheetOpen(true);
            }}
            onEditStudent={(s) => {
              setStudentToEdit(s);
              setIsStudentModalOpen(true);
            }}
          />
        </div>
      </main>

      {/* 3. MODALS */}
      {isStudentModalOpen && (
        <StudentModal
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          onSave={handleSaveStudent}
          studentToEdit={studentToEdit}
          currentUser={currentUser}
        />
      )}

      {isCourseManagerOpen && (
        <CourseManagerModal
          isOpen={isCourseManagerOpen}
          onClose={() => setIsCourseManagerOpen(false)}
          courses={courses}
          onSaveCourse={handleSaveCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      )}

      {isWorksheetOpen && (
        <WorksheetModal
          isOpen={isWorksheetOpen}
          onClose={() => setIsWorksheetOpen(false)}
          students={filteredStudents.length > 0 ? filteredStudents : students}
          courses={courses}
          results={results}
          initialStudentId={worksheetStudentId}
          onSaveResults={handleSaveResults}
          currentUser={currentUser}
          onOpenQueryModal={(resId) => {
            setIsWorksheetOpen(false);
            setIsQueriesModalOpen(true);
          }}
          onOpenExcelUpload={() => {
            setIsWorksheetOpen(false);
            setIsExcelUploadOpen(true);
          }}
        />
      )}

      {isTranscriptOpen && (
        <TranscriptModal
          isOpen={isTranscriptOpen}
          onClose={() => setIsTranscriptOpen(false)}
          student={students.find((s) => String(s.id) === String(transcriptStudentId)) || currentStudent}
          courses={courses}
          results={results}
        />
      )}

      {isCloudSettingsOpen && (
        <CloudSettingsModal
          isOpen={isCloudSettingsOpen}
          onClose={() => setIsCloudSettingsOpen(false)}
          cloudConnected={cloudConnected}
          onCloudStatusChange={setCloudConnected}
          allData={db.getAllData()}
          onDataSynced={handleDataSynced}
        />
      )}

      {isQueriesModalOpen && (
        <QueriesModal
          isOpen={isQueriesModalOpen}
          onClose={() => setIsQueriesModalOpen(false)}
          currentUser={currentUser}
          queries={queries}
          students={students}
          courses={courses}
          results={results}
          auditLogs={auditLogs}
          onCreateQuery={handleCreateQuery}
          onResolveQuery={handleResolveQuery}
          onRejectQuery={handleRejectQuery}
          initialTab={queriesModalTab}
        />
      )}

      {/* Mandatory First-Time Login Password Change or Voluntary Security Modal */}
      {(Boolean(currentUser?.mustChangePassword) || isChangePasswordOpen) && (
        <ChangePasswordModal
          isOpen={Boolean(currentUser?.mustChangePassword || isChangePasswordOpen)}
          isMandatory={Boolean(currentUser?.mustChangePassword)}
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onSuccess={(updatedUser) => {
            setCurrentUser(
              updatedUser
                ? { ...updatedUser, mustChangePassword: false }
                : { ...auth.getCurrentUser(), mustChangePassword: false }
            );
            setIsChangePasswordOpen(false);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Excel Broadsheet Result Processor Modal */}
      {isExcelUploadOpen && (
        <ExcelResultUploadModal
          isOpen={isExcelUploadOpen}
          onClose={() => setIsExcelUploadOpen(false)}
          students={students}
          courses={courses}
          results={results}
          currentUser={currentUser}
          onResultsSaved={refreshData}
        />
      )}
    </div>
  );
}
