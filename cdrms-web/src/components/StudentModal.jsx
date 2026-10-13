import React, { useState, useEffect } from "react";
import { X, User, Phone, Mail, MapPin, Building, Calendar, Save } from "lucide-react";
import { DEPARTMENTS } from "../services/auth";

export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  currentUser,
}) {
  const defaultDept = currentUser?.department || "Department of Management";
  const defaultProg = currentUser?.program && currentUser.program !== "All" ? currentUser.program : "Full-Time";

  const [formData, setFormData] = useState({
    matric_no: "",
    surname: "",
    firstname: "",
    other_name: "",
    batch: "U2022",
    student_type: defaultProg,
    dob: "",
    sex: "Male",
    marital_status: "Single",
    gsm: "",
    sponsor_gsm: "",
    guardian_rel: "Parent",
    email: "",
    state_of_origin: "",
    lga: "",
    faculty: "Management Sciences",
    department: defaultDept,
    entry_year: "2022",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        matric_no: studentToEdit.matric_no || "",
        surname: studentToEdit.surname || "",
        firstname: studentToEdit.firstname || "",
        other_name: studentToEdit.other_name || "",
        batch: studentToEdit.batch || "U2022",
        student_type: studentToEdit.student_type || "Full-Time",
        dob: studentToEdit.dob || "",
        sex: studentToEdit.sex || "Male",
        marital_status: studentToEdit.marital_status || "Single",
        gsm: studentToEdit.gsm || "",
        sponsor_gsm: studentToEdit.sponsor_gsm || "",
        guardian_rel: studentToEdit.guardian_rel || "Parent",
        email: studentToEdit.email || "",
        state_of_origin: studentToEdit.state_of_origin || "",
        lga: studentToEdit.lga || "",
        faculty: studentToEdit.faculty || "Management Sciences",
        department: studentToEdit.department || "Management",
        entry_year: studentToEdit.entry_year || "2022",
      });
    } else {
      setFormData({
        matric_no: "",
        surname: "",
        firstname: "",
        other_name: "",
        batch: "U2022",
        student_type: defaultProg,
        dob: "",
        sex: "Male",
        marital_status: "Single",
        gsm: "",
        sponsor_gsm: "",
        guardian_rel: "Parent",
        email: "",
        state_of_origin: "",
        lga: "",
        faculty: "Management Sciences",
        department: defaultDept,
        entry_year: "2022",
      });
    }
    setError("");
  }, [studentToEdit, isOpen, defaultDept, defaultProg]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.matric_no.trim()) {
      setError("Matriculation Number is required.");
      return;
    }
    if (!formData.surname.trim() && !formData.firstname.trim()) {
      setError("Please provide at least a Surname or First Name.");
      return;
    }

    const fullname = `${formData.surname.trim()} ${formData.firstname.trim()} ${formData.other_name.trim()}`.trim();

    onSave({
      ...(studentToEdit ? { id: studentToEdit.id } : {}),
      ...formData,
      fullname,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <User size={18} />
            <h3>{studentToEdit ? "Edit Student Record" : "Register New Student"}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-sections-container">
            {/* SECTION 1: ACADEMIC DETAILS */}
            <div className="form-section">
              <h5 className="form-section-heading">Academic Information</h5>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Matric No *</label>
                  <input
                    type="text"
                    name="matric_no"
                    value={formData.matric_no}
                    onChange={handleChange}
                    placeholder="e.g. U2022/0296"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Program / Mode *</label>
                  <select
                    name="student_type"
                    value={formData.student_type}
                    onChange={handleChange}
                    disabled={formData.department !== "Department of Management" && formData.department !== "Management"}
                  >
                    <option value="Full-Time">Full-Time</option>
                    {(formData.department === "Department of Management" || formData.department === "Management") && (
                      <option value="Part-Time">Part-Time</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Batch / Set</label>
                  <input
                    type="text"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    placeholder="e.g. U2022"
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Faculty</label>
                  <input
                    type="text"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const hasPT = newDept === "Department of Management" || newDept === "Management";
                      setFormData((prev) => ({
                        ...prev,
                        department: newDept,
                        student_type: hasPT ? prev.student_type : "Full-Time",
                      }));
                    }}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} {d.hasPartTime ? "(FT & PT)" : "(Full-Time Only)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Entry Year
                    {formData.entry_year && !isNaN(parseInt(formData.entry_year)) && (
                      <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "700", marginLeft: "6px" }}>
                        (100L: {formData.entry_year}/{parseInt(formData.entry_year) + 1} Session)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="entry_year"
                    value={formData.entry_year}
                    onChange={handleChange}
                    placeholder="e.g. 2022"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: BIODATA */}
            <div className="form-section">
              <h5 className="form-section-heading">Personal Biodata</h5>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Surname *</label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    placeholder="e.g. WARI-SYLVA"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    placeholder="e.g. HIMSON"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Other Name(s)</label>
                  <input
                    type="text"
                    name="other_name"
                    value={formData.other_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Sex</label>
                  <select name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Marital Status</label>
                  <select
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleChange}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: CONTACT & GUARDIAN */}
            <div className="form-section">
              <h5 className="form-section-heading">Contact & Sponsor Details</h5>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Student Phone (GSM)</label>
                  <input
                    type="tel"
                    name="gsm"
                    value={formData.gsm}
                    onChange={handleChange}
                    placeholder="080..."
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Sponsor / Guardian Phone</label>
                  <input
                    type="tel"
                    name="sponsor_gsm"
                    value={formData.sponsor_gsm}
                    onChange={handleChange}
                    placeholder="080..."
                  />
                </div>
                <div className="form-group">
                  <label>Guardian Relationship</label>
                  <input
                    type="text"
                    name="guardian_rel"
                    value={formData.guardian_rel}
                    onChange={handleChange}
                    placeholder="Parent / Sibling / Self"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>State of Origin</label>
                  <input
                    type="text"
                    name="state_of_origin"
                    value={formData.state_of_origin}
                    onChange={handleChange}
                    placeholder="e.g. Rivers"
                  />
                </div>
                <div className="form-group">
                  <label>L.G.A.</label>
                  <input
                    type="text"
                    name="lga"
                    value={formData.lga}
                    onChange={handleChange}
                    placeholder="e.g. Port Harcourt"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>{studentToEdit ? "Update Student" : "Save Student"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
