"use client";

import { useState } from "react";
import { openShift, closeShift } from "@/actions/shift";
import { createExpense } from "@/actions/expense";
import { Banknote, CreditCard, DollarSign, History, Plus, XCircle, ArrowRightCircle } from "lucide-react";

export default function CashRegisterClient({ 
  initialOpenShift, 
  recentShifts 
}: { 
  initialOpenShift: any; 
  recentShifts: any[] 
}) {
  const [loading, setLoading] = useState(false);
  const [startingCash, setStartingCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await openShift(Number(startingCash));
      setStartingCash("");
    } catch (error) {
      alert("Error al abrir turno");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("¿Estás seguro de cerrar el turno?")) return;
    setLoading(true);
    try {
      await closeShift(initialOpenShift.id, Number(actualCash));
      setActualCash("");
    } catch (error) {
      alert("Error al cerrar turno");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createExpense({
        description: expenseDesc,
        amount: Number(expenseAmount),
        shiftId: initialOpenShift.id
      });
      setExpenseDesc("");
      setExpenseAmount("");
    } catch (error) {
      alert("Error al registrar gasto");
    } finally {
      setLoading(false);
    }
  };

  if (!initialOpenShift) {
    return (
      <div className="card" style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center", padding: "3rem" }}>
        <Banknote size={64} style={{ color: "var(--primary)", marginBottom: "1.5rem" }} />
        <h2 style={{ marginBottom: "1rem" }}>Caja Cerrada</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Inicia un nuevo turno para comenzar a vender.
        </p>
        <form onSubmit={handleOpenShift}>
          <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            <label className="label">Efectivo Inicial (Base)</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Ej: 500" 
              required 
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Abriendo..." : "Abrir Turno"}
          </button>
        </form>
      </div>
    );
  }

  const totalSalesInCash = initialOpenShift.sales
    .filter((s: any) => s.paymentMethod === "Efectivo")
    .reduce((sum: number, s: any) => sum + s.total, 0);
  
  const totalExpenses = initialOpenShift.expenses
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const expectedCash = initialOpenShift.startingCash + totalSalesInCash - totalExpenses;

  return (
    <div className="grid grid-cols-2" style={{ alignItems: "start" }}>
      <div className="flex flex-col gap-6">
        <div className="card">
          <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <DollarSign size={20} /> Resumen del Turno
          </h2>
          <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Efectivo Inicial</p>
              <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>C$ {initialOpenShift.startingCash.toFixed(2)}</p>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Ventas Efectivo (+)</p>
              <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--success)" }}>C$ {totalSalesInCash.toFixed(2)}</p>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Gastos / Egresos (-)</p>
              <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--danger)" }}>C$ {totalExpenses.toFixed(2)}</p>
            </div>
            <div style={{ padding: "1rem", border: "2px solid var(--primary)", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--primary)" }}>Efectivo Esperado</p>
              <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>C$ {expectedCash.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <XCircle size={20} /> Registrar Gasto
          </h2>
          <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
            <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
              <div>
                <label className="label">Descripción</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: Pago de hielo" 
                  required 
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Monto</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="0.00" 
                  required 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-outline" style={{ width: "100%" }} disabled={loading}>
              <Plus size={18} /> Añadir Gasto
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)" }}>
            <ArrowRightCircle size={20} /> Cierre de Turno
          </h2>
          <form onSubmit={handleCloseShift}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Efectivo Real en Caja</label>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Cuenta el dinero físico en la gaveta.
              </p>
              <input 
                type="number" 
                className="input-field" 
                style={{ fontSize: "1.5rem", padding: "1rem" }}
                placeholder="0.00" 
                required 
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-danger" style={{ width: "100%", padding: "1rem" }} disabled={loading}>
              {loading ? "Cerrando..." : "Cerrar Turno y Finalizar Día"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <History size={20} /> Turnos Recientes
          </h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Esperado</th>
                  <th>Real</th>
                  <th>Dif.</th>
                </tr>
              </thead>
              <tbody>
                {recentShifts.filter(s => s.status === "CLOSED").map(shift => (
                  <tr key={shift.id}>
                    <td>{new Date(shift.closedAt).toLocaleDateString()}</td>
                    <td>C$ {shift.expectedCash.toFixed(2)}</td>
                    <td>C$ {shift.actualCash.toFixed(2)}</td>
                    <td style={{ color: shift.actualCash - shift.expectedCash >= 0 ? "var(--success)" : "var(--danger)" }}>
                      C$ {(shift.actualCash - shift.expectedCash).toFixed(2)}
                    </td>
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
