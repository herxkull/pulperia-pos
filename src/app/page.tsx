import prisma from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, TrendingUp, Package, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Obtener ventas de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const salesToday = await prisma.sale.findMany({
    where: {
      date: {
        gte: today,
      },
    },
  });

  const totalSalesToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);

  // Obtener alarmas de stock
  const lowStockProducts = await prisma.product.findMany({
    where: {
      stock: {
        lte: prisma.product.fields.minStock, // as of Prisma 5+ can't compare two fields easily in standard where. Let's fetch all and filter in memory since it's local.
      },
    },
  });

  // Fetch all products to filter low stock correctly
  const allProducts = await prisma.product.findMany();
  const actualLowStock = allProducts.filter(p => p.stock <= p.minStock);

  // Clientes con deudas
  const debtors = await prisma.customer.count({
    where: {
      currentDebt: { gt: 0 }
    }
  });

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Dashboard</h1>

      <div className="grid grid-cols-3" style={{ marginBottom: "2rem" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--primary)" }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Ventas de Hoy</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>C$ {totalSalesToday.toFixed(2)}</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--danger)" }}>
            <AlertTriangle size={32} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Alertas de Stock</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{actualLowStock.length} Productos</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--warning)" }}>
            <Users size={32} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Clientes con Deuda</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{debtors}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)" }}>
            <AlertTriangle /> Productos con Bajo Stock
          </h2>
          <div style={{ marginTop: "1rem" }}>
            {actualLowStock.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Todo el inventario está en niveles óptimos.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Mínimo Permitido</th>
                  </tr>
                </thead>
                <tbody>
                  {actualLowStock.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>
                        <span className="badge badge-danger">{p.stock}</span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{p.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {actualLowStock.length > 0 && (
              <div style={{ marginTop: "1rem", textAlign: "right" }}>
                <Link href="/inventory" className="btn btn-outline">
                  Ir al Inventario
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package /> Acciones Rápidas
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <Link href="/pos" className="btn btn-primary" style={{ padding: "1rem", justifyContent: "flex-start", fontSize: "1.125rem" }}>
              🛒 Iniciar Nueva Venta
            </Link>
            <Link href="/customers" className="btn btn-outline" style={{ padding: "1rem", justifyContent: "flex-start", fontSize: "1.125rem" }}>
              👥 Gestionar Fiados
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
