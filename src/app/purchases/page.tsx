"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/actions/product";
import { addPurchase, getRecentPurchases } from "@/actions/purchase";
import { getSuppliers } from "@/actions/supplier";
import { PackagePlus, Trash2 } from "lucide-react";

export default function PurchasesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [cart, setCart] = useState<{product: any, quantity: number, unitCost: number, isPackage: boolean}[]>([]);
  const [supplier, setSupplier] = useState("");
  const [payFromCash, setPayFromCash] = useState(false);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  const loadData = async () => {
    const prods = await getProducts();
    setProducts(prods);
    const recent = await getRecentPurchases();
    setRecentPurchases(recent);
    const sups = await getSuppliers();
    setSuppliers(sups);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  ).slice(0, 5); // Solo mostrar top 5 resultados rápidos

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.product.id === product.id && c.isPackage === false);
    if (existing) {
      setCart(cart.map(c => (c.product.id === product.id && !c.isPackage) ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1, unitCost: product.cost, isPackage: false }]);
    }
    setSearchTerm("");
  };

  const removeFromCart = (productId: number, isPackage: boolean) => {
    setCart(cart.filter(c => !(c.product.id === productId && c.isPackage === isPackage)));
  };

  const handleProcessPurchase = async () => {
    if (cart.length === 0) return;
    const items = cart.map(c => ({
      productId: c.product.id,
      quantity: c.quantity,
      unitCost: c.unitCost,
      isPackage: c.isPackage
    }));
    const res = await addPurchase(items, supplier ? Number(supplier) : undefined, payFromCash);
    if (res.success) {
      setCart([]);
      setSupplier("");
      setPayFromCash(false);
      loadData();
      alert("Lote ingresado con éxito y stock actualizado.");
    }
  };

  const totalCost = cart.reduce((sum, c) => sum + (c.quantity * c.unitCost), 0);

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Ingreso de Lotes (Compras)</h1>
      
      <div className="grid grid-cols-2" style={{ gap: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
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
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.packageName} de {p.unitsPerPackage} {p.unitName}</div>
                    </div>
                    <span style={{ color: "var(--text-muted)" }}>Stock: {p.stock} | Costo: C$ {p.cost.toFixed(2)}</span>
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
                  <strong>{new Date(p.date).toLocaleDateString()} {p.supplier?.name && `- ${p.supplier.name}`}</strong>
                  <strong style={{ color: "var(--primary)" }}>C$ {p.totalCost.toFixed(2)}</strong>
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  {p.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ marginBottom: "1rem" }}>Lote Actual</h2>
          
          <div className="input-group" style={{ marginBottom: "1.5rem" }}>
            <label className="input-label">Proveedor (Opcional)</label>
            <select 
              className="input-field" 
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              <option value="">Seleccionar Proveedor...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="table-container" style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "1.5rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ width: "110px" }}>Tipo</th>
                  <th style={{ width: "80px" }}>Cant.</th>
                  <th style={{ width: "100px" }}>Costo Compra</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No hay productos en el lote.</td>
                  </tr>
                )}
                {cart.map((c, idx) => (
                  <tr key={`${c.product.id}-${idx}`}>
                    <td style={{ fontSize: "0.875rem" }}>{c.product.name}</td>
                    <td>
                      <select 
                        className="input-field" 
                        style={{ padding: "0.25rem", height: "30px", fontSize: "0.75rem" }}
                        value={c.isPackage ? "pkg" : "unit"}
                        onChange={(e) => {
                          const isPkg = e.target.value === "pkg";
                          const unitsPerPkg = c.product.unitsPerPackage || 1;
                          let newCost = c.unitCost;
                          
                          if (isPkg && !c.isPackage) {
                            newCost = c.unitCost * unitsPerPkg;
                          } else if (!isPkg && c.isPackage) {
                            newCost = c.unitCost / unitsPerPkg;
                          }

                          setCart(cart.map((item, i) => i === idx ? { ...item, isPackage: isPkg, unitCost: newCost } : item));
                        }}
                      >
                        <option value="unit">{c.product.unitName}</option>
                        <option value="pkg">{c.product.packageName}</option>
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
                      <input 
                        type="number" 
                        className="input-field" 
                        value={c.unitCost}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setCart(cart.map((item, i) => i === idx ? { ...item, unitCost: val } : item));
                        }}
                        style={{ padding: "0.25rem", height: "30px" }}
                        step="0.01"
                      />
                    </td>
                    <td style={{ fontWeight: "bold" }}>C$ {(c.quantity * c.unitCost).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => removeFromCart(c.product.id, c.isPackage)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: "var(--bg-hover)", padding: "1.5rem", borderRadius: "12px", marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 600 }}>Costo Total Lote:</span>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>C$ {totalCost.toFixed(2)}</span>
            </div>
            
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "white", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <input 
                type="checkbox" 
                id="payFromCash" 
                checked={payFromCash} 
                onChange={(e) => setPayFromCash(e.target.checked)}
                style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
              />
              <label htmlFor="payFromCash" style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                Pagar con efectivo de caja (Generar Gasto)
              </label>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "1rem", fontSize: "1.125rem", fontWeight: 700 }}
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
