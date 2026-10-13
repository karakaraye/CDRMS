import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Key,
  Globe,
  Copy,
  ExternalLink,
  Database
} from "lucide-react";
import {
  getStoredCloudCredentials,
  saveCloudCredentials,
  testCloudConnection,
  pushAllToCloud,
  pullAllFromCloud
} from "../services/supabase";

export default function CloudSettingsModal({
  isOpen,
  onClose,
  cloudConnected,
  onCloudStatusChange,
  allData,
  onDataSynced,
}) {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [activeTab, setActiveTab] = useState("connect");
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const creds = getStoredCloudCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseKey(creds.key);
    setTestResult(null);
    setSyncMessage("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setSyncMessage("");
    const res = await testCloudConnection(supabaseUrl, supabaseKey);
    setTesting(false);
    setTestResult(res);
    if (res.success && !res.schemaNeeded) {
      saveCloudCredentials(supabaseUrl, supabaseKey);
      onCloudStatusChange(true);
    } else {
      onCloudStatusChange(false);
    }
  };

  const handleSaveCredentials = () => {
    saveCloudCredentials(supabaseUrl, supabaseKey);
    handleTestConnection();
  };

  const handlePushToCloud = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await pushAllToCloud(allData);
      setSyncMessage(`Successfully pushed ${res.students} students and ${res.courses} courses to Supabase!`);
    } catch (err) {
      setSyncMessage(`Push error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const pulled = await pullAllFromCloud();
      onDataSynced(pulled);
      setSyncMessage(`Successfully downloaded ${pulled.students.length} students and ${pulled.courses.length} courses from Supabase!`);
    } catch (err) {
      setSyncMessage(`Pull error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopySql = () => {
    const sql = `-- CDRMS Supabase PostgreSQL Setup
CREATE TABLE IF NOT EXISTS public.students (
    id BIGSERIAL PRIMARY KEY,
    matric_no TEXT NOT NULL UNIQUE,
    surname TEXT,
    firstname TEXT,
    other_name TEXT,
    fullname TEXT NOT NULL,
    batch TEXT DEFAULT 'U2022',
    student_type TEXT NOT NULL DEFAULT 'Full-Time',
    dob TEXT,
    sex TEXT,
    marital_status TEXT,
    gsm TEXT,
    sponsor_gsm TEXT,
    guardian_rel TEXT,
    email TEXT,
    state_of_origin TEXT,
    lga TEXT,
    faculty TEXT DEFAULT 'Management Sciences',
    department TEXT DEFAULT 'Management',
    entry_year TEXT,
    passport_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
    id BIGSERIAL PRIMARY KEY,
    course_code TEXT NOT NULL,
    course_title TEXT NOT NULL,
    credit_units INTEGER NOT NULL DEFAULT 3,
    level TEXT DEFAULT '100',
    semester TEXT DEFAULT 'First',
    status TEXT DEFAULT 'Compulsory',
    program TEXT DEFAULT 'Full-Time',
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_code, level, semester, program)
);

CREATE TABLE IF NOT EXISTS public.results (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT,
    course_id BIGINT,
    score NUMERIC DEFAULT 0,
    grade TEXT DEFAULT 'F',
    grade_point NUMERIC DEFAULT 0,
    session TEXT,
    semester TEXT DEFAULT 'First',
    is_carryover INTEGER DEFAULT 0,
    is_waived INTEGER DEFAULT 0,
    waiver_grade TEXT,
    remark TEXT,
    level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on results" ON public.results FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Cloud size={20} className={cloudConnected ? "text-success" : ""} />
            <h3>Cloud Database Configuration</h3>
            <span className={`status-badge-inline ${cloudConnected ? "badge-online" : "badge-offline"}`}>
              {cloudConnected ? "Online & Synchronized" : "Local / Offline Mode"}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* MODAL TABS */}
        <div className="cloud-modal-tabs">
          <button
            className={`tab-btn ${activeTab === "connect" ? "active" : ""}`}
            onClick={() => setActiveTab("connect")}
          >
            Connection Settings
          </button>
          <button
            className={`tab-btn ${activeTab === "sync" ? "active" : ""}`}
            onClick={() => setActiveTab("sync")}
          >
            Data Synchronization
          </button>
          <button
            className={`tab-btn ${activeTab === "instructions" ? "active" : ""}`}
            onClick={() => setActiveTab("instructions")}
          >
            Setup Guide & SQL
          </button>
        </div>

        <div className="modal-body-padding">
          {activeTab === "connect" && (
            <div className="cloud-connect-section">
              <p className="cloud-intro-text">
                Connect CDRMS to <strong>Supabase (Cloud PostgreSQL)</strong> to allow lecturers, departmental
                officers, and administrators to access, manage, and update records from anywhere on the internet.
              </p>

              <div className="form-group">
                <label>
                  <Globe size={14} /> Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
                <span className="field-hint">Found under Supabase Dashboard &gt; Project Settings &gt; API</span>
              </div>

              <div className="form-group">
                <label>
                  <Key size={14} /> Supabase Anon Public Key (API Key)
                </label>
                <textarea
                  rows={2}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                />
                <span className="field-hint">Found under Project Settings &gt; API &gt; Project API keys (anon / public)</span>
              </div>

              {testResult && (
                <div className={`connection-result-banner ${testResult.success ? "success" : "error"}`}>
                  {testResult.success ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                  <div>
                    <strong>{testResult.success ? "Connection Verified!" : "Connection Failed"}</strong>
                    <p>{testResult.message}</p>
                  </div>
                </div>
              )}

              <div className="cloud-connect-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={testing}
                  onClick={handleTestConnection}
                >
                  <RefreshCw size={15} className={testing ? "spin-icon" : ""} />
                  {testing ? "Testing..." : "Test Connection"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveCredentials}
                >
                  Save & Connect Cloud
                </button>
              </div>
            </div>
          )}

          {activeTab === "sync" && (
            <div className="cloud-sync-section">
              <h4>Database Sync Control Center</h4>
              <p className="cloud-intro-text">
                Migrate existing offline student records and standard course catalogues to your cloud database, or
                download remote changes.
              </p>

              <div className="sync-cards-grid">
                <div className="sync-action-card">
                  <UploadCloud size={32} className="sync-card-icon" />
                  <h5>Push Local Data to Cloud</h5>
                  <p>Upload all students, courses, and results currently stored in this browser to Supabase.</p>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={syncing || !cloudConnected}
                    onClick={handlePushToCloud}
                  >
                    {syncing ? "Uploading..." : "Push to Cloud"}
                  </button>
                </div>

                <div className="sync-action-card">
                  <DownloadCloud size={32} className="sync-card-icon" />
                  <h5>Pull Data from Cloud</h5>
                  <p>Download the latest departmental records from Supabase into your local browser workspace.</p>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={syncing || !cloudConnected}
                    onClick={handlePullFromCloud}
                  >
                    {syncing ? "Downloading..." : "Pull from Cloud"}
                  </button>
                </div>
              </div>

              {!cloudConnected && (
                <div className="warning-banner-box">
                  <AlertTriangle size={16} />
                  <span>Cloud database is currently not connected. Configure credentials in the Connection Settings tab first.</span>
                </div>
              )}

              {syncMessage && (
                <div className="sync-feedback-banner">
                  <CheckCircle size={16} />
                  <span>{syncMessage}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "instructions" && (
            <div className="cloud-guide-section">
              <h4>Quick 3-Step Setup for Free Cloud Database</h4>

              <div className="step-list">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h5>Create a Free Supabase Project</h5>
                    <p>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a>, create an account, and click <strong>New Project</strong>.</p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h5>Run the SQL Table Schema</h5>
                    <p>In your Supabase project dashboard, open the <strong>SQL Editor</strong>, click <strong>New Query</strong>, and execute the SQL below:</p>
                    <button className="btn btn-secondary btn-sm copy-sql-btn" onClick={handleCopySql}>
                      <Copy size={13} /> {copiedSql ? "Copied SQL to Clipboard!" : "Copy SQL Setup Code"}
                    </button>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h5>Paste API Keys</h5>
                    <p>Go to <strong>Project Settings &gt; API</strong>, copy your <strong>Project URL</strong> and <strong>anon / public key</strong>, and paste them into the Connection Settings tab!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
