"use client";

import { useEffect, useState } from "react";
import { addExpense, getExpenses, getCurrentShiftExpensesTotal } from "@/actions/expense";
import { DollarSign, Wallet, ArrowDownRight, Tag } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [shiftTotal, setShiftTotal] = useState(0);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [subCategory, setSubCategory] = useState("Otros");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const [expensesData, total] = await Promise.all([
      getExpenses(),
      getCurrentShiftExpensesTotal()
    ]);
    setExpenses(expensesData);
    setShiftTotal(total);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await addExpense(description, Number(amount), subCategory);
      if (res.success) {
        setDescription("");
        setAmount("");
        setSubCategory("Otros");
        loadData();
      } else {
        setError(res.error || "Error al agregar el gasto.");
      }
    } catch (err) {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gastos (Salidas de Efectivo)</h1>
          <p className="text-muted text-sm">Registra y clasifica las salidas de dinero de la caja.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="card h-fit">
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-6">
            <DollarSign className="text-primary" /> Registrar Nuevo Gasto
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="input-label">Descripción del Gasto</label>
              <input 
                type="text" 
                className="input-field" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago de Luz local"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Clasificación del Gasto</label>
              <select 
                className="input-field"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                <option value="Servicios Básicos (Luz/Agua)">Servicios Básicos (Luz/Agua)</option>
                <option value="Transporte y Acarreo">Transporte y Acarreo</option>
                <option value="Adelanto de Salario">Adelanto de Salario</option>
                <option value="Insumos (Bolsas, Hielo, etc.)">Insumos (Bolsas, Hielo, etc.)</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Monto (C$)</label>
              <input 
                type="number" 
                className="input-field font-bold text-lg" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

            <button 
              type="submit" 
              className="btn btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? "Procesando..." : <> <ArrowDownRight size={18}/> Registrar Salida de Dinero </>}
            </button>
            
            <p className="text-xs text-muted mt-2 italic">
              * Esta cantidad se descontará automáticamente del efectivo esperado en el cierre de caja.
            </p>
          </form>
        </div>

        {/* Historial y Totalizador */}
        <div className="space-y-6">
          {/* Quick Stat Card */}
          <div className="card bg-orange-50 border-orange-200 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-orange-800 text-xs font-bold uppercase tracking-wider mb-1">Total Gastado en este Turno</p>
                <h2 className="text-3xl font-black text-orange-950">C$ {shiftTotal.toFixed(2)}</h2>
              </div>
              <div className="bg-orange-200 p-3 rounded-2xl text-orange-700">
                <Wallet size={32} />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Historial Reciente</h2>
            <div className="table-container max-h-[400px] overflow-y-auto">
              <table className="table">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th>Gasto / Categoría</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-8 text-muted">No hay gastos registrados.</td>
                    </tr>
                  )}
                  {expenses.map((e: any) => (
                    <tr key={e.id}>
                      <td className="py-3">
                        <div className="font-semibold text-sm">{e.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {e.category === 'INVENTORY_PURCHASE' ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                              Inventario
                            </span>
                          ) : (
                            <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                              Operativo - {e.subCategory || 'General'}
                            </span>
                          )}
                          <span className="text-[10px] text-muted flex items-center gap-1">
                            <Clock size={10}/> {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="text-right align-middle">
                        <span className="text-red-600 font-bold">
                          - C$ {e.amount.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .text-muted { color: var(--text-muted); }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .w-full { width: 100%; }
        /* Tailwind-like classes implemented via standard CSS for safety if Tailwind is not fully active */
        .bg-blue-100 { background-color: #dbeafe; }
        .text-blue-800 { color: #1e40af; }
        .bg-orange-100 { background-color: #ffedd5; }
        .text-orange-800 { color: #9a3412; }
        .bg-orange-50 { background-color: #fff7ed; }
        .bg-orange-200 { background-color: #fed7aa; }
        .border-orange-200 { border-color: #fed7aa; }
        .text-orange-950 { color: #431407; }
        .rounded-full { border-radius: 9999px; }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .py-0.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
      `}</style>
    </div>
  );
}

function Clock({ size, className }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
