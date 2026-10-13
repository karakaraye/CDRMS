import React, { useState } from "react";
import {
  GraduationCap,
  PlusCircle,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Cloud,
  CloudCheck,
  Search,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  LogOut,
  ShieldAlert,
  History,
  KeyRound,
  Menu,
  X,
} from "lucide-react";
import { ROLES } from "../services/auth";

export default function Navbar({
  cloudConnected,
  cloudChecking,
  searchTerm,
  onSearchChange,
  onOpenAddStudent,
  onOpenCourses,
  onOpenWorksheet,
  onOpenTranscript,
  onOpenCloudSettings,
  onRefresh,
  currentUser,
  onLogout,
  onOpenQueries,
  onOpenAuditTrail,
  onOpenChangePassword,
  onOpenOfficerAccounts,
  pendingQueriesCount = 0,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showQueriesBtn =
    currentUser?.role === ROLES.HOD ||
    currentUser?.role === ROLES.SUPER_FT ||
    currentUser?.role === ROLES.SUPER_PT;

  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="brand-container">
          <img
            src="/uniport.jpeg"
            alt="Uniport Crest"
            className="brand-logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="brand-text">
            <div className="brand-title">CDRMS <span className="cloud-tag">CLOUD</span></div>
            <div className="brand-subtitle">
              {currentUser?.department || "University of Port Harcourt"} • {currentUser?.program || "Management Sciences"}
            </div>
          </div>
        </div>
      </div>

      <div className="nav-center">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by matric no, name, batch..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => onSearchChange("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="nav-right">
        <button
          className="btn btn-primary"
          onClick={onOpenAddStudent}
          title="Add New Student (Ctrl+N)"
        >
          <PlusCircle size={16} />
          <span>New Student</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenWorksheet}
          title="Open Results Worksheet"
        >
          <FileSpreadsheet size={16} />
          <span>Worksheet</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenTranscript}
          title="Generate Academic Transcript / Spreadsheet"
        >
          <FileText size={16} />
          <span>Transcript</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenCourses}
          title="Manage Course Catalogue"
        >
          <BookOpen size={16} />
          <span>Courses</span>
        </button>

        {showQueriesBtn && (
          <button
            className={`btn btn-secondary nav-query-btn ${pendingQueriesCount > 0 ? "has-pending" : ""}`}
            onClick={onOpenQueries}
            title="Result Audit & Query Center"
          >
            <ShieldAlert size={16} />
            <span>Queries</span>
            {pendingQueriesCount > 0 && (
              <span className="nav-pending-badge">{pendingQueriesCount}</span>
            )}
          </button>
        )}

        {currentUser?.role === ROLES.HOD && (
          <>
            <button
              className="btn btn-secondary nav-audit-btn"
              onClick={onOpenAuditTrail}
              title="HOD Executive Audit Trail & Regulatory Ledger"
            >
              <History size={16} />
              <span>Audit Trail</span>
            </button>

            {onOpenOfficerAccounts && (
              <button
                className="btn btn-secondary nav-officers-btn"
                onClick={onOpenOfficerAccounts}
                title="Manage Departmental Officer Accounts & Reset Passwords"
              >
                <KeyRound size={15} />
                <span>Officer Accounts</span>
              </button>
            )}
          </>
        )}

        <div className="divider-vertical" />

        <button
          className={`cloud-status-badge ${cloudConnected ? "connected" : "offline"}`}
          onClick={onOpenCloudSettings}
          title="Configure Cloud Database (PostgreSQL / Supabase)"
        >
          <div className="pulse-dot" />
          <Cloud size={15} />
          <span>{cloudConnected ? "Cloud Online" : "Local / Offline"}</span>
          <SlidersHorizontal size={13} className="settings-icon" />
        </button>

        <button
          className="btn-icon"
          onClick={onRefresh}
          title="Refresh All Records (F5)"
        >
          <RefreshCw size={16} />
        </button>

        {currentUser && (
          <>
            <div className="divider-vertical" />
            <div className="nav-officer-profile" title={`Role: ${currentUser.roleTitle}`}>
              <div className="officer-avatar-icon">
                <UserCheck size={15} />
              </div>
              <div className="officer-text-group">
                <span className="officer-display-name">{currentUser.roleTitle}</span>
                <span className="officer-role-title">
                  {currentUser.program || "Authorized Session"}
                </span>
              </div>
            </div>

            {onOpenChangePassword && (
              <button
                className="btn btn-secondary nav-pwd-btn"
                onClick={onOpenChangePassword}
                title="Change Account Password / Security Settings"
              >
                <KeyRound size={14} />
                <span>Security</span>
              </button>
            )}

            <button
              className="btn btn-secondary nav-logout-btn"
              onClick={onLogout}
              title="Sign Out / Switch Department & Role"
            >
              <LogOut size={14} />
              <span>Switch Dept / Sign Out</span>
            </button>
          </>
        )}

        {/* MOBILE MENU TOGGLE BUTTON */}
        <button
          type="button"
          className="nav-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE ACTIONS DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-title">Navigation & Quick Actions</div>
              <button type="button" className="mobile-drawer-close" onClick={() => setMobileMenuOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {currentUser && (
              <div className="mobile-drawer-profile">
                <div className="officer-avatar-icon">
                  <UserCheck size={18} />
                </div>
                <div className="officer-text-group">
                  <span className="officer-display-name">{currentUser.roleTitle}</span>
                  <span className="officer-role-title">
                    {currentUser.department || "University of Port Harcourt"} • {currentUser.program || "Full-Time"}
                  </span>
                </div>
              </div>
            )}

            <div className="mobile-drawer-actions">
              <button
                type="button"
                className="mobile-action-btn primary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAddStudent();
                }}
              >
                <PlusCircle size={17} />
                <span>New Student (Ctrl+N)</span>
              </button>

              <button
                type="button"
                className="mobile-action-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWorksheet();
                }}
              >
                <FileSpreadsheet size={17} />
                <span>Results Worksheet</span>
              </button>

              <button
                type="button"
                className="mobile-action-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTranscript();
                }}
              >
                <FileText size={17} />
                <span>Academic Transcript</span>
              </button>

              <button
                type="button"
                className="mobile-action-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCourses();
                }}
              >
                <BookOpen size={17} />
                <span>Course Catalogue</span>
              </button>

              {showQueriesBtn && (
                <button
                  type="button"
                  className={`mobile-action-btn ${pendingQueriesCount > 0 ? "has-pending" : ""}`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenQueries();
                  }}
                >
                  <ShieldAlert size={17} />
                  <span>Result Audit & Queries</span>
                  {pendingQueriesCount > 0 && (
                    <span className="nav-pending-badge" style={{ marginLeft: "auto" }}>
                      {pendingQueriesCount}
                    </span>
                  )}
                </button>
              )}

              {currentUser?.role === ROLES.HOD && (
                <>
                  <button
                    type="button"
                    className="mobile-action-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuditTrail();
                    }}
                  >
                    <History size={17} />
                    <span>Executive Audit Trail</span>
                  </button>

                  {onOpenOfficerAccounts && (
                    <button
                      type="button"
                      className="mobile-action-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenOfficerAccounts();
                      }}
                    >
                      <KeyRound size={17} />
                      <span>Officer Accounts & Passwords</span>
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                className="mobile-action-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCloudSettings();
                }}
              >
                <Cloud size={17} />
                <span>Cloud Settings ({cloudConnected ? "Online" : "Offline"})</span>
              </button>

              {onOpenChangePassword && (
                <button
                  type="button"
                  className="mobile-action-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenChangePassword();
                  }}
                >
                  <KeyRound size={17} />
                  <span>Security & Change Password</span>
                </button>
              )}

              <button
                type="button"
                className="mobile-action-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRefresh();
                }}
              >
                <RefreshCw size={17} />
                <span>Refresh Records</span>
              </button>

              <button
                type="button"
                className="mobile-action-btn logout"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={17} />
                <span>Switch Department / Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
