import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/authContex";
import api from "../api/axios";

function AuthSuccess() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/signin");
      return;
    }

    // Save token
    localStorage.setItem("token", token);

    // Load user profile
    api
      .get("/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data.data);
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error(err);
        navigate("/signin");
      });
  }, []);

  return (
    <div className="flex justify-center items-center h-screen text-2xl">
      Signing you in...
    </div>
  );
}

export default AuthSuccess;