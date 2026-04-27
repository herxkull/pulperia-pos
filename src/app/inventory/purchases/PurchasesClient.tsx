"use client";

import { useState } from "react";
import { addPurchase } from "@/actions/purchase";
import { Plus, Trash2, ShoppingCart, Truck, History } from "lucide-react";

export default function PurchasesClient({ 
  products, 
  suppliers, 
  recentPurchases 
}: { 
  products: any[]; 
  suppliers: any[]; 
  recentPurchases: any[] 
}) {
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  
  // Form para añadir al "carrito" de compra
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const addToCart = () => {
    if (!selectedProductId || !quantity || !unitCost) return;
    const product = products.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    setCart([...cart, {
      productId: product.id,
      name: product.name,
      quantity: Number(quantity),
      unitCost: Number(unitCost)
    }]);

    setSelectedProductId("");
    setQuantity("");
    setUnitCost("");
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleProcessPurchase = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      await addPurchase(
        cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
        selectedSupplier ? Number(selectedSupplier) : undefined
      );
      setCart([]);
      setSelectedSupplier("");
      alert("Compra registrada y stock actualizado.");
    } catch (error) {
      alert("Error al registrar compra");
    } finally {
      setLoading(false);
    }
  };

  const totalPurchase = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  return (
    <div className="grid grid-cols-3" style={{ gap: "2rem", alignItems: "start" }}>
      <div className="col-span-2 flex flex-col gap-6">
        <div className="card">
          <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Truck size={20} /> Nueva Factura
          </h2>
          
          <div className="flex flex-col gap-4">
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Proveedor (Opcional)</label>
              <select 
                className="input-field" 
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="">Seleccionar proveedor...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-4" style={{ gap: "1rem", alignItems: "end", backgroundColor: "var(--bg-main)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label className="label">Producto</label>
                <select 
                  className="input-field"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find(prod => prod.id === Number(e.target.value));
                    if (p) setUnitCost(p.cost.toString());
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cant.</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Costo U.</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-outline" onClick={addToCart}>
              <Plus size={18} /> Añadir a la Lista
            </button>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart size={20} /> Detalle de la Compra
          </h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Costo U.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Lista vacía</td></tr>
                ) : (
                  cart.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>C$ {item.unitCost.toFixed(2)}</td>
                      <td>C$ {(item.quantity * item.unitCost).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: "0.25rem" }} onClick={() => removeFromCart(index)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {cart.length > 0 && (
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", textAlign: "right" }}>
              <p style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Total Factura: C$ {totalPurchase.toFixed(2)}</p>
              <button className="btn btn-primary" onClick={handleProcessPurchase} disabled={loading}>
                {loading ? "Procesando..." : "Confirmar Ingreso de Mercancía"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={20} /> Historial
        </h2>
        <div className="flex flex-col gap-4">
          {recentPurchases.map((p: any) => (
            <div key={p.id} style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: "bold" }}>Compra #{p.id}</span>
                <span style={{ color: "var(--text-muted)" }}>{new Date(p.date).toLocaleDateString()}</span>
              </div>
              <p style={{ color: "var(--primary)", fontWeight: "bold" }}>C$ {p.totalCost.toFixed(2)}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.items.length} productos registrados</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
