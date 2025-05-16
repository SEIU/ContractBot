import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

function SessionTimeout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const timeoutId = useRef(null);
  const timeout = 60 * 60 * 1000; // 1 hour

  useEffect(() => {
    if (user.isAuthenticated) {
      timeoutId.current = setTimeout(() => {
        setUser({ userName: null, isAuthenticated: false });
        navigate("/login");
      }, timeout);

      return () => {
        clearTimeout(timeoutId.current);
      };
    }
  }, [user, navigate, setUser]);

  return null; // This component doesn't render anything on to the page
}

export default SessionTimeout;
