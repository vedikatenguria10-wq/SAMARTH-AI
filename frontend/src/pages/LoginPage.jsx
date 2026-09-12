import React, { useState } from "react";
import { Field } from "../components/Field.jsx";
import { inputStyle } from "../data/constants.js";
import { api } from "../services/api.js";
import { Lock, Mail, Sparkles, UserCheck } from "lucide-react";

export function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setLoading(true);
    try {
      const data = await api.login(demoEmail, demoPass);
      onLoginSuccess(data.user);
    } catch (err) {
      setError("Demo login failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: "40px auto 0", background: "#fff", border: "1px solid #E3DFD3", borderRadius: 12, padding: 32 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1B2A4A" }}>
          <Sparkles size={24} color="#E8871E" />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700 }}>SAMARTH AI</span>
        </div>
        <div style={{ color: "#5B5648", fontSize: 14, marginTop: 4 }}>Log in to your account</div>
      </div>

      {error && (
        <div style={{ background: "#FDF2F2", border: "1px solid #F8B4B4", color: "#B14D4D", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <Field label="Email Address">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@samarth.ai"
            style={inputStyle}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#E8871E",
            color: "#1B2A4A",
            border: "none",
            borderRadius: 7,
            padding: "11px 18px",
            fontWeight: 700,
            fontSize: 14.5,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4
          }}
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #F0EEE6" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#5B5648", marginBottom: 10 }}>
          ⚡ Quick Demo Login Credentials:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            onClick={() => handleQuickDemo("student@samarth.ai", "password123")}
            style={{ background: "#FAF8F4", border: "1px solid #E3DFD3", borderRadius: 6, padding: "7px 10px", fontSize: 12.5, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
          >
            <span><strong>Student:</strong> student@samarth.ai</span>
            <span style={{ color: "#E8871E", fontWeight: 600 }}>Login →</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo("recruiter@samarth.ai", "password123")}
            style={{ background: "#FAF8F4", border: "1px solid #E3DFD3", borderRadius: 6, padding: "7px 10px", fontSize: 12.5, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
          >
            <span><strong>Recruiter:</strong> recruiter@samarth.ai</span>
            <span style={{ color: "#E8871E", fontWeight: 600 }}>Login →</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo("admin@samarth.ai", "admin123")}
            style={{ background: "#FAF8F4", border: "1px solid #E3DFD3", borderRadius: 6, padding: "7px 10px", fontSize: 12.5, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
          >
            <span><strong>Admin:</strong> admin@samarth.ai</span>
            <span style={{ color: "#E8871E", fontWeight: 600 }}>Login →</span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#5B5648" }}>
        Don't have an account?{" "}
        <button
          onClick={onSwitchToRegister}
          style={{ background: "none", border: "none", color: "#E8871E", fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
