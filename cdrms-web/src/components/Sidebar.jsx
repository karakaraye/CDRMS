import React from "react";
import {
  Folder,
  FolderOpen,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  CheckCircle2,
  Database
} from "lucide-react";

export default function Sidebar({
  batches,
  selectedBatch,
  onSelectBatch,
  activeProgram,
  onSelectProgram,
  totalStudents,
  fullTimeCount,
  partTimeCount,
  coursesCount,
  cloudConnected,
  currentUser,
}) {
  const showFullTime = !currentUser || currentUser.program === "All" || currentUser.program === "Full-Time";
  const showPartTime = !currentUser || currentUser.program === "All" || currentUser.program === "Part-Time";
  const showAllRecords = !currentUser || currentUser.program === "All";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Database size={15} />
        <span>RECORDS DIRECTORY</span>
      </div>

      <div className="tree-container">
        {/* ALL RECORDS ROOT */}
        {showAllRecords && (
          <div
            className={`tree-item root-item ${!selectedBatch && activeProgram === "All" ? "active" : ""}`}
            onClick={() => {
              onSelectBatch(null);
              onSelectProgram("All");
            }}
          >
            <FolderOpen size={16} className="tree-icon" />
            <span className="tree-label">All Available Records</span>
            <span className="badge-count">{totalStudents}</span>
          </div>
        )}

        {/* PROGRAM CATEGORIES */}
        <div className="tree-section-title">PROGRAM CLASSIFICATION</div>

        {showFullTime && (
          <div
            className={`tree-item sub-item ${activeProgram === "Full-Time" && !selectedBatch ? "active" : ""}`}
            onClick={() => {
              onSelectProgram("Full-Time");
              onSelectBatch(null);
            }}
          >
            <GraduationCap size={15} className="tree-icon" />
            <span className="tree-label">Full-Time Students</span>
            <span className="badge-count">{fullTimeCount}</span>
          </div>
        )}

        {showPartTime && (
          <div
            className={`tree-item sub-item ${activeProgram === "Part-Time" && !selectedBatch ? "active" : ""}`}
            onClick={() => {
              onSelectProgram("Part-Time");
              onSelectBatch(null);
            }}
          >
            <Layers size={15} className="tree-icon" />
            <span className="tree-label">Part-Time Students</span>
            <span className="badge-count">{partTimeCount}</span>
          </div>
        )}

        {/* STUDENT SETS / BATCHES */}
        <div className="tree-section-title">STUDENT SETS (BATCHES)</div>

        <div
          className={`tree-item sub-item ${selectedBatch === null && activeProgram !== "All" ? "" : selectedBatch === null ? "active" : ""}`}
          onClick={() => onSelectBatch(null)}
        >
          <Users size={15} className="tree-icon" />
          <span className="tree-label">All Sets</span>
        </div>

        {batches.map((batch) => {
          const isSelected = selectedBatch === batch;
          return (
            <div
              key={batch}
              className={`tree-item sub-item batch-item ${isSelected ? "active" : ""}`}
              onClick={() => onSelectBatch(batch)}
            >
              <Calendar size={14} className="tree-icon" />
              <span className="tree-label">{batch}</span>
            </div>
          );
        })}
      </div>

      {/* QUICK SYSTEM STATS FOOTER */}
      <div className="sidebar-footer">
        <div className="footer-stat">
          <span className="stat-label">Active Catalogue</span>
          <span className="stat-value">{coursesCount} courses</span>
        </div>
        <div className="footer-stat">
          <span className="stat-label">Storage Backend</span>
          <span className={`stat-pill ${cloudConnected ? "pill-cloud" : "pill-local"}`}>
            {cloudConnected ? "Supabase Cloud" : "Local Storage"}
          </span>
        </div>
      </div>
    </aside>
  );
}
