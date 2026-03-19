import { useState, useRef, useEffect } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";

export default function VerifyCode() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft === 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verifyCode = otp.join("");
    if (verifyCode.length !== 6) {
      setError("Enter full 6-digit code");
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem("signupData"));
      if (!userData) {
        setError("Session expired. Please signup again.");
        return;
      }

      const res = await api.post("/auth/verify-code", {
        email: userData.email,
        otp: verifyCode
      });

      if (res.status === 200) {
        localStorage.removeItem("signupData");
        setMessage("Account verified successfully ✅");
        setError("");
        setTimeout(() => navigate("/signin"), 1000);
      }

    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code");
      setMessage("");
    }
  };

  const resendCode = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("signupData"));
      if (!userData) {
        setError("Session expired. Please signup again.");
        return;
      }

      await api.post("/auth/resend-code", { email: userData.email });

      setTimeLeft(60);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0].focus();
      setMessage("Code resent!");
      setError("");
    } catch {
      setError("Error resending code");
      setMessage("");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Email Verification</h2>
      <p>Enter the 6-digit code sent to your email</p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              value={digit}
              ref={(el) => (inputs.current[i] = el)}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              style={{
                width: "45px",
                height: "55px",
                fontSize: "22px",
                textAlign: "center",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />
          ))}
        </div>
        <br />
        <button type="submit" style={{
          padding: "10px 20px",
          background: "#4CAF50",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px"
        }}>
          Verify
        </button>
      </form>
      {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      <div style={{ marginTop: "20px" }}>
        {timeLeft > 0 ? (
          <p>Resend code in <b>{timeLeft}s</b></p>
        ) : (
          <button
            onClick={resendCode}
            style={{
              padding: "8px 15px",
              background: "#ff4d4d",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              borderRadius: "5px"
            }}
          >
            Resend Code
          </button>
        )}
      </div>
    </div>
  );
}