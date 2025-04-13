import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, signInWithPopup } from "../firebaseConfig";
import "../Mentor.css";

const Login = ({ setUser, user }) => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  // Redirect when user state updates
  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  return (
    <div className="login-container">
      <h2>Want to chat with our expert mentors?</h2>
      <button onClick={handleGoogleLogin}><span>Sign in with Google</span></button>
    </div>
  );
};

export default Login;