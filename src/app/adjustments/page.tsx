"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/actions/product";
import { createAdjustment, getAdjustments } from "@/actions/adjustment";
import { PackageX, Trash2, ClipboardList, Info, AlertTriangle, UserCheck } from "lucide-react";

export default function AdjustmentsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [cart, setCart] = useState<{ product: any; quantity: number; isPackage: boolean }[]>([]);
  const [adjustmentType, setAdjustmentType] = useState("CONSUMO"); // CONSUMO, MERMA, VENCIDO
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const storeId = "test-store-123"; // ID de la tienda activa en sesión

  const loadData = async () => {
    const prods = await getProducts();
    setProducts(prods);
    const adjList = await getAdjustments(storeId);
    setAdjustments(adjList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  ).slice(0, 5); // Mostrar los primeros 5 resultados sugeridos

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.product.id === product.id && c.isPackage === false);
    if (existing) {
      setCart(cart.map(c => (c.product.id === product.id && !c.isPackage) ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1, isPackage: false }]);
    }
    setSearchTerm("");
  };

  const removeFromCart = (productId: number, isPackage: boolean) => {
    setCart(cart.filter(c => !(c.product.id === productId && c.isPackage === isPackage)));
  };

  const handleProcessAdjustment = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setMessage(null);

    const items = cart.map(c => ({
      productId: c.product.id,
      quantity: c.quantity,
      isPackage: c.isPackage
    }));

    const res = await createAdjustment({
      storeId,
      type: adjustmentType,
      reason: reason || undefined,
      items
    });

    setLoading(false);

    if (res.success) {
      setCart([]);
      setReason("");
      setMessage({ type: "success", text: "Salida de inventario procesada con éxito. El stock ha sido actualizado." });
      loadData();
    } else {
      setMessage({ type: "error", text: (res as any).error || "Ocurrió un error al procesar el ajuste." });
    }
  };

  const calculateTotalCost = () => {
    return cart.reduce((sum, c) => {
      const costPerItem = c.isPackage 
        ? (c.product.cost * (c.product.unitsPerPackage || 1)) 
        : c.product.cost;
      return sum + (c.quantity * costPerItem);
    }, 0);
  };

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case "CONSUMO": return { label: "Consumo Interno", color: "rgba(59, 130, 246, 0.1)", textColor: "var(--primary)" };
      case "MERMA": return { label: "Producto Dañado", color: "rgba(239, 68, 68, 0.1)", textColor: "var(--danger)" };
      case "VENCIDO": return { label: "Producto Vencido", color: "rgba(245, 158, 11, 0.1)", textColor: "var(--warning)" };
      default: return { label: type, color: "var(--bg-hover)", textColor: "var(--text-main)" };
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1>Autoconsumo y Mermas (Ajustes de Inventario)</h1>
          <p style={{ color: "var(--text-muted)" }}>Registra salidas de mercancía para uso interno o merma sin afectar el efectivo en caja.</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem",
          backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: message.type === "success" ? "var(--success)" : "var(--danger)",
          border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
          display: "flex", alignItems: "center", gap: "0.5rem"
        }}>
          {message.type === "success" ? <UserCheck size={20} /> : <AlertTriangle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-2" style={{ gap: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Panel de Búsqueda */}
          <div className="card">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <PackageX /> Escanear o Buscar Producto
            </h2>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder="Escanea el código de barras o busca el producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {searchTerm && (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>No se encontraron productos coincidentes.</div>
                ) : (
                  filteredProducts.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => addToCart(p)}
                      style={{
                        display: "flex", justifyContent: "space-between", padding: "0.75rem",
                        backgroundColor: "var(--bg-hover)", border: "1px solid var(--border-color)",
                        borderRadius: "8px", cursor: "pointer", textAlign: "left"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.packageName || "Paquete"} de {p.unitsPerPackage || 1} {p.unitName || "Unidades"}</div>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Stock: {p.stock} | Costo unitario: C$ {p.cost.toFixed(2)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Historial de Ajustes */}
          <div className="card">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <ClipboardList /> Últimos Ajustes Procesados
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "400px", overflowY: "auto" }}>
              {adjustments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>No se han registrado ajustes de inventario.</div>
              ) : (
                adjustments.slice(0, 10).map((adj) => {
                  const badge = getAdjustmentTypeLabel(adj.type);
                  return (
                    <div key={adj.id} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>Ajuste #{adj.id} - {new Date(adj.date).toLocaleDateString()}</span>
                          <span style={{
                            marginLeft: "0.5rem", fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "6px",
                            backgroundColor: badge.color, color: badge.textColor, fontWeight: "bold"
                          }}>{badge.label}</span>
                        </div>
                        <strong style={{ color: "var(--primary)" }}>C$ {adj.totalCost.toFixed(2)}</strong>
                      </div>
                      {adj.reason && (
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                          <strong>Nota:</strong> {adj.reason}
                        </p>
                      )}
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {adj.items.map((i: any) => `${i.quantity}x ${i.product.name} (Costo: C$ ${i.unitCost.toFixed(2)})`).join(", ")}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Formulario de Procesamiento de Salida */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ marginBottom: "1rem" }}>Detalles del Ajuste</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="input-group">
              <label className="input-label">Tipo de Salida</label>
              <select 
                className="input-field" 
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
              >
                <option value="CONSUMO">Consumo Interno</option>
                <option value="MERMA">Producto Dañado (Merma)</option>
                <option value="VENCIDO">Producto Vencido</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Razón / Notas (Opcional)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ej. Consumo oficina, caja rota..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: "350px", overflowY: "auto", marginBottom: "1.5rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ width: "110px" }}>Tipo</th>
                  <th style={{ width: "80px" }}>Cant.</th>
                  <th style={{ width: "110px" }}>Costo Unitario</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No hay productos en la lista de salida. Escribe arriba para buscarlos.</td>
                  </tr>
                ) : (
                  cart.map((c, idx) => {
                    const unitsPerPkg = c.product.unitsPerPackage || 1;
                    const costPerUnit = c.isPackage ? (c.product.cost * unitsPerPkg) : c.product.cost;
                    return (
                      <tr key={`${c.product.id}-${idx}`}>
                        <td style={{ fontSize: "0.875rem" }}>
                          <div>{c.product.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Disp: {c.product.stock} unid.</div>
                        </td>
                        <td>
                          <select 
                            className="input-field" 
                            style={{ padding: "0.25rem", height: "30px", fontSize: "0.75rem" }}
                            value={c.isPackage ? "pkg" : "unit"}
                            onChange={(e) => {
                              const isPkg = e.target.value === "pkg";
                              setCart(cart.map((item, i) => i === idx ? { ...item, isPackage: isPkg } : item));
                            }}
                          >
                            <option value="unit">{c.product.unitName || "Unidad"}</option>
                            <option value="pkg">{c.product.packageName || "Paquete"}</option>
                          </select>
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input-field" 
                            value={c.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setCart(cart.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                            }}
                            style={{ padding: "0.25rem", height: "30px" }}
                          />
                        </td>
                        <td>
                          <span style={{ fontSize: "0.875rem" }}>C$ {costPerUnit.toFixed(2)}</span>
                        </td>
                        <td style={{ fontWeight: "bold" }}>
                          C$ {(c.quantity * costPerUnit).toFixed(2)}
                        </td>
                        <td>
                          <button className="btn btn-danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => removeFromCart(c.product.id, c.isPackage)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: "var(--bg-hover)", padding: "1.5rem", borderRadius: "12px", marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  Valor Total a Costo: <Info size={14} style={{ color: "var(--text-muted)" }} />
                </span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Se calcula usando el costo real del inventario, no precio venta.</p>
              </div>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>C$ {calculateTotalCost().toFixed(2)}</span>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "1rem", fontSize: "1.125rem", fontWeight: 700 }}
              onClick={handleProcessAdjustment}
              disabled={cart.length === 0 || loading}
            >
              {loading ? "Procesando Ajuste..." : "Procesar Salida de Inventario"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
