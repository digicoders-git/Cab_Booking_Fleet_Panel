// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const USER_KEY = "fleet-data";
const TOKEN_KEY = "fleet-token";

export const AuthProvider = ({ children }) => {
  // admin/fleet object: { _id, name, email, companyName, isActive, walletBalance }
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); 
  const [loading, setLoading] = useState(true);

  // hydrate from localStorage (persisted login)
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (savedUser && savedUser !== "undefined") {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing saved user data", e);
        localStorage.removeItem(USER_KEY);
      }
    }

    if (savedToken) {
      setToken(savedToken);
    }

    setLoading(false);
  }, []);

  const setLoginData = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);

    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_KEY);
    }

    if (userToken) {
      localStorage.setItem(TOKEN_KEY, userToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear(); // Clear everything on logout for safety
  };

  const isLoggedIn = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{ user, token, setLoginData, logout, isLoggedIn, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

