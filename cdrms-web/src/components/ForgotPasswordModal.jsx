import React, { useState } from "react";
import {
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  User,
  KeyRound,
  X,
  HelpCircle,
  ShieldCheck,
  Building,
  Clock,
  ArrowRight,
} from "lucide-react";
import { auth, DEFAULT_USERS } from "../services/auth";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialUsername = "",
  initialDept = null,
  onResetSuccess,
}) {
  const [username, setUsername] = useState(initialUsername || "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setError("Please enter your designated officer username.");
      return;
    }

    const officer = DEFAULT_USERS.find(
      (u) => u.username.toLowerCase() === cleanUser
    );

    if (!officer) {
      setError(`Officer username '${username}' does not exist in any departmental board.`);
      return;
    }

    setIsSubmitting(true);

    const res = auth.createPasswordResetRequest(cleanUser, reason);

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (onResetSuccess) {
          onResetSuccess(cleanUser);
        }
        if (onClose) {
          onClose();
        }
      }, 3000);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog forgot-pwd-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-header forgot-pwd-header">
          <div className="modal-header-icon-box">
            <RotateCcw size={22} className="modal-icon-svg" />
          </div>
          <div className="modal-header-text">
            <h3>Password Reset Request Protocol</h3>
            <p>Faculty of Management Sciences • University of Port Harcourt</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body forgot-pwd-body">
          {/* TWO-TIER APPROVAL PROCESS FLOW BADGE */}
          <div className="workflow-steps-box">
            <span className="workflow-title">Institutional Multi-Tier Clearance Chain:</span>
            <div className="workflow-steps-pills">
              <div className="wf-step-pill active">
                <span className="step-badge">1</span>
                <span>Submit Request</span>
              </div>
              <ArrowRight size={13} className="wf-step-arrow" />
              <div className="wf-step-pill">
                <span className="step-badge">2</span>
                <span>Head Exam Officer Approval</span>
              </div>
              <ArrowRight size={13} className="wf-step-arrow" />
              <div className="wf-step-pill">
                <span className="step-badge">3</span>
                <span>HOD Reset Execution</span>
              </div>
            </div>
          </div>

          <div className="forgot-notice-box">
            <ShieldAlert size={18} className="forgot-notice-icon" />
            <div className="forgot-notice-text">
              <strong>Academic Security Protocol:</strong>
              <p>
                To protect confidential grading records, password resets must first be
                verified and endorsed by the <strong>Head Examination Officer</strong> before the
                <strong>Head of Department (HOD)</strong> authorizes and executes the reset.
              </p>
            </div>
          </div>

          {error && (
            <div className="pwd-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="pwd-success-alert">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRequestSubmit} className="forgot-form">
            <div className="form-group">
              <label>
                <User size={13} /> Officer Username
              </label>
              <input
                type="text"
                placeholder="e.g. mgt_ft_100, pm_super, hod"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
              <span className="form-input-help">
                Your designated exam officer username (e.g. <code>mgt_ft_100</code>).
              </span>
            </div>

            <div className="form-group">
              <label>
                <HelpCircle size={13} /> Reason / Verification Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lost credentials, locked out after session expiration"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <span className="form-input-help">
                Briefly state the reason for verification by the Head Examination Officer.
              </span>
            </div>

            <div className="forgot-info-card">
              <Clock size={16} className="info-icon" />
              <div className="info-text">
                <span>
                  Once your <strong>Head Examination Officer</strong> approves the request in the portal,
                  the <strong>HOD</strong> will execute the reset back to <code>password123</code>. You will be prompted
                  to choose a new password upon your next sign-in.
                </span>
              </div>
            </div>

            <div className="modal-footer forgot-pwd-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !username.trim()}
              >
                <RotateCcw size={15} />
                <span>{isSubmitting ? "Routing Request..." : "Submit Reset Request"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
