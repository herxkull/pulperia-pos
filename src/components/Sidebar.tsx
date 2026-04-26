"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageSearch, 
  Users 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Punto de Venta", path: "/pos", icon: ShoppingCart },
    { name: "Inventario", path: "/inventory", icon: PackageSearch },
    { name: "Clientes (Fiado)", path: "/customers", icon: Users },
  ];

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
    </aside>
  );
}
