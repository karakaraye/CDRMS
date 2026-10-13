import React, { useState } from "react";
import { X, BookOpen, Plus, Trash2, Edit2, Check, Search } from "lucide-react";

export default function CourseManagerModal({
  isOpen,
  onClose,
  courses,
  onSaveCourse,
  onDeleteCourse,
}) {
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterProgram, setFilterProgram] = useState("All");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: "",
    course_title: "",
    credit_units: 3,
    level: "100",
    semester: "First",
    status: "Compulsory",
    program: "Full-Time",
    department: "Department of Project Management",
  });

  if (!isOpen) return null;

  const filtered = courses.filter((c) => {
    if (filterDepartment !== "All") {
      const cDept = c.department || "Department of Management";
      if (!cDept.toLowerCase().includes(filterDepartment.toLowerCase())) return false;
    }
    if (filterLevel !== "All" && c.level !== filterLevel) return false;
    if (filterSemester !== "All" && c.semester !== filterSemester) return false;
    if (filterProgram !== "All" && (c.program || "Full-Time") !== filterProgram) return false;
    if (search) {
      const q = search.toLowerCase();
      const codeMatch = c.course_code?.toLowerCase().includes(q);
      const titleMatch = c.course_title?.toLowerCase().includes(q);
      if (!codeMatch && !titleMatch) return false;
    }
    return true;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCourse.course_code.trim() || !newCourse.course_title.trim()) {
      alert("Course Code and Title are required.");
      return;
    }
    onSaveCourse({
      ...newCourse,
      credit_units: Number(newCourse.credit_units || 2),
    });
    setNewCourse({
      course_code: "",
      course_title: "",
      credit_units: 3,
      level: "100",
      semester: "First",
      status: "Compulsory",
      program: "Full-Time",
    });
    setShowAddForm(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <BookOpen size={18} />
            <h3>Course Catalogue Manager</h3>
            <span className="badge-count">{filtered.length} Courses</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="modal-filter-bar">
          <div className="filter-group">
            <label>Department:</label>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="All">All Departments</option>
              <option value="Employee">Employee Relations & HRM</option>
              <option value="Project">Project Management</option>
              <option value="Innovation">Innovation & Entrepreneurship</option>
              <option value="Procurement">Procurement Management</option>
              <option value="Management">Management (FT & PT)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Level:</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="All">All Levels</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="500">500 Level (Extra Yr 1)</option>
              <option value="600">600 Level (Extra Yr 2)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Semester / Term:</label>
            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
              <option value="All">All Semesters</option>
              <option value="First">First</option>
              <option value="Second">Second</option>
              <option value="Third">Third (Part-Time)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Program:</label>
            <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
              <option value="All">All Programs</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
            </select>
          </div>

          <div className="search-input-wrap">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} /> {showAddForm ? "Cancel Add" : "Add Course"}
          </button>
        </div>

        {/* ADD COURSE INLINE FORM */}
        {showAddForm && (
          <form className="inline-add-course-form" onSubmit={handleAddSubmit}>
            <div className="form-row-flexible">
              <input
                type="text"
                placeholder="Code (e.g. MGT 101.1)"
                value={newCourse.course_code}
                onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Course Title"
                value={newCourse.course_title}
                onChange={(e) => setNewCourse({ ...newCourse, course_title: e.target.value })}
                style={{ flex: 2 }}
                required
              />
              <input
                type="number"
                placeholder="CU"
                value={newCourse.credit_units}
                onChange={(e) => setNewCourse({ ...newCourse, credit_units: e.target.value })}
                style={{ width: "70px" }}
                min={1}
                max={6}
                required
              />
              <select
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
              >
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500 (Extra Yr 1)</option>
                <option value="600">600 (Extra Yr 2)</option>
              </select>
              <select
                value={newCourse.semester}
                onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
              >
                <option value="First">First</option>
                <option value="Second">Second</option>
                <option value="Third">Third</option>
              </select>
              <select
                value={newCourse.status}
                onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value })}
              >
                <option value="Compulsory">Compulsory</option>
                <option value="Required">Required</option>
              </select>
              <select
                value={newCourse.program}
                onChange={(e) => setNewCourse({ ...newCourse, program: e.target.value })}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
              </select>
              <select
                value={newCourse.department}
                onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
              >
                <option value="Department of Management">Management</option>
                <option value="Department of Project Management">Project Management</option>
                <option value="Department of Employee Relations and Human Resource Management">Employee Relations & HRM</option>
                <option value="Department of Innovation and Entrepreneurship Management">Innovation & Entrepreneurship</option>
                <option value="Department of Procurement Management">Procurement Management</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm">
                Save
              </button>
            </div>
          </form>
        )}

        {/* COURSES TABLE */}
        <div className="modal-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "115px" }}>Course Code</th>
                <th>Course Title</th>
                <th style={{ width: "135px" }}>Department</th>
                <th style={{ width: "55px", textAlign: "center" }}>CU</th>
                <th style={{ width: "70px" }}>Level</th>
                <th style={{ width: "85px" }}>Semester</th>
                <th style={{ width: "105px" }}>Status</th>
                <th style={{ width: "95px" }}>Program</th>
                <th style={{ width: "70px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.course_code}</strong></td>
                  <td>{c.course_title}</td>
                  <td>
                    <span className="small-program-pill">
                      {(c.department || "Management").includes("Project") ? "Project Mgt" : "Management"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="cu-badge">{c.credit_units}</span>
                  </td>
                  <td>{c.level} L</td>
                  <td>{c.semester}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        c.status === "Compulsory" ? "pill-compulsory" : "pill-required"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <span className="small-program-pill">{c.program || "Full-Time"}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn-action btn-action-delete"
                      title="Delete Course"
                      onClick={() => {
                        if (window.confirm(`Delete ${c.course_code} - ${c.course_title}?`)) {
                          onDeleteCourse(c.id);
                        }
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
