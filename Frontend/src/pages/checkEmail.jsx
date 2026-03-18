import React from "react";
import { useNavigate } from "react-router-dom";
import { FiMail } from "react-icons/fi";

export default function CheckEmail() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm text-center">
        <FiMail className="mx-auto text-indigo-600 text-5xl mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Check Your Email
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          A password reset code has been sent to your email. Please follow the instructions to reset your password.
        </p>

        <button
          onClick={() => navigate("/signin")}
          className="w-full bg-indigo-600 text-white font-medium py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}