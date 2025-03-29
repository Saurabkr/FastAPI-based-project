import { createContext, useState, useEffect } from "react";
import { loginUser, logoutUser, registerUser } from "./Services/Api.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    setUser(!!token);
  }, []);

  const login = async (username, password) => {
    const data = await loginUser(username, password);
    console.log("data", data);
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      setUser(true);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    logoutUser();
    setUser(false);
  };

  const register = async (username, password) => {
    await registerUser(username, password);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
