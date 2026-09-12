import React, { useState } from "react";
import { Field } from "../components/Field.jsx";
import { inputStyle } from "../data/constants.js";
import { validateEmail } from "../utils/validation.js";
import { api } from "../services/api.js";
import { Sparkles } from "lucide-react";

export function RegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.register(email, password, role);
      onRegisterSuccess(data.user);
    } catch (err) {
      setError(err.message || "Registration failed. Try a different email.");
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
        <div style={{ color: "#5B5648", fontSize: 14, marginTop: 4 }}>Create your account</div>
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
            placeholder="you@domain.com"
            style={inputStyle}
          />
        </Field>

        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            <option value="student">Student</option>
            <option value="recruiter">Recruiter / Employer</option>
            <option value="admin">Administrator</option>
          </select>
        </Field>

        <Field label="Password (at least 8 characters)">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={inputStyle}
          />
        </Field>

        <Field label="Confirm Password">
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
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
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#5B5648" }}>
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          style={{ background: "none", border: "none", color: "#E8871E", fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
