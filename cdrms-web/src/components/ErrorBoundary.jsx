import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CDRMS ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "24px",
            margin: "16px auto",
            maxWidth: "600px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            border: "1px solid #fee2e2",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
            {this.props.fallbackTitle || "Something went wrong loading this component"}
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
            An unexpected error occurred while rendering this section. You can try refreshing the view or closing this window.
          </p>
          {this.state.error && (
            <div
              style={{
                textAlign: "left",
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#b91c1c",
                fontFamily: "monospace",
                marginBottom: "20px",
                overflowX: "auto",
                border: "1px solid #e2e8f0",
              }}
            >
              {this.state.error.toString()}
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
