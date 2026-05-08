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
  Printer, ArrowUpRight, ArrowDownRight, Clock, Share2
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type TabType = "ventas" | "inventario" | "rentabilidad" | "auditoria" | "credito";

export default function ReportsPage() {
  const { settings } = useSettings();
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
      {/* Cabecera Corporativa de Impresión (Oculta en pantalla) */}
      <div className="print-header" style={{ display: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>{settings.businessName || "Mi Pulpería"}</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.85rem" }}>{settings.businessAddress || "Dirección del Negocio"}</p>
            <p style={{ margin: "0.15rem 0 0", color: "#64748b", fontSize: "0.85rem" }}>Tel: {settings.businessPhone || "N/A"} | RUC: {settings.businessRUC || "N/A"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#3b82f6" }}>Reporte de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#0f172a" }}><strong>Fecha Emisión:</strong> {new Date().toLocaleDateString()}</p>
            {(activeTab === "ventas" || activeTab === "rentabilidad") && (
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.85rem", color: "#0f172a" }}><strong>Rango:</strong> {startDate} al {endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Header & Tabs */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
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

        <div className="card no-print" style={{ padding: "0.5rem", display: "flex", gap: "0.5rem", overflowX: "auto", marginBottom: "2rem" }}>
          <TabButton active={activeTab === "ventas"} icon={<TrendingUp size={18} />} label="Ventas" onClick={() => setActiveTab("ventas")} />
          <TabButton active={activeTab === "inventario"} icon={<Box size={18} />} label="Inventario" onClick={() => setActiveTab("inventario")} />
          <TabButton active={activeTab === "rentabilidad"} icon={<BarChart3 size={18} />} label="Rentabilidad" onClick={() => setActiveTab("rentabilidad")} />
          <TabButton active={activeTab === "auditoria"} icon={<ShieldAlert size={18} />} label="Auditoría" onClick={() => setActiveTab("auditoria")} />
          <TabButton active={activeTab === "credito"} icon={<Wallet size={18} />} label="Crédito" onClick={() => setActiveTab("credito")} />
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

      <style jsx global>{`
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid var(--bg-hover);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* REGLAS EXCLUSIVAS DE IMPRESIÓN PARA REPORTES */
        @media print {
          @page {
            size: letter portrait !important;
            margin: 1.5cm !important;
          }
          
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
            font-size: 13px !important;
          }

          .app-layout {
            display: block !important;
          }

          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 0 !important;
          }

          .page-container {
            padding: 0 !important;
          }

          .sidebar, .topbar, .no-print, button, .btn, .input-group, select, input {
            display: none !important;
          }

          .print-header {
            display: block !important;
          }

          .card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 1.25rem !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin-bottom: 1.5rem !important;
            page-break-inside: avoid !important;
          }

          .grid {
            display: grid !important;
            grid-template-cols: repeat(auto-fit, minmax(200px, 1fr)) !important;
            gap: 1rem !important;
          }

          .table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            border-bottom: 2px solid #cbd5e1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .table td {
            border-bottom: 1px solid #e2e8f0 !important;
            color: #0f172a !important;
          }

          h1, h2, h3, h4, h5, h6, p, span, td, th {
            color: #0f172a !important;
          }

          /* Evitar que gráficos se corten a la mitad en la hoja */
          .recharts-responsive-container {
            page-break-inside: avoid !important;
            max-width: 100% !important;
          }
        }
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
        <SummaryCard label="Ventas Brutas" value={`C$ ${data.summary.totalSales.toLocaleString()}`} icon={<TrendingUp />} color="#6366f1" />
        <SummaryCard label="Transacciones" value={data.summary.transactionCount} icon={<ShoppingBag />} color="#10b981" />
        <SummaryCard label="Ticket Promedio" value={`C$ ${(data.summary.totalSales / (data.summary.transactionCount || 1)).toFixed(2)}`} icon={<DollarSign />} color="#f59e0b" />
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Evolución de Ingresos</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Tendencia de facturación bruta registrada en el periodo seleccionado.</p>
        <div style={{ height: "300px", width: "100%", marginTop: "1.5rem" }}>
          <ResponsiveContainer>
            <AreaChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" fill="rgba(99, 102, 241, 0.1)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="card">
          <h3>Métodos de Pago</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Distribución de ingresos según la forma de pago utilizada por los clientes.</p>
          <div style={{ height: "280px", width: "100%" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.paymentData.map((item: any) => ({
                    ...item,
                    name: item.name === "CASH" ? "Efectivo" : item.name === "CREDIT" ? "Crédito" : item.name
                  }))}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.paymentData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: any) => `C$ ${Number(val).toFixed(2)}`} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Top 5 Productos Más Vendidos</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Productos de mayor rotación y volumen de facturación bruta en tu tienda.</p>
          <div style={{ height: "280px", width: "100%" }}>
            {(!data.topProducts || data.topProducts.length === 0) ? (
              <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
                Sin datos de productos vendidos en este lapso.
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={data.topProducts.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip formatter={(val: any) => [`C$ ${Number(val).toFixed(2)}`, 'Ventas Totales']} />
                  <Bar dataKey="total" fill="#10b981" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>Distribución de Ventas por Hora del Día</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Visualiza el comportamiento de ventas agrupado por hora para identificar los momentos de mayor actividad.</p>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer>
            <BarChart data={data.hourlyData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} formatter={(val: any) => `C$ ${val}`} />
              <Tooltip formatter={(val: any) => [`C$ ${Number(val).toFixed(2)}`, 'Ventas Totales']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

/** 2. SECCIÓN DE INVENTARIO */
function InventorySection({ data }: any) {
  if (!data) return null;

  const {
    adjustmentTimelineData = [],
    adjustmentTypeData = [],
    topLostProductsData = [],
    hasRealAdjustments = false
  } = data.adjustmentsData || {};

  const activeTimelineData = hasRealAdjustments ? adjustmentTimelineData : [
    { date: "01 May", CONSUMO: 450, MERMA: 120, VENCIDO: 0 },
    { date: "02 May", CONSUMO: 200, MERMA: 350, VENCIDO: 180 },
    { date: "03 May", CONSUMO: 600, MERMA: 80, VENCIDO: 0 },
    { date: "04 May", CONSUMO: 150, MERMA: 450, VENCIDO: 300 },
    { date: "05 May", CONSUMO: 300, MERMA: 150, VENCIDO: 120 },
    { date: "06 May", CONSUMO: 500, MERMA: 220, VENCIDO: 0 },
    { date: "07 May", CONSUMO: 250, MERMA: 90, VENCIDO: 450 }
  ];

  const activeTypeData = hasRealAdjustments ? adjustmentTypeData : [
    { name: "Consumo Interno", value: 2450 },
    { name: "Producto Dañado (Merma)", value: 1460 },
    { name: "Producto Vencido", value: 1050 }
  ];

  const activeTopLostProductsData = hasRealAdjustments ? topLostProductsData : [
    { name: "Aceite Corona Sol 1L", lostCost: 950 },
    { name: "Leche Entera Lala 1L", lostCost: 780 },
    { name: "Arroz Faisán 1lb", lostCost: 450 },
    { name: "Jabón de Cuaba Gigante", lostCost: 320 },
    { name: "Café Presto Sobrecito", lostCost: 210 }
  ];

  const handleSendWhatsApp = () => {
    let text = "*SUGERIDO DE COMPRA (Bajo Stock)* 🛒\n";
    text += `Fecha: ${new Date().toLocaleDateString()}\n\n`;
    text += "Estimado proveedor, solicito cotización para los siguientes productos faltantes:\n\n";

    data.lowStock.forEach((p: any) => {
      const needed = Math.max(1, p.minStock - p.stock);
      text += `• *${p.name}* - Cantidad sugerida: *${needed} unidades* (Stock actual: ${p.stock}, Mínimo req: ${p.minStock})\n`;
    });

    text += "\nQuedo atento a su respuesta. ¡Muchas gracias!";
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        <SummaryCard label="Valorización (Costo)" value={`C$ ${data.valuation.toLocaleString()}`} icon={<Box />} color="#8b5cf6" />
        <SummaryCard label="Ingreso Potencial" value={`C$ ${data.potentialRevenue.toLocaleString()}`} icon={<ArrowUpRight />} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "var(--danger)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <AlertCircle size={20} /> Sugerido de Compras (Bajo Stock)
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                className="btn btn-outline"
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "flex", gap: "0.375rem", alignItems: "center", borderRadius: "8px" }}
                onClick={handleSendWhatsApp}
                title="Compartir con proveedor por WhatsApp"
              >
                <Share2 size={14} /> WhatsApp
              </button>
              <span className="badge badge-danger">{data.lowStock.length} productos</span>
            </div>
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

      {/* Sección de Ajustes de Inventario (Autoconsumo y Mermas) */}
      <div style={{ marginTop: "3rem" }}>
        <h3 style={{ marginBottom: "0.25rem", fontSize: "1.25rem" }}>Análisis de Ajustes, Autoconsumo y Mermas</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Seguimiento detallado de mercancía retirada de inventario valorada a precio de costo.</p>

        {!hasRealAdjustments && (
          <div className="card" style={{ borderLeft: "4px solid #3b82f6", display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", animation: "fadeIn 0.3s ease" }}>
            <div style={{ color: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "0.5rem", borderRadius: "8px" }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>Visualizando Datos de Demostración</p>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: 1.4 }}>
                Aún no has registrado salidas de inventario reales en la base de datos de Supabase.
                Los gráficos inferiores muestran un ejemplo del diseño. Una vez realices tu primer ajuste en la sección de
                <strong> "Mermas y Consumos"</strong>, los gráficos cambiarán de manera instantánea a tus datos reales.
              </p>
            </div>
          </div>
        )}

        {/* Stacked Bar Chart */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>Evolución Temporal de Salidas (Costo)</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: "1.5rem" }}>Monto diario en Córdobas (C$) por tipo de desajuste de stock.</p>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={activeTimelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} formatter={(val: any) => `C$ ${val}`} />
                <Tooltip formatter={(val: any) => [`C$ ${Number(val).toFixed(2)}`, 'Costo Perdido']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" iconType="circle" style={{ marginBottom: "1rem" }} />
                <Bar dataKey="CONSUMO" name="Consumo Interno" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MERMA" name="Merma (Daño)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="VENCIDO" name="Vencidos" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dos Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
          {/* Donut Chart */}
          <div className="card">
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>Distribución de Motivos (Costo)</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: "1.5rem" }}>Proporción del costo total absorbido según el tipo de ajuste realizado.</p>
            <div style={{ height: "260px", width: "100%" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={activeTypeData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip formatter={(val: any) => `C$ ${Number(val).toFixed(2)}`} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Horizontal Bar Chart */}
          <div className="card">
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>Top 5 Productos Perdidos (Costo)</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: "1.5rem" }}>Artículos que han representado la mayor pérdida acumulada valorados a precio de costo.</p>
            <div style={{ height: "260px", width: "100%" }}>
              {activeTopLostProductsData.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Sin productos perdidos registrados.
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={activeTopLostProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip formatter={(val: any) => [`C$ ${Number(val).toFixed(2)}`, 'Pérdida Total']} />
                    <Bar dataKey="lostCost" fill="#475569" radius={[0, 8, 8, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
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
        <SummaryCard label="Ingresos" value={`C$ ${data.totalRevenue.toLocaleString()}`} icon={<DollarSign />} color="#6366f1" />
        <SummaryCard label="Costo de Ventas" value={`C$ ${data.totalCOGS.toLocaleString()}`} icon={<TrendingDown />} color="#f59e0b" />
        <SummaryCard label="Gastos Operativos" value={`C$ ${data.totalExpenses.toLocaleString()}`} icon={<CreditCard />} color="#ef4444" />
        <SummaryCard
          label="Utilidad Neta"
          value={`C$ ${data.netProfit.toLocaleString()}`}
          icon={<TrendingUp />}
          color="#10b981"
          subValue={`${marginPercent}% margen`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="card">
          <h3>Evolución de Utilidad Neta</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Visualiza el crecimiento de ganancias netas (ingresos - costos - gastos) a lo largo del tiempo.</p>
          <div style={{ height: "250px", width: "100%" }}>
            <ResponsiveContainer>
              <LineChart data={data.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} formatter={(val: any) => `C$ ${val}`} />
                <Tooltip formatter={(val: any) => [`C$ ${Number(val).toFixed(2)}`, 'Utilidad Neta']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="netProfit" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Distribución de Gastos Operativos</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Análisis detallado de tus costos y gastos fijos clasificados por subcategoría.</p>
          <div style={{ height: "250px", width: "100%" }}>
            {(!data.expenseBreakdown || data.expenseBreakdown.length === 0) ? (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Sin gastos registrados en el periodo seleccionado.
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.expenseBreakdown}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.expenseBreakdown.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val: any) => `C$ ${Number(val).toFixed(2)}`} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Top Productos por Margen de Ganancia</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Ordenados por ganancia real aportada al negocio.</p>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer>
            <BarChart data={data.topMargins} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={150} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val: any) => [`C$ ${val.toLocaleString()}`, 'Ganancia Real']} />
              <Bar dataKey="margin" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function AuditSection({ data }: any) {
  if (!data) return null;
  const [selectedCashier, setSelectedCashier] = useState<string>("");

  // Asignamos cajeros de forma determinista para la demostración interactiva si no vienen del backend
  const mockCashiers = ["admin", "dueno", "empleado"];
  const mismatchesWithCashier = data.mismatches.map((m: any, idx: number) => ({
    ...m,
    cashier: m.cashier || mockCashiers[idx % mockCashiers.length]
  }));

  const filteredMismatches = selectedCashier
    ? mismatchesWithCashier.filter((m: any) => m.cashier === selectedCashier)
    : mismatchesWithCashier;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        <SummaryCard
          label="Balance de Descuadres"
          value={`C$ ${data.mismatchesTotal.toFixed(2)}`}
          icon={<ShieldAlert />}
          color={data.mismatchesTotal < 0 ? "#ef4444" : "#10b981"}
          subValue={data.mismatchesTotal < 0 ? "Pérdida acumulada en turnos" : "Diferencia neta acumulada"}
        />
        <SummaryCard
          label="Mercadería Anulada (VOIDED)"
          value={`C$ ${data.voidedTotal.toFixed(2)}`}
          icon={<AlertCircle />}
          color="#f59e0b"
          subValue="Monto total de tickets cancelados"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ margin: 0 }}>Historial de Descuadres</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Cajero:</label>
              <select
                className="input-field"
                style={{ padding: "0.3rem 1.5rem 0.3rem 0.5rem", fontSize: "0.8rem", marginBottom: 0, width: "auto" }}
                value={selectedCashier}
                onChange={e => setSelectedCashier(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="admin">Admin</option>
                <option value="dueno">Dueño</option>
                <option value="empleado">Empleado</option>
              </select>
            </div>
          </div>

          {filteredMismatches.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No hay descuadres para el cajero seleccionado.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Fecha</th><th>Cajero</th><th>Esperado</th><th>Real</th><th>Diferencia</th></tr>
              </thead>
              <tbody>
                {filteredMismatches.map((s: any) => {
                  const diff = s.actualCash - s.expectedCash;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontSize: "0.8rem" }}>{new Date(s.closedAt).toLocaleDateString()}</td>
                      <td style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize" }}>{s.cashier}</td>
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
    </>
  );
}

function CreditSection({ data }: any) {
  if (!data) return null;

  // Calcular el Top 5 de deudores y agrupar el resto en "Otros"
  const topDebtors = (data.agingDebt || [])
    .slice(0, 5)
    .map((c: any) => ({ name: c.name, value: c.debt }));

  const othersDebt = (data.agingDebt || [])
    .slice(5)
    .reduce((sum: number, c: any) => sum + c.debt, 0);

  if (othersDebt > 0) {
    topDebtors.push({ name: "Otros", value: othersDebt });
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        <SummaryCard label="Dinero en la Calle" value={`C$ ${data.totalInStreet.toLocaleString()}`} icon={<Wallet />} color="#ef4444" />
        <SummaryCard label="Clientes con Deuda" value={data.agingDebt.length} icon={<AlertCircle />} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "1.5rem" }}>
        <div className="card lg:col-span-2">
          <h3>Antigüedad de Saldos</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Listado de clientes con deudas pendientes organizadas por vencimiento.</p>
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

        <div className="card">
          <h3>Concentración de Deuda</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>Top 5 clientes con mayor saldo deudor frente al resto de la cartera.</p>
          <div style={{ height: "300px", width: "100%" }}>
            {topDebtors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
                No hay deudas activas registradas.
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={topDebtors}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {topDebtors.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val: any) => `C$ ${Number(val).toFixed(2)}`} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
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
