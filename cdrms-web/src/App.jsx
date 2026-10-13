import React, { useState, useEffect, useMemo } from "react";
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

import { db } from "./services/db";
import { testCloudConnection } from "./services/supabase";
import { auth, ROLES } from "./services/auth";
import "./App.css";

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => auth.getCurrentUser());

  // Database state
  const [students, setStudents] = useState(() => db.getStudents());
  const [courses, setCourses] = useState(() => db.getCourses());
  const [results, setResults] = useState(() => db.getAllData().results);
  const [queries, setQueries] = useState(() => db.getQueries());
  const [auditLogs, setAuditLogs] = useState(() => db.getAuditLogs());

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

  // Check initial cloud connection on mount
  useEffect(() => {
    async function checkCloud() {
      setCloudChecking(true);
      try {
        const res = await testCloudConnection();
        setCloudConnected(res.success && !res.schemaNeeded);
      } catch (e) {
        setCloudConnected(false);
      } finally {
        setCloudChecking(false);
      }
    }
    checkCloud();
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
    if (!currentUser?.department) return students;
    return students.filter((s) => {
      const sDept = (s.department || "").toLowerCase().trim();
      const uDept = (currentUser.department || "").toLowerCase().trim();
      const uDeptId = (currentUser.departmentId || "").toLowerCase().trim();
      return (
        sDept === uDept ||
        sDept === uDeptId ||
        (uDeptId === "management" &&
          (sDept === "management" ||
            (sDept.includes("management") &&
              !sDept.includes("project") &&
              !sDept.includes("employee") &&
              !sDept.includes("innovation") &&
              !sDept.includes("procurement")))) ||
        (uDeptId === "project_management" && sDept.includes("project")) ||
        (uDeptId === "employee_relations" && sDept.includes("employee")) ||
        (uDeptId === "innovation_entrepreneurship" &&
          (sDept.includes("innovation") || sDept.includes("entrepreneurship"))) ||
        (uDeptId === "procurement_management" && sDept.includes("procurement"))
      );
    });
  }, [students, currentUser]);

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
        onRefresh={refreshData}
        currentUser={currentUser}
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
        pendingQueriesCount={pendingQueriesCount}
      />

      {/* 2. MAIN 3-COLUMN BODY */}
      <main className="main-workspace">
        {/* Left Column: Records Tree */}
        <Sidebar
          batches={batches}
          selectedBatch={selectedBatch}
          onSelectBatch={setSelectedBatch}
          activeProgram={activeProgram}
          onSelectProgram={setActiveProgram}
          totalStudents={students.length}
          fullTimeCount={fullTimeCount}
          partTimeCount={partTimeCount}
          coursesCount={courses.length}
          cloudConnected={cloudConnected}
          currentUser={currentUser}
        />

        {/* Center Column: Main Student Table */}
        <StudentList
          students={filteredStudents}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
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
        />

        {/* Right Column: Quick Overview */}
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
    </div>
  );
}
