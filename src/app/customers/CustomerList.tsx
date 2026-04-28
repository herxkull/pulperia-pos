"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, DollarSign, History, Calendar, CheckCircle2 } from "lucide-react";
import { createCustomer, updateCustomer, registerPayment, getCustomerPayments, getCustomerSales } from "@/actions/customer";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  creditLimit: number;
  currentDebt: number;
};

export default function CustomerList({
  initialCustomers,
  initialQuery,
}: {
  initialCustomers: Customer[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"abonos" | "compras">("abonos");
  const [loading, setLoading] = useState(false);

  // Formularios
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    creditLimit: "0",
  });
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "Efectivo",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/customers?q=${encodeURIComponent(query)}`);
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        creditLimit: customer.creditLimit.toString(),
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: "",
        phone: "",
        creditLimit: "0",
      });
    }
    setIsModalOpen(true);
  };

  const openPaymentModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentData({ amount: "", method: "Efectivo" });
    setIsPaymentModalOpen(true);
  };

  const openHistoryModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    setActiveTab("abonos");
    try {
      const [history, purchases] = await Promise.all([
        getCustomerPayments(customer.id),
        getCustomerSales(customer.id)
      ]);
      setPayments(history);
      setSales(purchases);
      setIsHistoryModalOpen(true);
    } catch (error) {
      alert("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsHistoryModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: formData.name,
        phone: formData.phone || undefined,
        creditLimit: parseFloat(formData.creditLimit),
      };

      if (selectedCustomer && !isPaymentModalOpen) {
        await updateCustomer(selectedCustomer.id, data);
      } else {
        await createCustomer(data);
      }
      closeModals();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el cliente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await registerPayment(selectedCustomer.id, parseFloat(paymentData.amount), paymentData.method);
      closeModals();
    } catch (error) {
      console.error(error);
      alert("Error al registrar el abono.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", width: "400px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="input-field"
              style={{ paddingLeft: "2.5rem" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline">Buscar</button>
        </form>

        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Límite de Crédito</th>
              <th>Deuda Actual</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              initialCustomers.map((customer) => {
                const availableCredit = customer.creditLimit - customer.currentDebt;
                return (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 500 }}>{customer.name}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>C$ {customer.creditLimit.toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: customer.currentDebt > 0 ? "var(--danger)" : "inherit" }}>
                      C$ {customer.currentDebt.toFixed(2)}
                    </td>
                    <td>
                      {availableCredit <= 0 && customer.creditLimit > 0 ? (
                         <span className="badge badge-danger">Límite Excedido</span>
                      ) : customer.currentDebt > 0 ? (
                        <span className="badge badge-warning">Con Deuda</span>
                      ) : (
                        <span className="badge badge-success">Al Día</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem" }} onClick={() => openModal(customer)} title="Editar">
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", color: "var(--primary)" }} onClick={() => openHistoryModal(customer)} title="Historial">
                          <History size={16} />
                        </button>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--success)", color: "white" }} 
                          onClick={() => openPaymentModal(customer)}
                          disabled={customer.currentDebt <= 0}
                          title="Registrar Abono"
                        >
                          <DollarSign size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo/Editar Cliente */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>
              {selectedCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Nombre *</label>
                <input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Teléfono</label>
                <input className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Límite de Crédito (C$) *</label>
                <input type="number" step="0.01" required className="input-field" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: e.target.value})} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Abono */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Registrar Abono</h2>
            <div style={{ backgroundColor: "var(--bg-hover)", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
              <p style={{ margin: 0 }}>Cliente: <strong>{selectedCustomer.name}</strong></p>
              <p style={{ margin: 0 }}>Deuda: <strong style={{ color: "var(--danger)" }}>C$ {selectedCustomer.currentDebt.toFixed(2)}</strong></p>
            </div>
            <form onSubmit={handlePayment}>
              <div className="input-group">
                <label className="input-label">Método de Pago</label>
                <select className="input-field" value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Monto a abonar (C$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  max={selectedCustomer.currentDebt}
                  required 
                  className="input-field" 
                  value={paymentData.amount} 
                  onChange={e => setPaymentData({...paymentData, amount: e.target.value})} 
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-success" style={{ backgroundColor: "var(--success)", color: "white" }} disabled={loading}>
                  {loading ? "Procesando..." : "Registrar Abono"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Pagos y Compras */}
      {isHistoryModalOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="card" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <h2 style={{ marginBottom: "0.5rem" }}>Historial del Cliente</h2>
            <p style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>Cliente: <strong>{selectedCustomer.name}</strong></p>
            
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
              <button 
                onClick={() => setActiveTab("abonos")}
                style={{ 
                  padding: "0.75rem 1.5rem", 
                  border: "none", 
                  background: "none", 
                  cursor: "pointer",
                  borderBottom: activeTab === "abonos" ? "2px solid var(--primary)" : "none",
                  color: activeTab === "abonos" ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: activeTab === "abonos" ? 600 : 400
                }}
              >
                Abonos (Pagos)
              </button>
              <button 
                onClick={() => setActiveTab("compras")}
                style={{ 
                  padding: "0.75rem 1.5rem", 
                  border: "none", 
                  background: "none", 
                  cursor: "pointer",
                  borderBottom: activeTab === "compras" ? "2px solid var(--primary)" : "none",
                  color: activeTab === "compras" ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: activeTab === "compras" ? 600 : 400
                }}
              >
                Compras (Tickets)
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem" }}>
              {activeTab === "abonos" ? (
                payments.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No hay registros de abonos.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {payments.map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <div style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", color: "var(--success)", padding: "0.5rem", borderRadius: "50%" }}>
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>C$ {p.amount.toFixed(2)}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Calendar size={12} /> {new Date(p.date).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="badge">Abono</div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                sales.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No hay registros de compras.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {sales.map((s) => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Ticket: {s.ticketNumber || `RECIBO #${s.id}`}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                            {new Date(s.date).toLocaleString()}
                          </div>
                          <div style={{ fontSize: "0.8rem" }}>
                            {s.items.length} productos
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>C$ {s.total.toFixed(2)}</div>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", marginTop: "0.5rem" }}
                            onClick={() => router.push(`/receipt/${s.id}`)}
                          >
                            Ver Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={closeModals}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0,0,0,0.5); z-index: 50;
          display: flex; alignItems: center; justifyContent: center;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
