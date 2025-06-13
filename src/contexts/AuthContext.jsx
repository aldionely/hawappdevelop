import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = useCallback(async () => {
    setLoading(true);
    const sessionUser = localStorage.getItem('user');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const login = async (username, password) => {
    setLoading(true);
    if (username === "admin" && password === "admin123") {
      const adminUser = { username, role: "admin", id: "admin_user", name: "Admin" };
      setUser(adminUser);
      localStorage.setItem("user", JSON.stringify(adminUser));
      setLoading(false);
      return { success: true, role: "admin" };
    }

    const { data: workerData, error } = await supabase
      .from('workers')
      .select('*')
      .eq('username', username)
      .single();
    
    setLoading(false);

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: "Username tidak ditemukan." };
      }
      handleSupabaseError(error, `Login error for username ${username}:`);
      return { success: false, error: "Terjadi kesalahan saat login. Coba lagi." };
    }
    
    if (!workerData) {
        return { success: false, error: "Username tidak ditemukan." };
    }

    if (workerData.password === password) {
      const workerUser = { ...workerData, role: "worker" };
      setUser(workerUser);
      localStorage.setItem("user", JSON.stringify(workerUser));
      return { success: true, role: "worker", user: workerUser };
    }
    
    return { success: false, error: "Password salah." };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      login, 
      logout, 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};