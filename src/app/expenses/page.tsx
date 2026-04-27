"use client";

import { useEffect, useState } from "react";
import { addExpense, getExpenses } from "@/actions/expense";
import { DollarSign } from "lucide-react";
import { Expense, Shift } from "@prisma/client";

type ExpenseWithShift = Expense & { shift: Shift };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithShift[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const data = await getExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await addExpense(description, Number(amount));
    if (res.success) {
      setDescription("");
      setAmount("");
      loadData();
    } else {
      setError(res.error || "Error al agregar el gasto.");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Gastos (Salidas de Efectivo)</h1>
      
      <div className="grid grid-cols-2">
        <div className="card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <DollarSign /> Registrar Nuevo Gasto
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">Descripción del Gasto</label>
              <input 
                type="text" 
                className="input-field" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago proveedor Coca-Cola"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Monto (C$)</label>
              <input 
                type="number" 
                className="input-field" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            {error && <div style={{ color: "var(--danger)", fontSize: "0.875rem" }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem", marginTop: "0.5rem" }}>
              Registrar Salida de Dinero
            </button>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              * Esta cantidad será descontada del saldo esperado en el Corte de Caja actual.
            </p>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Historial de Gastos</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Turno Caja</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>No hay gastos recientes.</td>
                  </tr>
                )}
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.date).toLocaleString()}</td>
                    <td>{e.description}</td>
                    <td><span className="badge badge-warning">#{e.shiftId}</span></td>
                    <td style={{ color: "var(--danger)", fontWeight: "bold" }}>
                      - C$ {e.amount.toFixed(2)}
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
