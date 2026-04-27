"use client";

import { useEffect, useState } from "react";
import { getOpenShift, openShift, closeShift, getRecentShifts } from "@/actions/shift";
import { Lock, Unlock, DollarSign } from "lucide-react";
import { Shift, Sale, Expense } from "@prisma/client";

type ShiftWithDetails = Shift & { sales: Sale[], expenses: Expense[] };

export default function CashRegisterPage() {
  const [openShiftData, setOpenShiftData] = useState<ShiftWithDetails | null>(null);
  const [recentShifts, setRecentShifts] = useState<Shift[]>([]);
  const [startingCash, setStartingCash] = useState(0);
  const [actualCash, setActualCash] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const shift = await getOpenShift();
    setOpenShiftData(shift as ShiftWithDetails);
    if (shift) {
      const sales = shift.sales.reduce((a: number, b: Sale) => a + b.total, 0);
      const expenses = shift.expenses.reduce((a: number, b: Expense) => a + b.amount, 0);
      setActualCash(shift.startingCash + sales - expenses);
    }
    const recent = await getRecentShifts();
    setRecentShifts(recent);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    await openShift(Number(startingCash));
    loadData();
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openShiftData) return;
    if (confirm("¿Estás seguro de cerrar la caja con este monto?")) {
      await closeShift(openShiftData.id, Number(actualCash));
      loadData();
    }
  };

  if (loading) return <div>Cargando caja...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Corte de Caja (Turnos)</h1>

      {!openShiftData ? (
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
          <Lock size={48} style={{ color: "var(--warning)", marginBottom: "1rem" }} />
          <h2>La Caja está Cerrada</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Ingresa el saldo inicial (cambio) para abrir un nuevo turno y poder registrar ventas.</p>
          <form onSubmit={handleOpen} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label" style={{ textAlign: "left" }}>Efectivo Inicial (C$)</label>
              <input 
                type="number" 
                className="input-field" 
                value={startingCash}
                onChange={(e) => setStartingCash(Number(e.target.value))}
                min="0"
                step="0.01"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem" }}>
              Abrir Caja
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", color: "var(--success)" }}>
              <Unlock size={32} />
              <h2>Caja Abierta</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Fecha/Hora Apertura</span>
                <strong>{new Date(openShiftData.openedAt).toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Saldo Inicial</span>
                <strong>C$ {openShiftData.startingCash.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Ventas (+)</span>
                <strong style={{ color: "var(--success)" }}>
                  C$ {openShiftData.sales.reduce((a: number, b: Sale) => a + b.total, 0).toFixed(2)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Gastos (-)</span>
                <strong style={{ color: "var(--danger)" }}>
                  C$ {openShiftData.expenses.reduce((a: number, b: Expense) => a + b.amount, 0).toFixed(2)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", backgroundColor: "var(--bg-hover)", borderRadius: "8px" }}>
                <span style={{ fontWeight: "bold" }}>Efectivo Esperado</span>
                <strong style={{ fontSize: "1.25rem" }}>
                  C$ {(
                    openShiftData.startingCash + 
                    openShiftData.sales.reduce((a: number, b: Sale) => a + b.total, 0) - 
                    openShiftData.expenses.reduce((a: number, b: Expense) => a + b.amount, 0)
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleClose}>
              <h3 style={{ marginBottom: "1rem" }}>Cerrar Turno</h3>
              <div className="input-group">
                <label className="input-label">Efectivo Real en Caja (C$)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <button type="submit" className="btn btn-danger" style={{ width: "100%", padding: "0.75rem", marginTop: "1rem" }}>
                Realizar Cierre de Caja
              </button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: "1.5rem" }}>Últimos Turnos</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Esperado</th>
                    <th>Real</th>
                    <th>Dif.</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShifts.map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.openedAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${s.status === "OPEN" ? "badge-success" : "badge-danger"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>C$ {s.expectedCash.toFixed(2)}</td>
                      <td>{s.actualCash !== null ? `C$ ${s.actualCash.toFixed(2)}` : "-"}</td>
                      <td>
                        {s.actualCash !== null ? (
                          <span style={{ color: (s.actualCash - s.expectedCash) < 0 ? "var(--danger)" : "var(--success)" }}>
                            C$ {(s.actualCash - s.expectedCash).toFixed(2)}
                          </span>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
