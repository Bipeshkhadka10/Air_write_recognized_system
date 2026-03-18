import { useState } from "react";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/forgot-password", { email });
      alert("Reset code sent to email");
      window.location.href = "/Check-email";
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-indigo-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-indigo-700 text-center">
          Forgot Password
        </h2>
        <p className="text-gray-500 text-center">
          Enter your registered email to receive a reset code.
        </p>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border transition"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md"
        >
          Send Reset Code
        </button>

        <p className="text-center text-sm text-gray-500">
          Remembered your password?{" "}
          <a
            href="/signin"
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign In
          </a>
        </p>
      </form>
    </div>
  );
}