import prisma from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, TrendingUp, Package, Users, DollarSign } from "lucide-react";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const salesToday = await prisma.sale.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: { items: true }
  });
  const totalSalesToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);

  let todayProfit = 0;
  for (const sale of salesToday) {
    for (const item of sale.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        todayProfit += (item.price - product.cost) * item.quantity;
      }
    }
  }

  const allProducts = await prisma.product.findMany();
  const actualLowStock = allProducts.filter(p => p.stock <= p.minStock);

  const debtors = await prisma.customer.count({
    where: { currentDebt: { gt: 0 } }
  });

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  
  const recentSales = await prisma.sale.findMany({
    where: { date: { gte: sevenDaysAgo } }
  });

  const weeklyData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const daySales = recentSales.filter(s => new Date(s.date).toDateString() === d.toDateString());
    const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
    weeklyData.push({ name: dayStr, total: dayTotal });
  }

  const saleItems = await prisma.saleItem.findMany({
    include: { product: true }
  });
  const productCounts: Record<number, { name: string, qty: number, total: number }> = {};
  saleItems.forEach(item => {
    if (!productCounts[item.productId]) {
      productCounts[item.productId] = { name: item.product.name, qty: 0, total: 0 };
    }
    productCounts[item.productId].qty += item.quantity;
    productCounts[item.productId].total += (item.quantity * item.price);
  });
  const topProducts = Object.values(productCounts).sort((a, b) => b.qty - a.qty).slice(0, 5);

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Dashboard Principal</h1>

      <div className="grid grid-cols-4" style={{ marginBottom: "2rem" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--primary)" }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Ventas Hoy</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>C$ {totalSalesToday.toFixed(2)}</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--success)" }}>
            <DollarSign size={32} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Ganancia Est.</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>C$ {todayProfit.toFixed(2)}</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--danger)" }}>
            <AlertTriangle size={32} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Stock Bajo</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{actualLowStock.length}</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--warning)" }}>
            <Users size={32} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Con Deuda</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{debtors}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: "2rem" }}>
        <div className="card">
          <h2 style={{ marginBottom: "1.5rem" }}>Ventas (Últimos 7 días)</h2>
          <DashboardCharts weeklyData={weeklyData} />
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "1.5rem" }}>Top 5 Productos Más Vendidos</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant. Vendida</th>
                  <th>Total Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>No hay datos de ventas.</td>
                  </tr>
                )}
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="badge badge-success">{p.qty}</span></td>
                    <td style={{ fontWeight: "bold" }}>C$ {p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
