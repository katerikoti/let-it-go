"use client";

export default function AuthForm() {
  return (
    <div style={{ maxWidth: 360, margin: "0 auto", color: "white" }}>
      <h2>Welcome</h2>

      <input placeholder="Email" style={inputStyle} />
      <input placeholder="Password" type="password" style={inputStyle} />

      <button style={buttonStyle}>Continue</button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 6,
  border: "none",
};

const buttonStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 6,
  border: "none",
  background: "#ffffff",
  fontWeight: "600",
};