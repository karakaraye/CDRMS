import React, { useState } from "react";
import {
  GraduationCap,
  Lock,
  User,
  ShieldCheck,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  Briefcase,
  Users,
  Lightbulb,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { DEPARTMENTS, getUsersForTrack, auth } from "../services/auth";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function LoginPage({ onLoginSuccess }) {
  // Navigation state: "departments" | "divisions" | "officers"
  const [step, setStep] = useState("departments");
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState("Full-Time");
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // Form credentials state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Map icons to departments
  const getDeptIcon = (deptId) => {
    switch (deptId) {
      case "management":
        return <Building size={26} className="dept-icon-svg" />;
      case "project_management":
        return <Briefcase size={26} className="dept-icon-svg" />;
      case "employee_relations":
        return <Users size={26} className="dept-icon-svg" />;
      case "innovation_entrepreneurship":
        return <Lightbulb size={26} className="dept-icon-svg" />;
      case "procurement_management":
        return <Truck size={26} className="dept-icon-svg" />;
      default:
        return <Building size={26} className="dept-icon-svg" />;
    }
  };

  // Step 1: Department selection handler
  const handleSelectDepartment = (dept) => {
    setSelectedDept(dept);
    setSelectedOfficer(null);
    setUsername("");
    setPassword("");
    setError("");
    if (dept.hasPartTime) {
      // Management has both Full-Time and Part-Time
      setStep("divisions");
    } else {
      // Other 4 departments only have Full-Time
      setSelectedProgram("Full-Time");
      setStep("officers");
    }
  };

  // Step 2: Division selection handler (For Management)
  const handleSelectDivision = (prog) => {
    setSelectedProgram(prog);
    setSelectedOfficer(null);
    setUsername("");
    setPassword("");
    setError("");
    setStep("officers");
  };

  // Step 3: Officer selection handler (populates username for convenience, leaves password blank for manual entry)
  const handleSelectOfficer = (officer) => {
    setSelectedOfficer(officer);
    setUsername(officer.username);
    setPassword("");
    setError("");
  };

  // Standard form submission (requires manual credentials)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Please select or enter your officer username.");
      return;
    }
    if (!password) {
      setError("Please enter your password to sign in.");
      return;
    }
    const res = auth.login(username, password);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setError(res.message);
    }
  };

  // Reset back to Step 1
  const handleBackToDepartments = () => {
    setStep("departments");
    setSelectedDept(null);
    setSelectedOfficer(null);
    setError("");
  };

  // Reset back to Step 2
  const handleBackToDivisions = () => {
    if (selectedDept?.hasPartTime) {
      setStep("divisions");
    } else {
      handleBackToDepartments();
    }
    setError("");
  };

  const currentOfficers =
    selectedDept && selectedProgram
      ? getUsersForTrack(selectedDept.id, selectedProgram)
      : [];

  return (
    <div className="gateway-wrapper">
      {/* INSTITUTIONAL TOP BAR */}
      <header className="gateway-header">
        <div className="gateway-header-inner">
          <div className="gateway-brand">
            <img
              src="/uniport.jpeg"
              alt="Uniport Crest"
              className="gateway-logo"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="gateway-brand-text">
              <span className="gateway-institution">UNIVERSITY OF PORT HARCOURT</span>
              <span className="gateway-faculty">FACULTY OF MANAGEMENT SCIENCES</span>
              <h1 className="gateway-title">
                Comprehensive Departmental Result Management System (CDRMS)
              </h1>
            </div>
          </div>
          <div className="gateway-badge">
            <ShieldCheck size={16} />
            <span>Academic Examination Portal</span>
          </div>
        </div>
      </header>

      {/* STEP INDICATOR BREADCRUMB */}
      <div className="gateway-nav-bar">
        <div className="gateway-nav-inner">
          <div className="gateway-steps-trail">
            <button
              type="button"
              className={`gateway-step-pill ${step === "departments" ? "active" : "done"}`}
              onClick={handleBackToDepartments}
            >
              <span className="step-num">1</span>
              <span>Departments</span>
            </button>

            {selectedDept && (
              <>
                <span className="gateway-step-sep">/</span>
                {selectedDept.hasPartTime ? (
                  <button
                    type="button"
                    className={`gateway-step-pill ${step === "divisions" ? "active" : step === "officers" ? "done" : ""}`}
                    onClick={handleBackToDivisions}
                  >
                    <span className="step-num">2</span>
                    <span>{selectedDept.shortName} ({selectedProgram || "Division"})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="gateway-step-pill done"
                    onClick={handleBackToDepartments}
                  >
                    <span className="step-num">2</span>
                    <span>{selectedDept.shortName}</span>
                  </button>
                )}
              </>
            )}

            {step === "officers" && (
              <>
                <span className="gateway-step-sep">/</span>
                <span className="gateway-step-pill active">
                  <span className="step-num">3</span>
                  <span>Officer Authentication</span>
                </span>
              </>
            )}
          </div>

          {step !== "departments" && (
            <button
              type="button"
              className="gateway-back-btn"
              onClick={step === "officers" && selectedDept?.hasPartTime ? handleBackToDivisions : handleBackToDepartments}
            >
              <ArrowLeft size={14} />
              <span>{step === "officers" && selectedDept?.hasPartTime ? "Switch Division (FT/PT)" : "Change Department"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* STAGE 1: DEPARTMENT SELECTION (5 DEPARTMENTS) */}
      {/* ========================================================= */}
      {step === "departments" && (
        <main className="gateway-main-container">
          <div className="gateway-section-intro">
            <h2>Select Academic Department</h2>
            <p>
              Choose your department within the Faculty of Management Sciences to proceed
              to examination officer sign-in and result management records.
            </p>
          </div>

          <div className="department-cards-grid">
            {DEPARTMENTS.map((dept) => (
              <div
                key={dept.id}
                className={`dept-portal-card ${dept.hasPartTime ? "has-pt-badge" : ""}`}
                onClick={() => handleSelectDepartment(dept)}
              >
                <div className="dept-card-top">
                  <div className="dept-icon-wrapper">{getDeptIcon(dept.id)}</div>
                  <div className="dept-code-tag">{dept.code}</div>
                </div>

                <div className="dept-card-body">
                  <h3 className="dept-card-name">{dept.name}</h3>
                  <p className="dept-card-desc">{dept.description}</p>
                </div>

                <div className="dept-card-footer">
                  {dept.hasPartTime ? (
                    <div className="dept-modes-pill pill-dual">
                      <Sparkles size={13} />
                      <span>Full-Time & Part-Time Streams</span>
                    </div>
                  ) : (
                    <div className="dept-modes-pill pill-ft">
                      <GraduationCap size={13} />
                      <span>Full-Time Degree Stream</span>
                    </div>
                  )}
                  <div className="dept-select-action">
                    <span>Select Department</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: DIVISION SELECTION (DEPARTMENT OF MANAGEMENT FT vs PT) */}
      {/* ========================================================= */}
      {step === "divisions" && selectedDept && (
        <main className="gateway-main-container">
          <div className="gateway-section-intro">
            <span className="gateway-kicker">{selectedDept.name}</span>
            <h2>Select Academic Division & Study Mode</h2>
            <p>
              The Department of Management maintains completely separated examination
              officer boards for Full-Time and Part-Time student tracks.
            </p>
          </div>

          <div className="division-cards-grid">
            {/* FULL-TIME CARD */}
            <div
              className="division-card ft-division-card"
              onClick={() => handleSelectDivision("Full-Time")}
            >
              <div className="division-card-header">
                <div className="division-icon-box ft-icon-box">
                  <GraduationCap size={32} />
                </div>
                <span className="division-badge ft-badge">REGULAR DEGREE</span>
              </div>
              <div className="division-card-content">
                <h3>Full-Time Division</h3>
                <p>
                  Daytime degree curriculum. Supervised by Level Officers (100L–400L FT),
                  Full-Time Supervising Officer (500L/600L), and Head of Department.
                </p>
                <ul className="division-roles-list">
                  <li><CheckCircle2 size={13} /> 100L – 400L Full-Time Level Officers</li>
                  <li><CheckCircle2 size={13} /> Supervising Officer (Full-Time)</li>
                  <li><CheckCircle2 size={13} /> Head of Department (HOD - FT Module)</li>
                </ul>
              </div>
              <div className="division-card-action ft-action">
                <span>Access Full-Time Officers</span>
                <ChevronRight size={18} />
              </div>
            </div>

            {/* PART-TIME CARD */}
            <div
              className="division-card pt-division-card"
              onClick={() => handleSelectDivision("Part-Time")}
            >
              <div className="division-card-header">
                <div className="division-icon-box pt-icon-box">
                  <Clock size={32} />
                </div>
                <span className="division-badge pt-badge">EVENING / WEEKEND</span>
              </div>
              <div className="division-card-content">
                <h3>Part-Time Division</h3>
                <p>
                  Flexible evening and weekend curriculum. Supervised by dedicated Part-Time
                  Level Officers (100L–400L PT), Part-Time Supervising Officer, and HOD.
                </p>
                <ul className="division-roles-list">
                  <li><CheckCircle2 size={13} /> 100L – 400L Part-Time Level Officers</li>
                  <li><CheckCircle2 size={13} /> Supervising Officer (Part-Time)</li>
                  <li><CheckCircle2 size={13} /> Head of Department (HOD - PT Module)</li>
                </ul>
              </div>
              <div className="division-card-action pt-action">
                <span>Access Part-Time Officers</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: EXAM OFFICERS & LOGIN FORM */}
      {/* ========================================================= */}
      {step === "officers" && selectedDept && (
        <main className="gateway-main-container">
          <div className="gateway-section-intro officers-intro">
            <div className="officers-intro-titles">
              <span className="gateway-kicker">
                {selectedDept.name} • {selectedProgram} Division
              </span>
              <h2>Examination Officers Authentication</h2>
              <p>
                Select your designated role from the directory below or enter your credentials
                to sign in to your departmental workspace.
              </p>
            </div>
          </div>

          <div className="gateway-auth-layout">
            {/* LEFT COLUMN: 6 OFFICER TILES */}
            <div className="officers-directory-col">
              <div className="officers-directory-header">
                <h4>Designated Examination Officers ({selectedProgram})</h4>
                <span className="officers-count-badge">{currentOfficers.length} Authorized Roles</span>
              </div>

              <div className="officers-list-grid">
                {currentOfficers.map((u) => {
                  const isSelected = selectedOfficer?.username === u.username;
                  return (
                    <div
                      key={u.username}
                      className={`officer-select-card ${isSelected ? "selected-officer" : ""}`}
                      onClick={() => handleSelectOfficer(u)}
                    >
                      <div className="officer-card-header">
                        <div className="officer-role-title-box">
                          <span className="officer-role-name">{u.roleTitle}</span>
                          <span className="officer-level-pill">Level: {u.level}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="officer-check-icon" />}
                      </div>

                      <p className="officer-role-desc">{u.description}</p>

                      <div className="officer-card-bottom">
                        <span className="officer-user-chip">User: {u.username}</span>
                        <span className={`officer-select-chip ${isSelected ? "selected" : ""}`}>
                          {isSelected ? "Selected" : "Select Role"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: SECURE SIGN-IN FORM */}
            <div className="auth-form-col">
              <div className="auth-card">
                <div className="auth-card-top">
                  <div className="auth-card-icon">
                    <Lock size={22} />
                  </div>
                  <h3>Sign In to Dashboard</h3>
                  <p>Authenticate your session for {selectedDept.shortName} ({selectedProgram}).</p>
                </div>

                {selectedOfficer && (
                  <div className="selected-officer-banner">
                    <div className="banner-left">
                      <span className="banner-label">Selected Role:</span>
                      <strong className="banner-title">{selectedOfficer.roleTitle}</strong>
                      <span className="banner-user">Username: {selectedOfficer.username}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="login-error-alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="login-form">
                  <div className="form-group">
                    <label>
                      <User size={13} /> Officer Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. mgt_ft_100, pm_super, hod"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div className="pwd-label-row">
                      <label>
                        <Lock size={13} /> Secure Password
                      </label>
                      <button
                        type="button"
                        className="forgot-pwd-link-btn"
                        onClick={() => setIsForgotModalOpen(true)}
                        title="Reset forgotten password"
                      >
                        <RotateCcw size={12} />
                        <span>Forgot Password?</span>
                      </button>
                    </div>
                    <div className="password-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="pwd-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block login-btn">
                    <span>Authenticate & Access Records</span>
                    <ChevronRight size={16} />
                  </button>
                </form>

                <div className="auth-security-box">
                  <ShieldCheck size={16} className="security-icon" />
                  <div className="security-text">
                    <strong>Academic Integrity & Locking Rule:</strong>
                    <p>
                      Scores saved by Level Exam Officers are permanently locked.
                      Any subsequent amendments require formal queries submitted by the Supervising
                      Officer and approved by the HOD.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="gateway-footer">
        <p>
          University of Port Harcourt • Faculty of Management Sciences • CDRMS Cloud Database & RBAC Portal
        </p>
      </footer>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          initialUsername={username}
          initialDept={selectedDept}
          onResetSuccess={(resetUser) => {
            setUsername(resetUser);
            setPassword("password123");
            setError("Password successfully reset to default 'password123'. Please sign in to establish your new password.");
          }}
        />
      )}
    </div>
  );
}
