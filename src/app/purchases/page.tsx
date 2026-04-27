"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/actions/product";
import { addPurchase, getRecentPurchases } from "@/actions/purchase";
import { PackagePlus, Trash2 } from "lucide-react";

export default function PurchasesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [cart, setCart] = useState<{product: any, quantity: number, unitCost: number}[]>([]);
  const [supplier, setSupplier] = useState("");
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  const loadData = async () => {
    const prods = await getProducts();
    setProducts(prods);
    const recent = await getRecentPurchases();
    setRecentPurchases(recent);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  ).slice(0, 5); // Solo mostrar top 5 resultados rápidos

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1, unitCost: product.cost }]);
    }
    setSearchTerm("");
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const handleProcessPurchase = async () => {
    if (cart.length === 0) return;
    const items = cart.map(c => ({
      productId: c.product.id,
      quantity: c.quantity,
      unitCost: c.unitCost
    }));
    const res = await addPurchase(items, supplier);
    if (res.success) {
      setCart([]);
      setSupplier("");
      loadData();
      alert("Lote ingresado con éxito y stock actualizado.");
    }
  };

  const totalCost = cart.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Ingreso de Lotes (Compras)</h1>
      
      <div className="grid grid-cols-2">
        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <PackagePlus /> Escanear o Buscar Producto
            </h2>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder="Escanea el código de barras o escribe el nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {searchTerm && (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filteredProducts.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => addToCart(p)}
                    style={{
                      display: "flex", justifyContent: "space-between", padding: "0.75rem",
                      backgroundColor: "var(--bg-hover)", border: "1px solid var(--border-color)",
                      borderRadius: "8px", cursor: "pointer", textAlign: "left"
                    }}
                  >
                    <span>{p.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>Stock: {p.stock} | Costo Act: C$ {p.cost.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: "1rem" }}>Últimos Ingresos</h2>
            {recentPurchases.slice(0, 5).map((p) => (
              <div key={p.id} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong>{new Date(p.date).toLocaleDateString()} {p.supplier && `- ${p.supplier}`}</strong>
                  <strong style={{ color: "var(--primary)" }}>C$ {p.totalCost.toFixed(2)}</strong>
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  {p.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Lote Actual</h2>
          
          <div className="input-group" style={{ marginBottom: "1.5rem" }}>
            <label className="input-label">Proveedor (Opcional)</label>
            <input 
              type="text" 
              className="input-field" 
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej: Distribuidora XYZ"
            />
          </div>

          <div className="table-container" style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "1.5rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ width: "80px" }}>Cant.</th>
                  <th style={{ width: "100px" }}>Costo Unit.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>No hay productos en el lote.</td>
                  </tr>
                )}
                {cart.map((c) => (
                  <tr key={c.product.id}>
                    <td style={{ fontSize: "0.875rem" }}>{c.product.name}</td>
                    <td>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={c.quantity}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setCart(cart.map(item => item.product.id === c.product.id ? { ...item, quantity: val } : item));
                        }}
                        style={{ padding: "0.25rem", height: "30px" }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={c.unitCost}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setCart(cart.map(item => item.product.id === c.product.id ? { ...item, unitCost: val } : item));
                        }}
                        style={{ padding: "0.25rem", height: "30px" }}
                        step="0.01"
                      />
                    </td>
                    <td style={{ fontWeight: "bold" }}>C$ {(c.quantity * c.unitCost).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => removeFromCart(c.product.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: "var(--bg-hover)", padding: "1.5rem", borderRadius: "8px", marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>Costo Total Lote:</span>
              <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>C$ {totalCost.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "1rem", fontSize: "1.125rem" }}
              onClick={handleProcessPurchase}
              disabled={cart.length === 0}
            >
              Procesar Lote y Actualizar Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
