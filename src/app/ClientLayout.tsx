"use client";

import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  
  const isLoginPage = pathname === "/login";
  const adminRoutes = ["/inventory", "/purchases", "/settings", "/reports", "/suppliers"];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (isAuthenticated && userRole === "CASHIER" && isAdminRoute) {
      router.push("/");
    }
  }, [isAuthenticated, userRole, isAdminRoute, router]);

  if (isLoginPage) {
    return <div className="page-container" style={{ padding: 0 }}>{children}</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge" style={{ backgroundColor: userRole === "ADMIN" ? "var(--primary)" : userRole === "OWNER" ? "var(--warning)" : "var(--success)", color: "white" }}>
              {userRole === "ADMIN" ? "Soporte" : userRole === "OWNER" ? "Dueño" : "Cajero"}
            </span>
            <span className="badge badge-success">Sistema Activo</span>
          </div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
