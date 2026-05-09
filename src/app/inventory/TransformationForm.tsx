"use client";

import { useState } from "react";
import { HelpCircle, RefreshCw, Layers, ArrowRight } from "lucide-react";
import { processTransformation } from "@/actions/transformation";

interface Product {
  id: number;
  name: string;
  cost: number;
  stock: number;
  unitName: string;
  unit?: string;
  price: number;
}

interface TransformationFormProps {
  products: Product[];
  storeId?: string;
  onSuccess?: () => void;
}

export default function TransformationForm({
  products,
  storeId = "test-store-123",
  onSuccess
}: TransformationFormProps) {
  const [rawProductId, setRawProductId] = useState<number | "">("");
  const [rawQuantity, setRawQuantity] = useState<number | "">("");
  const [finishedProductId, setFinishedProductId] = useState<number | "">("");
  const [finishedQuantity, setFinishedQuantity] = useState<number | "">("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Encontrar productos seleccionados
  const selectedRaw = products.find((p) => p.id === Number(rawProductId));
  const selectedFinished = products.find((p) => p.id === Number(finishedProductId));

  // Obtener nombre de unidad seguro
  const getUnit = (product?: Product) => {
    if (!product) return "unidades";
    return product.unitName || product.unit || "unidades";
  };

  // Cálculos de Proyección Financiera en Vivo
  const totalCostApplied = selectedRaw && typeof rawQuantity === "number" 
    ? rawQuantity * selectedRaw.cost 
    : 0;

  const projectedNewCost = selectedFinished && typeof finishedQuantity === "number" && finishedQuantity > 0
    ? selectedFinished.stock <= 0
      ? totalCostApplied / finishedQuantity
      : ((selectedFinished.stock * selectedFinished.cost) + totalCostApplied) / (selectedFinished.stock + finishedQuantity)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawProductId || !rawQuantity || !finishedProductId || !finishedQuantity) {
      setMessage({ type: "error", text: "Por favor, completa todos los campos del formulario." });
      return;
    }

    if (Number(rawProductId) === Number(finishedProductId)) {
      setMessage({ type: "error", text: "El producto de origen y destino no pueden ser el mismo." });
      return;
    }

    if (selectedRaw && Number(rawQuantity) > selectedRaw.stock) {
      setMessage({
        type: "error",
        text: `Stock insuficiente de "${selectedRaw.name}". Máximo disponible: ${selectedRaw.stock} ${getUnit(selectedRaw)}`
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await processTransformation({
      rawProductId: Number(rawProductId),
      rawQuantity: Number(rawQuantity),
      finishedProductId: Number(finishedProductId),
      finishedQuantity: Number(finishedQuantity),
      storeId
    });

    setLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: `¡Transformación ejecutada con éxito! Se descontaron ${rawQuantity} ${getUnit(selectedRaw)} de "${selectedRaw?.name}" y se agregaron ${finishedQuantity} ${getUnit(selectedFinished)} a "${selectedFinished?.name}" actualizando su costo ponderado a C$ ${projectedNewCost.toFixed(2)}.`
      });
      
      // Limpiar cantidades
      setRawQuantity("");
      setFinishedQuantity("");
      
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setMessage({ type: "error", text: result.error || "Hubo un error al procesar la transformación." });
    }
  };

  return (
    <div style={{ padding: "0.5rem" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Layers size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)" }}>Procesar / Cocinar Producto</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem", margin: 0 }}>Mueve valor contable y unidades de materia prima a un producto final de forma exacta.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Alertas */}
        {message && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "10px",
              fontSize: "0.875rem",
              backgroundColor: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: message.type === "success" ? "var(--success)" : "var(--danger)",
              border: `1px solid ${message.type === "success" ? "var(--success)" : "var(--danger)"}`,
              fontWeight: 500
            }}
          >
            {message.text}
          </div>
        )}

        {/* Dos columnas del Proceso */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          
          {/* Columna Izquierda: Origen */}
          <div style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
                  Origen / Entrada
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Materia Prima</span>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600", color: "var(--text-main)" }}>Producto de Origen</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Seleccionar Producto</label>
                <select
                  value={rawProductId}
                  onChange={(e) => {
                    setRawProductId(e.target.value ? Number(e.target.value) : "");
                    setRawQuantity("");
                  }}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona la materia prima...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({getUnit(p)}) — Costo: C$ {p.cost.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Cantidad Utilizada</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={rawQuantity}
                    onChange={(e) => setRawQuantity(e.target.value ? Number(e.target.value) : "")}
                    className="input-field"
                    style={{ paddingRight: "5rem" }}
                    required
                  />
                  <div style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "var(--text-muted)", backgroundColor: "var(--bg-hover)", borderLeft: "1px solid var(--border-color)", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                    {getUnit(selectedRaw)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Auxiliares Origen */}
            {selectedRaw && (
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Stock Actual:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                    {selectedRaw.stock} {getUnit(selectedRaw)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Costo Unitario:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)" }}>C$ {selectedRaw.cost.toFixed(2)}</span>
                </div>
                {rawQuantity ? (
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", marginTop: "0.25rem", color: "var(--primary)", fontWeight: "600" }}>
                    <span>Inversión a Trasladar:</span>
                    <span>C$ {totalCostApplied.toFixed(2)}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Columna Derecha: Destino */}
          <div style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--success)", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
                  Destino / Salida
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Producto Final</span>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600", color: "var(--text-main)" }}>Producto Terminado</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Seleccionar Producto</label>
                <select
                  value={finishedProductId}
                  onChange={(e) => {
                    setFinishedProductId(e.target.value ? Number(e.target.value) : "");
                    setFinishedQuantity("");
                  }}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona el producto cocido...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({getUnit(p)}) — Costo Actual: C$ {p.cost.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Cantidad Obtenida</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={finishedQuantity}
                    onChange={(e) => setFinishedQuantity(e.target.value ? Number(e.target.value) : "")}
                    className="input-field"
                    style={{ paddingRight: "5rem" }}
                    required
                  />
                  <div style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "var(--text-muted)", backgroundColor: "var(--bg-hover)", borderLeft: "1px solid var(--border-color)", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                    {getUnit(selectedFinished)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Auxiliares Destino */}
            {selectedFinished && (
              <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Stock Actual:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                    {selectedFinished.stock} {getUnit(selectedFinished)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Costo Actual:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)" }}>C$ {selectedFinished.cost.toFixed(2)}</span>
                </div>
                {finishedQuantity && totalCostApplied ? (
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", marginTop: "0.25rem", color: "var(--success)", fontWeight: "600" }}>
                    <span>Costo Promedio Proyectado:</span>
                    <span>C$ {projectedNewCost.toFixed(2)} / {getUnit(selectedFinished)}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

        </div>

        {/* Sección Informativa de la Fórmula */}
        <div style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem", display: "flex", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)", alignItems: "flex-start", marginTop: "0.5rem" }}>
          <HelpCircle size={22} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "0.1rem" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.9rem" }}>Método de Costo Promedio Ponderado:</span>
            <p style={{ margin: 0, lineHeight: "1.4" }}>
              El sistema recalcula dinámicamente el costo unitario del producto terminado sumando la nueva inversión de materia prima al valor contable del inventario existente y dividiéndolo por el nuevo total de existencias. Esto previene fugas financieras y distorsiones contables.
            </p>
          </div>
        </div>

        {/* Botón de Envío */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "8px", fontWeight: "600" }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="spinner" style={{ width: "16px", height: "16px" }} />
                Procesando Transformación...
              </>
            ) : (
              <>
                <Layers size={18} />
                Ejecutar Transformación
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
