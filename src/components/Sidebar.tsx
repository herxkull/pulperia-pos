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
  Receipt,
  BarChart3,
  Truck,
  History,
  Store,
  ShoppingBag,
  CupSoda,
  Cookie,
  ClipboardList
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, userRole } = useAuth();
  const { settings } = useSettings();

  const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

  const navGroups = [
    {
      title: "Ventas y Caja",
      items: [
        { name: "Dashboard", path: "/", icon: LayoutDashboard, color: "#6366f1" },
        { name: "Punto de Venta", path: "/pos", icon: ShoppingCart, color: "#3b82f6" },
        { name: "Historial de Ventas", path: "/sales", icon: History, color: "#8b5cf6" },
        { name: "Caja y Turnos", path: "/cash-register", icon: DollarSign, color: "#22c55e" },
        { name: "Clientes (Fiado)", path: "/customers", icon: Users, color: "#f59e0b" },
      ]
    },
    {
      title: "Logística",
      adminOnly: true,
      items: [
        { name: "Inventario", path: "/inventory", icon: PackageSearch, color: "#8b5cf6" },
        { name: "Compras (Lotes)", path: "/purchases", icon: PackagePlus, color: "#ec4899" },
        { name: "Mermas y Consumos", path: "/adjustments", icon: ClipboardList, color: "#f43f5e" },
        { name: "Proveedores", path: "/suppliers", icon: Truck, color: "#06b6d4" },
      ]
    },
    {
      title: "Negocio",
      items: [
        { name: "Gastos", path: "/expenses", icon: Receipt, color: "#ef4444" },
        { name: "Reportes", path: "/reports", icon: BarChart3, color: "#10b981", adminOnly: true },
      ]
    },
    {
      title: "Sistema",
      adminOnly: true,
      items: [
        { name: "Configuración", path: "/settings", icon: Settings, color: "#64748b" },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
  };

  const iconMap: Record<string, any> = {
    "shopping-cart": ShoppingCart,
    "store": Store,
    "shopping-bag": ShoppingBag,
    "cup-soda": CupSoda,
    "cookie": Cookie,
  };
  const LogoIcon = iconMap[settings.businessIcon || "shopping-cart"] || ShoppingCart;

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <LogoIcon size={24} />
          <span>{settings.businessName}</span>
        </div>
      </div>

      <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {navGroups.map((group, idx) => {
          if (group.adminOnly && !isAdmin) return null;
          
          const visibleItems = group.items.filter(item => !(item as any).adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} style={{ marginBottom: '1.5rem' }}>
              <div className="sidebar-group-label">{group.title}</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`nav-link ${isActive ? "active" : ""}`}
                    >
                      <Icon size={20} style={{ color: isActive ? 'inherit' : item.color }} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>
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
