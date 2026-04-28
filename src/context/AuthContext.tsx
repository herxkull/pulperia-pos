"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  username: string | null;
  login: (token: string, role: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("pos_auth_token");
    const role = localStorage.getItem("pos_user_role");
    const storedUsername = localStorage.getItem("pos_username");
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
      setUsername(storedUsername);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setUsername(null);
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
    setLoading(false);
  }, [pathname, router]);

  const login = (token: string, role: string, user: string) => {
    localStorage.setItem("pos_auth_token", token);
    localStorage.setItem("pos_user_role", role);
    localStorage.setItem("pos_username", user);
    setIsAuthenticated(true);
    setUserRole(role);
    setUsername(user);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("pos_auth_token");
    localStorage.removeItem("pos_user_role");
    localStorage.removeItem("pos_username");
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, username, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
