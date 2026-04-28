"use client";

import { useState, useEffect } from "react";
import { getSalesHistory, voidSale } from "@/actions/sale";
import { 
  Search, 
  Filter, 
  Eye, 
  Printer, 
  Trash2, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronRight
} from "lucide-react";

export default function SalesHistoryClient({ initialSales }: { initialSales: any[] }) {
  const [sales, setSales] = useState(initialSales);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    ticketNumber: "",
  });

  const loadSales = async () => {
    setLoading(true);
    const data = await getSalesHistory(filters);
    setSales(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSales();
  }, [filters]);

  const handleVoid = async (id: number) => {
    if (confirm("¿Estás seguro de anular esta venta? Esta acción devolverá el stock y ajustará la caja.")) {
      try {
        await voidSale(id);
        loadSales();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="badge badge-success">Completado</span>;
      case "VOIDED":
        return <span className="badge badge-danger">Anulado</span>;
      case "SUSPENDED":
        return <span className="badge badge-warning">En Espera</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH": return "Efectivo";
      case "CARD": return "Tarjeta";
      case "TRANSFER": return "Transferencia";
      case "CREDIT": return "Crédito";
      default: return method;
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Historial de Ventas</h1>
          <p style={{ color: "var(--text-muted)" }}>Auditoría, anulación y reimpresión de tickets.</p>
        </div>
      </div>

      {/* Área de Filtros */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontWeight: 600 }}>
          <Filter size={18} color="var(--primary)" />
          Filtros de Búsqueda
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <div className="input-group">
            <label className="input-label">Desde</label>
            <input 
              type="date" 
              className="input-field"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Hasta</label>
            <input 
              type="date" 
              className="input-field"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label className="input-label">No. Ticket</label>
            <input 
              type="text" 
              placeholder="Ej: T-12345"
              className="input-field"
              value={filters.ticketNumber}
              onChange={e => setFilters({...filters, ticketNumber: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Estado</label>
            <select 
              className="input-field"
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
            >
              <option value="">Todos los estados</option>
              <option value="COMPLETED">Completados</option>
              <option value="VOIDED">Anulados</option>
              <option value="SUSPENDED">En Espera</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>No. Ticket</th>
                <th>Método Pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "4rem" }}>
                    <div className="spinner" style={{ margin: "0 auto 1rem" }}></div>
                    Cargando historial...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                    No se encontraron ventas con los filtros aplicados.
                  </td>
                </tr>
              ) : sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.date).toLocaleString()}</td>
                  <td>
                    <span style={{ fontFamily: "monospace", backgroundColor: "var(--bg-hover)", padding: "2px 6px", borderRadius: "4px" }}>
                      {sale.ticketNumber || `#${sale.id.toString().padStart(6, '0')}`}
                    </span>
                  </td>
                  <td>{getPaymentMethodLabel(sale.paymentMethod)}</td>
                  <td style={{ fontWeight: "bold" }}>C$ {sale.total.toFixed(2)}</td>
                  <td>{getStatusBadge(sale.status)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <button 
                        className="btn btn-outline" 
                        title="Ver Detalle"
                        onClick={() => setSelectedSale(sale)}
                        style={{ padding: "0.5rem" }}
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="btn btn-outline" 
                        title="Reimprimir"
                        onClick={() => window.open(`/receipt/${sale.id}`, '_blank')}
                        style={{ padding: "0.5rem" }}
                      >
                        <Printer size={18} />
                      </button>
                      {sale.status !== "VOIDED" && (
                        <button 
                          className="btn btn-outline" 
                          title="Anular Venta"
                          onClick={() => handleVoid(sale.id)}
                          style={{ padding: "0.5rem", color: "var(--danger)" }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="card" style={{ width: "100%", maxWidth: "700px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedSale(null)} 
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              ✕
            </button>
            
            <h2 style={{ marginBottom: "0.5rem" }}>Detalle de Ticket</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Ticket: {selectedSale.ticketNumber || `#${selectedSale.id}`}</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Fecha:</span>
                  <span style={{ fontWeight: 500 }}>{new Date(selectedSale.date).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Pago:</span>
                  <span style={{ fontWeight: 500 }}>{getPaymentMethodLabel(selectedSale.paymentMethod)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Estado:</span>
                  <span>{getStatusBadge(selectedSale.status)}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Cliente:</span>
                  <span style={{ fontWeight: 500 }}>{selectedSale.customer?.name || "Consumidor Final"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Turno:</span>
                  <span style={{ fontWeight: 500 }}>#{selectedSale.shiftId || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="table-container" style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "2rem" }}>
              <table className="table">
                <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--bg-card)" }}>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.product.name}</td>
                      <td>{item.quantity}</td>
                      <td>C$ {item.price.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold" }}>C$ {(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "2px solid var(--border-color)" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase" }}>Total Venta</div>
                <div style={{ fontSize: "2rem", fontWeight: 900 }}>C$ {selectedSale.total.toFixed(2)}</div>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "2rem" }}>
              <button 
                className="btn btn-outline" 
                onClick={() => window.open(`/receipt/${selectedSale.id}`, '_blank')}
                style={{ flex: 1 }}
              >
                <Printer size={18} /> Reimprimir Ticket
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedSale(null)} style={{ flex: 1 }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
