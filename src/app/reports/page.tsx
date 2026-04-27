"use client";

import { useState, useEffect } from "react";
import { getSalesReport } from "@/actions/report";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from "recharts";
import { Calendar, TrendingUp, ShoppingBag, CreditCard, DollarSign } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    const data = await getSalesReport(startDate, endDate);
    setReportData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", gap: "2rem", flexWrap: "wrap" }}>
        <div>
          <h1>Reportes de Ventas</h1>
          <p style={{ color: "var(--text-muted)" }}>Analiza el rendimiento de tu negocio en tiempo real.</p>
        </div>
        
        <div className="card" style={{ padding: "1rem", display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Desde</label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Hasta</label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
            <Calendar size={18} /> Filtrar
          </button>
        </div>
      </div>

      {loading || !reportData ? (
        <div style={{ textAlign: "center", padding: "5rem" }}>Generando reportes...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: "1.5rem", marginBottom: "2.5rem" }}>
            <div className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Ventas Totales</p>
                  <h2 style={{ margin: "0.5rem 0 0" }}>C$ {reportData.summary.totalSales.toLocaleString()}</h2>
                </div>
                <div style={{ color: "var(--primary)", backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "0.75rem", borderRadius: "12px" }}>
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ borderLeft: "4px solid var(--success)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Transacciones</p>
                  <h2 style={{ margin: "0.5rem 0 0" }}>{reportData.summary.transactionCount}</h2>
                </div>
                <div style={{ color: "var(--success)", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "0.75rem", borderRadius: "12px" }}>
                  <ShoppingBag size={24} />
                </div>
              </div>
            </div>

            <div className="card" style={{ borderLeft: "4px solid var(--warning)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Ticket Promedio</p>
                  <h2 style={{ margin: "0.5rem 0 0" }}>
                    C$ {reportData.summary.transactionCount > 0 
                      ? (reportData.summary.totalSales / reportData.summary.transactionCount).toFixed(2) 
                      : 0}
                  </h2>
                </div>
                <div style={{ color: "var(--warning)", backgroundColor: "rgba(234, 179, 8, 0.1)", padding: "0.75rem", borderRadius: "12px" }}>
                  <DollarSign size={24} />
                </div>
              </div>
            </div>

            <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Método Principal</p>
                  <h2 style={{ margin: "0.5rem 0 0" }}>
                    {reportData.paymentData.length > 0 
                      ? [...reportData.paymentData].sort((a,b) => b.value - a.value)[0].name 
                      : "N/A"}
                  </h2>
                </div>
                <div style={{ color: "var(--danger)", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.75rem", borderRadius: "12px" }}>
                  <CreditCard size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Sales Chart */}
            <div className="card">
              <h3>Ventas en el Tiempo</h3>
              <div style={{ height: "300px", width: "100%", marginTop: "1rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      formatter={(value: any) => [`C$ ${Number(value).toLocaleString()}`, 'Ventas']}
                    />
                    <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Chart */}
            <div className="card">
              <h3>Distribución de Pagos</h3>
              <div style={{ height: "300px", width: "100%", marginTop: "1rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reportData.paymentData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="card">
            <h3>Top 10 Productos Más Vendidos</h3>
            <div className="table-container" style={{ marginTop: "1rem" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant. Vendida</th>
                    <th>Total Recaudado</th>
                    <th>Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topProducts.map((p: any, idx: number) => {
                    const maxTotal = reportData.topProducts[0].total;
                    const percentage = (p.total / maxTotal) * 100;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td>{p.quantity} uds.</td>
                        <td style={{ fontWeight: 600 }}>C$ {p.total.toLocaleString()}</td>
                        <td style={{ width: "30%" }}>
                          <div style={{ width: "100%", backgroundColor: "var(--bg-hover)", height: "8px", borderRadius: "4px" }}>
                            <div style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: COLORS[idx % COLORS.length], 
                              height: "100%", 
                              borderRadius: "4px" 
                            }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
