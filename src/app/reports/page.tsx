"use client";

import { useState, useEffect } from "react";
import { 
  getSalesReport, 
  getInventoryReports, 
  getProfitabilityReport, 
  getAuditReports, 
  getCreditReports 
} from "@/actions/report";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line 
} from "recharts";
import { 
  Calendar, TrendingUp, ShoppingBag, CreditCard, DollarSign, Download, 
  ChevronRight, Box, BarChart3, ShieldAlert, Wallet, AlertCircle, TrendingDown,
  Printer, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type TabType = "ventas" | "inventario" | "rentabilidad" | "auditoria" | "credito";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("ventas");
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [creditData, setCreditData] = useState<any>(null);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [sales, inv, profit, audit, credit] = await Promise.all([
        getSalesReport(startDate, endDate),
        getInventoryReports(),
        getProfitabilityReport(startDate, endDate),
        getAuditReports(),
        getCreditReports()
      ]);
      setSalesData(sales);
      setInventoryData(inv);
      setProfitData(profit);
      setAuditData(audit);
      setCreditData(credit);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, [activeTab === "ventas" || activeTab === "rentabilidad"]); // Re-cargar si cambian fechas en estas pestañas

  const handleFilter = () => {
    loadAllReports();
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Header & Tabs */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Centro de Reportes</h1>
            <p style={{ color: "var(--text-muted)" }}>Analiza cada rincón de tu pulpería con datos en tiempo real.</p>
          </div>
          
          <div style={{ display: "flex", gap: "1rem" }}>
             {(activeTab === "ventas" || activeTab === "rentabilidad") && (
                <div className="card" style={{ padding: "0.5rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: 0 }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ fontSize: "0.65rem" }}>Desde</label>
                    <input type="date" className="input-field" style={{ padding: "0.3rem", fontSize: "0.85rem" }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ fontSize: "0.65rem" }}>Hasta</label>
                    <input type="date" className="input-field" style={{ padding: "0.3rem", fontSize: "0.85rem" }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" style={{ padding: "0.4rem 0.8rem" }} onClick={handleFilter}>
                    Filtrar
                  </button>
                </div>
             )}
             <button className="btn btn-outline" onClick={() => window.print()}>
               <Printer size={18} /> Imprimir
             </button>
          </div>
        </div>

        <div className="card" style={{ padding: "0.5rem", display: "flex", gap: "0.5rem", overflowX: "auto", marginBottom: "2rem" }}>
          <TabButton active={activeTab === "ventas"} icon={<TrendingUp size={18}/>} label="Ventas" onClick={() => setActiveTab("ventas")} />
          <TabButton active={activeTab === "inventario"} icon={<Box size={18}/>} label="Inventario" onClick={() => setActiveTab("inventario")} />
          <TabButton active={activeTab === "rentabilidad"} icon={<BarChart3 size={18}/>} label="Rentabilidad" onClick={() => setActiveTab("rentabilidad")} />
          <TabButton active={activeTab === "auditoria"} icon={<ShieldAlert size={18}/>} label="Auditoría" onClick={() => setActiveTab("auditoria")} />
          <TabButton active={activeTab === "credito"} icon={<Wallet size={18}/>} label="Crédito" onClick={() => setActiveTab("credito")} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className="spinner"></div>
          <p style={{ color: "var(--text-muted)" }}>Generando reportes profesionales...</p>
        </div>
      ) : (
        <div className="report-content">
          {activeTab === "ventas" && <SalesSection data={salesData} />}
          {activeTab === "inventario" && <InventorySection data={inventoryData} />}
          {activeTab === "rentabilidad" && <ProfitabilitySection data={profitData} />}
          {activeTab === "auditoria" && <AuditSection data={auditData} />}
          {activeTab === "credito" && <CreditSection data={creditData} />}
        </div>
      )}

      <style jsx>{`
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid var(--bg-hover);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={active ? "btn btn-primary" : "btn btn-ghost"}
      style={{ 
        flex: 1, minWidth: "140px", display: "flex", gap: "0.75rem", 
        justifyContent: "center", padding: "0.75rem",
        backgroundColor: active ? "var(--primary)" : "transparent",
        color: active ? "white" : "var(--text-muted)"
      }}
    >
      {icon} {label}
    </button>
  );
}

/** 1. SECCIÓN DE VENTAS */
function SalesSection({ data }: any) {
  if (!data) return null;
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        <SummaryCard label="Ventas Brutas" value={`C$ ${data.summary.totalSales.toLocaleString()}`} icon={<TrendingUp/>} color="#6366f1" />
        <SummaryCard label="Transacciones" value={data.summary.transactionCount} icon={<ShoppingBag/>} color="#10b981" />
        <SummaryCard label="Ticket Promedio" value={`C$ ${(data.summary.totalSales / (data.summary.transactionCount || 1)).toFixed(2)}`} icon={<DollarSign/>} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="card lg:col-span-2">
          <h3>Evolución de Ingresos</h3>
          <div style={{ height: "300px", width: "100%", marginTop: "1.5rem" }}>
            <ResponsiveContainer>
              <AreaChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" fill="rgba(99, 102, 241, 0.1)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3>Métodos de Pago</h3>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.paymentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {data.paymentData.map((_:any, index:number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

/** 2. SECCIÓN DE INVENTARIO */
function InventorySection({ data }: any) {
  if (!data) return null;
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        <SummaryCard label="Valorización (Costo)" value={`C$ ${data.valuation.toLocaleString()}`} icon={<Box/>} color="#8b5cf6" />
        <SummaryCard label="Ingreso Potencial" value={`C$ ${data.potentialRevenue.toLocaleString()}`} icon={<ArrowUpRight/>} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "var(--danger)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <AlertCircle size={20}/> Sugerido de Compras (Bajo Stock)
            </h3>
            <span className="badge badge-danger">{data.lowStock.length} productos</span>
          </div>
          <table className="table">
            <thead>
              <tr><th>Producto</th><th>Stock</th><th>Mínimo</th></tr>
            </thead>
            <tbody>
              {data.lowStock.map((p: any) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td style={{ color: "var(--danger)", fontWeight: 700 }}>{p.stock}</td>
                  <td>{p.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Inventario Lento ("Huesos")</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Productos sin ventas en los últimos 30 días.</p>
          <table className="table">
            <thead>
              <tr><th>Producto</th><th>Stock</th><th>Última Act.</th></tr>
            </thead>
            <tbody>
              {data.slowMoving.map((p: any) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.stock}</td>
                  <td style={{ fontSize: "0.75rem" }}>{new Date(p.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** 3. SECCIÓN DE RENTABILIDAD */
function ProfitabilitySection({ data }: any) {
  if (!data) return null;
  const marginPercent = ((data.netProfit / (data.totalRevenue || 1)) * 100).toFixed(1);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        <SummaryCard label="Ingresos" value={`C$ ${data.totalRevenue.toLocaleString()}`} icon={<DollarSign/>} color="#6366f1" />
        <SummaryCard label="Costo de Ventas" value={`C$ ${data.totalCOGS.toLocaleString()}`} icon={<TrendingDown/>} color="#f59e0b" />
        <SummaryCard label="Gastos Operativos" value={`C$ ${data.totalExpenses.toLocaleString()}`} icon={<CreditCard/>} color="#ef4444" />
        <SummaryCard 
          label="Utilidad Neta" 
          value={`C$ ${data.netProfit.toLocaleString()}`} 
          icon={<TrendingUp/>} 
          color="#10b981" 
          subValue={`${marginPercent}% margen`}
        />
      </div>

      <div className="card">
        <h3>Top Productos por Margen de Ganancia</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Ordenados por ganancia real aportada al negocio.</p>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer>
            <BarChart data={data.topMargins} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={150} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <Tooltip formatter={(val:any) => [`C$ ${val.toLocaleString()}`, 'Ganancia Real']} />
              <Bar dataKey="margin" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

/** 4. SECCIÓN DE AUDITORÍA */
function AuditSection({ data }: any) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "1.5rem" }}>
      <div className="card">
        <h3 style={{ marginBottom: "1.5rem" }}>Historial de Descuadres</h3>
        {data.mismatches.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Todo en orden. No hay descuadres registrados.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Esperado</th><th>Real</th><th>Diferencia</th></tr>
            </thead>
            <tbody>
              {data.mismatches.map((s: any) => {
                const diff = s.actualCash - s.expectedCash;
                return (
                  <tr key={s.id}>
                    <td style={{ fontSize: "0.8rem" }}>{new Date(s.closedAt).toLocaleDateString()}</td>
                    <td>C$ {s.expectedCash.toFixed(2)}</td>
                    <td>C$ {s.actualCash.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: diff < 0 ? "var(--danger)" : "var(--success)" }}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1.5rem" }}>Ventas Anuladas (Auditoría)</h3>
        <table className="table">
          <thead>
            <tr><th>Ticket</th><th>Hora</th><th>Total</th><th>Cajero</th></tr>
          </thead>
          <tbody>
            {data.voidedSales.map((s: any) => (
              <tr key={s.id}>
                <td style={{ fontSize: "0.8rem", fontWeight: 600 }}>{s.ticketNumber}</td>
                <td>{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>C$ {s.total.toFixed(2)}</td>
                <td style={{ fontSize: "0.8rem" }}>{s.customer?.name || "General"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 5. SECCIÓN DE CRÉDITO */
function CreditSection({ data }: any) {
  if (!data) return null;
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        <SummaryCard label="Dinero en la Calle" value={`C$ ${data.totalInStreet.toLocaleString()}`} icon={<Wallet/>} color="#ef4444" />
        <SummaryCard label="Clientes con Deuda" value={data.agingDebt.length} icon={<AlertCircle/>} color="#f59e0b" />
      </div>

      <div className="card">
        <h3>Antigüedad de Saldos</h3>
        <table className="table">
          <thead>
            <tr><th>Cliente</th><th>Deuda</th><th>Último Movimiento</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {data.agingDebt.map((c: any, idx: number) => {
              const days = c.lastPurchase ? Math.floor((Date.now() - new Date(c.lastPurchase).getTime()) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: "var(--danger)", fontWeight: 700 }}>C$ {c.debt.toFixed(2)}</td>
                  <td>{c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : "N/A"}</td>
                  <td>
                    {days > 30 ? <span className="badge badge-danger">Vencido (+30d)</span> : 
                     days > 15 ? <span className="badge badge-warning">En Riesgo</span> :
                     <span className="badge badge-success">Reciente</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SummaryCard({ label, value, icon, color, subValue }: any) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>{label}</p>
        <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{value}</h2>
        {subValue && <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>{subValue}</p>}
      </div>
      <div style={{ color, backgroundColor: `${color}15`, padding: "0.75rem", borderRadius: "12px" }}>
        {icon}
      </div>
    </div>
  );
}
