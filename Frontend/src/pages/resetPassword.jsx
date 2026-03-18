import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { FiLock, FiUnlock } from "react-icons/fi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    code: searchParams.get("code") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPending, setIsPending] = useState(false);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    let error = {};

    if (!form.newPassword) error.newPassword = "New password is required";
    else if (!passwordRegex.test(form.newPassword))
      error.newPassword =
        "Password must contain uppercase, lowercase, number, and special character";

    if (!form.confirmPassword) error.confirmPassword = "Confirm password is required";
    else if (form.newPassword !== form.confirmPassword)
      error.confirmPassword = "Passwords do not match";

    if (Object.keys(error).length > 0) return setErrors(error);

    try {
      setIsPending(true);
      const res = await api.post("/auth/reset-password", {
        code: form.code,
        newPassword: form.newPassword,
      });
      alert(res.data.message || "Password reset successful");
      navigate("/signin");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-8 w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-indigo-700 text-center">
          Reset Password
        </h2>

        {/* New Password */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type={showNewPassword ? "text" : "password"}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="mt-1 w-full border rounded-md px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-black focus:border transition focus:outline-none"  
            required
          />
          <span
            className="absolute right-3 top-11 cursor-pointer text-gray-600"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <FiUnlock /> : <FiLock />}
          </span>
          {errors.newPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="mt-1 w-full border rounded-md px-4 py-3 bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-black focus:border transition focus:outline-none"
            required
          />
          <span
            className="absolute right-3 top-11 cursor-pointer text-gray-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FiUnlock /> : <FiLock />}
          </span>
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
        >
          {isPending ? "Resetting..." : "Reset Password"}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate("/signin")}
            className="text-sm text-gray-600 hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </form>
    </div>
  );
}