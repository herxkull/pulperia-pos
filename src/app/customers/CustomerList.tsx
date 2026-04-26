"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, DollarSign } from "lucide-react";
import { createCustomer, updateCustomer, registerPayment } from "@/actions/customer";

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Formularios
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    creditLimit: "0",
  });
  const [paymentAmount, setPaymentAmount] = useState("");

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
    setPaymentAmount("");
    setIsPaymentModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsPaymentModalOpen(false);
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
      await registerPayment(selectedCustomer.id, parseFloat(paymentAmount));
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

      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
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

      {isPaymentModalOpen && selectedCustomer && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Registrar Abono</h2>
            <p style={{ marginBottom: "1rem" }}>
              Cliente: <strong>{selectedCustomer.name}</strong><br />
              Deuda Actual: <strong style={{ color: "var(--danger)" }}>C$ {selectedCustomer.currentDebt.toFixed(2)}</strong>
            </p>
            <form onSubmit={handlePayment}>
              <div className="input-group">
                <label className="input-label">Monto a abonar (C$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  max={selectedCustomer.currentDebt}
                  required 
                  className="input-field" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-success" style={{ backgroundColor: "var(--success)", color: "white" }} disabled={loading}>
                  {loading ? "Procesando..." : "Abonar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
