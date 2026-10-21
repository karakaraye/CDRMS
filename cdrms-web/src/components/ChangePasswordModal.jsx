import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";
import { auth } from "../services/auth";

export default function ChangePasswordModal({
  isOpen,
  onClose,
  isMandatory = false,
  currentUser,
  onSuccess,
  onLogout,
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccessMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  // Validation rules
  const hasMinLength = newPassword.length >= 6;
  const isNotDefault = newPassword !== "password123";
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword !== currentPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    hasMinLength &&
    isNotDefault &&
    passwordsMatch &&
    !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!hasMinLength) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (!isNotDefault) {
      setError("New password cannot be the default 'password123'.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await auth.changePassword(currentUser.username, currentPassword, newPassword);

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setIsSubmitting(false);
          if (onSuccess) {
            onSuccess(res.user);
          }
          if (onClose) {
            onClose();
          }
        }, 1000);
      } else {
        setIsSubmitting(false);
        setError(res.message);
      }
    } catch (err) {
      setIsSubmitting(false);
      setError("Failed to update password across devices. Please check your internet connection.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className={`modal-dialog change-pwd-modal ${isMandatory ? "mandatory-lock" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="modal-header change-pwd-header">
          <div className="modal-header-icon-box">
            <KeyRound size={22} className="modal-icon-svg" />
          </div>
          <div className="modal-header-text">
            <h3>{isMandatory ? "First-Time Login Security" : "Change Account Password"}</h3>
            <p>
              {isMandatory
                ? "Mandatory password update required before accessing examination records."
                : "Update your departmental portal password."}
            </p>
          </div>
          {!isMandatory && onClose && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close Dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="modal-body change-pwd-body">
          {/* MANDATORY WARNING BANNER */}
          {isMandatory && (
            <div className="pwd-notice-banner">
              <ShieldAlert size={20} className="notice-icon" />
              <div className="notice-content">
                <strong>Mandatory Security Protocol:</strong>
                <p>
                  As an authorized examination officer for the Faculty of Management Sciences,
                  University of Port Harcourt, you must change your initial default password
                  (<code>password123</code>) to protect academic grading records.
                </p>
              </div>
            </div>
          )}

          {/* OFFICER PROFILE SUMMARY CHIP */}
          <div className="pwd-officer-strip">
            <div className="officer-strip-icon">
              <User size={16} />
            </div>
            <div className="officer-strip-info">
              <div className="strip-title">{currentUser.roleTitle}</div>
              <div className="strip-meta">
                <span>{currentUser.department}</span> •{" "}
                <span className="strip-user">User: {currentUser.username}</span>
              </div>
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

          <form onSubmit={handleSubmit} className="pwd-form">
            {/* CURRENT PASSWORD */}
            <div className="form-group">
              <label>
                <Lock size={13} /> Current / Default Password
              </label>
              <div className="pwd-input-wrap">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password (e.g. password123)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="form-group">
              <label>
                <KeyRound size={13} /> New Secure Password
              </label>
              <div className="pwd-input-wrap">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* CONFIRM NEW PASSWORD */}
            <div className="form-group">
              <label>
                <ShieldCheck size={13} /> Confirm New Password
              </label>
              <div className="pwd-input-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* REQUIREMENTS CHECKLIST */}
            <div className="pwd-requirements-box">
              <span className="req-header">Password Requirements:</span>
              <ul className="req-list">
                <li className={hasMinLength ? "req-met" : "req-unmet"}>
                  <CheckCircle2 size={13} />
                  <span>At least 6 characters in length</span>
                </li>
                <li className={isNotDefault ? "req-met" : "req-unmet"}>
                  <CheckCircle2 size={13} />
                  <span>Cannot be the default "password123"</span>
                </li>
                <li className={passwordsMatch ? "req-met" : "req-unmet"}>
                  <CheckCircle2 size={13} />
                  <span>New passwords must match</span>
                </li>
              </ul>
            </div>

            {/* ACTION BUTTONS */}
            <div className="modal-footer change-pwd-footer">
              {isMandatory ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onLogout}
                  title="Cancel and return to department sign-in"
                >
                  <LogOut size={14} />
                  <span>Cancel / Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit}
              >
                <KeyRound size={15} />
                <span>{isSubmitting ? "Updating..." : "Save Password & Continue"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
