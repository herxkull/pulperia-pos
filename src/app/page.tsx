import prisma from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, TrendingUp, Package, Users, DollarSign, Wallet, PieChart, Landmark } from "lucide-react";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Ventana de tiempo segura para consultas (desde ayer para evitar cualquier desfase horario)
  const safePastDate = new Date(today);
  safePastDate.setDate(safePastDate.getDate() - 1);

  // Ventas de Hoy (Cargamos ventas desde ayer y filtramos en memoria por el día local de hoy)
  const salesWindow = await prisma.sale.findMany({
    where: { date: { gte: safePastDate } },
    include: { items: { include: { product: true } } }
  });

  const salesToday = salesWindow.filter(
    (sale) => new Date(sale.date).toDateString() === today.toDateString() && sale.status === "COMPLETED"
  );

  const totalSalesToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);

  // Ganancia Bruta Hoy
  let todayProfit = 0;
  salesToday.forEach((sale: any) => {
    sale.items.forEach((item: any) => {
      const cost = item.product?.cost || 0;
      todayProfit += (item.price - cost) * item.quantity;
    });
  });

  // Gastos de Hoy (Mismo filtro seguro en memoria)
  const expensesWindow = await prisma.expense.findMany({
    where: { date: { gte: safePastDate } }
  });
  const expensesToday = expensesWindow.filter(
    (e) => new Date(e.date).toDateString() === today.toDateString()
  );
  const totalExpensesToday = expensesToday.reduce((sum, e) => sum + e.amount, 0);

  // Utilidad Neta Hoy (Ganancia Bruta - Gastos)
  const netProfitToday = todayProfit - totalExpensesToday;


  // Métodos de Pago Hoy (Corte de Caja parcial)
  const salesByMethod: Record<string, number> = {
    Efectivo: 0,
    Tarjeta: 0,
    Transferencia: 0,
    Crédito: 0
  };
  salesToday.forEach((s: any) => {
    const method = s.paymentMethod || "Efectivo";
    if (salesByMethod[method] !== undefined) {
      salesByMethod[method] += s.total;
    } else {
      salesByMethod["Efectivo"] += s.total; // Fallback
    }
  });

  // Inventario, Deuda y Vencimientos
  const allProducts = await prisma.product.findMany({ include: { category: true } } as any);
  const actualLowStock = allProducts.filter((p: any) => p.stock <= p.minStock);
  
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
  const expiringProducts = allProducts.filter((p: any) => p.expiryDate && new Date(p.expiryDate) <= fifteenDaysFromNow);

  const allCustomers = await prisma.customer.findMany();
  const totalDebt = allCustomers.reduce((sum, c) => sum + c.currentDebt, 0);
  const debtorsCount = allCustomers.filter(c => c.currentDebt > 0).length;

  // Gráfico Semanal
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const recentSales = await prisma.sale.findMany({
    where: { date: { gte: sevenDaysAgo }, status: "COMPLETED" }
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

  // Ventas por Categoría (Total histórico o mensual - usaremos histórico simplificado)
  const categorySales: Record<string, number> = {};
  const allSaleItems = await (prisma as any).saleItem.findMany({
    where: { sale: { status: "COMPLETED" } },
    include: { product: { include: { category: true } } }
  });

  allSaleItems.forEach((item: any) => {
    const catName = item.product.category?.name || "Sin Categoría";
    categorySales[catName] = (categorySales[catName] || 0) + (item.price * item.quantity);
  });
  const sortedCategories = Object.entries(categorySales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Panel de Control</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Hoy: {today.toLocaleDateString('es-ES', { dateStyle: 'long' })}
        </div>
      </div>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-4" style={{ marginBottom: "2rem" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderLeft: "4px solid var(--primary)" }}>
          <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--primary)" }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Ventas Hoy</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800 }}>C$ {totalSalesToday.toFixed(2)}</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderLeft: "4px solid var(--success)" }}>
          <div style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--success)" }}>
            <Landmark size={28} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Utilidad Neta</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800 }}>C$ {netProfitToday.toFixed(2)}</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderLeft: "4px solid var(--danger)" }}>
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--danger)" }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Stock Bajo</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800 }}>{actualLowStock.length} Items</p>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderLeft: "4px solid var(--warning)" }}>
          <div style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--warning)" }}>
            <Wallet size={28} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Deuda Clientes</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800 }}>C$ {totalDebt.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: "2rem" }}>
        {/* Gráfico Principal */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={18} /> Tendencia de Ventas (Semanal)
          </h3>
          <DashboardCharts weeklyData={weeklyData} />
        </div>

        {/* Resumen de Caja Hoy */}
        <div className="card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Landmark size={18} /> Resumen de Cobros Hoy
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {Object.entries(salesByMethod).map(([method, amount]) => (
              <div key={method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "var(--bg-hover)", borderRadius: "10px" }}>
                <span style={{ fontWeight: 500 }}>{method}</span>
                <span style={{ fontWeight: 700 }}>C$ {amount.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border-color)", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.125rem" }}>
              <span>Total en Caja:</span>
              <span style={{ color: "var(--primary)" }}>C$ {(salesByMethod.Efectivo + salesByMethod.Tarjeta + salesByMethod.Transferencia).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* Categorías más vendidas */}
        <div className="card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PieChart size={18} /> Desempeño por Categoría
          </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th style={{ textAlign: "right" }}>Total Ventas</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map(([cat, total]) => (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>C$ {total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Próximos a agotarse */}
          <div className="card">
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Package size={18} /> Alerta de Inventario (Bajo Stock)
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: "center" }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {actualLowStock.slice(0, 5).map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="badge">{p.category?.name || "General"}</span></td>
                      <td style={{ textAlign: "center" }}><span className="badge badge-danger">{p.stock}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Próximos a vencer */}
          <div className="card">
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--warning)" }}>
              <AlertTriangle size={18} /> Próximos a Vencer
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Vence</th>
                    <th style={{ textAlign: "center" }}>Días</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringProducts.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)" }}>Sin vencimientos próximos</td></tr>
                  ) : (
                    expiringProducts.slice(0, 5).map((p: any) => {
                      const days = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 500 }}>{p.name}</td>
                          <td>{new Date(p.expiryDate).toLocaleDateString()}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`badge ${days <= 3 ? 'badge-danger' : 'badge-warning'}`}>
                              {days} días
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
