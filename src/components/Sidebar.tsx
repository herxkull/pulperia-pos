"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageSearch, 
  Users,
  Settings,
  LogOut,
  DollarSign,
  PackagePlus,
  Receipt
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Punto de Venta", path: "/pos", icon: ShoppingCart },
    { name: "Caja (Turnos)", path: "/cash-register", icon: DollarSign },
    { name: "Inventario", path: "/inventory", icon: PackageSearch },
    { name: "Ingreso Lotes", path: "/purchases", icon: PackagePlus },
    { name: "Gastos", path: "/expenses", icon: Receipt },
    { name: "Clientes (Fiado)", path: "/customers", icon: Users },
    { name: "Configuración", path: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <ShoppingCart size={24} />
          <span>Mi Pulpería</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <button 
          onClick={handleLogout} 
          className="nav-link" 
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--danger)' }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
