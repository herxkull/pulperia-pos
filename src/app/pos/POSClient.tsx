"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Users } from "lucide-react";
import { processSale } from "@/actions/pos";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
};

type Customer = {
  id: number;
  name: string;
  creditLimit: number;
  currentDebt: number;
};

type CartItem = Product & {
  cartId: string;
  quantity: number;
};

export default function POSClient({
  products,
  customers,
}: {
  products: Product[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal de Pago
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Efectivo" | "Tarjeta" | "Crédito">("Efectivo");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  // Escáner de Código de Barras (Captura global de teclado)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Enter" && e.target === searchInputRef.current) {
          e.preventDefault();
          handleSearchSubmit();
        }
        return;
      }

      if (e.key === "Enter") {
        if (barcodeBuffer.length > 0) {
          processBarcode(barcodeBuffer);
          setBarcodeBuffer("");
        }
      } else if (e.key.length === 1) { // Capturar caracteres legibles
        setBarcodeBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [barcodeBuffer, products]);

  const processBarcode = (code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
    } else {
      alert(`Producto con código ${code} no encontrado.`);
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    const codeProduct = products.find(p => p.barcode === searchQuery);
    if (codeProduct) {
      addToCart(codeProduct);
      setSearchQuery("");
      return;
    }

    const nameProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (nameProducts.length === 1) {
      addToCart(nameProducts[0]);
      setSearchQuery("");
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("¡Producto sin stock!");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("No hay suficiente stock.");
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [{ ...product, cartId: Math.random().toString(), quantity: 1 }, ...prev];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.stock) {
          return { ...item, quantity: newQ };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === "Crédito" && !selectedCustomerId) {
      alert("Debes seleccionar un cliente para la venta al crédito.");
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        total,
        customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const sale = await processSale(saleData);
      
      setCart([]);
      setIsCheckoutOpen(false);
      
      // Ir a la impresión del recibo
      router.push(`/receipt/${sale.id}`);
      
    } catch (error: any) {
      alert(error.message || "Error al procesar la venta");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    searchQuery && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  return (
    <div style={{ display: "flex", gap: "1.5rem", height: "100%" }}>
      {/* Columna Izquierda: Búsqueda y Productos */}
      <div style={{ flex: "2", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ position: "relative" }}>
            <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por código de barras o nombre del producto... (Presiona Enter)"
              className="input-field"
              style={{ paddingLeft: "3rem", fontSize: "1.125rem", padding: "1rem 1rem 1rem 3rem" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {searchQuery && filteredProducts.length > 0 && (
          <div className="card" style={{ flex: 1, overflowY: "auto" }}>
            <h3 style={{ marginBottom: "1rem" }}>Resultados</h3>
            <div className="grid grid-cols-3">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  style={{ 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "8px", 
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                  onClick={() => addToCart(product)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                >
                  <div>
                    <h4 style={{ marginBottom: "0.25rem" }}>{product.name}</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{product.barcode || "Sin código"}</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                    <strong style={{ color: "var(--primary)" }}>C$ {product.price.toFixed(2)}</strong>
                    <span style={{ fontSize: "0.875rem", color: product.stock > 0 ? "var(--success)" : "var(--danger)" }}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!searchQuery && (
          <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            <div style={{ textAlign: "center" }}>
              <ShoppingCart size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
              <h2>Escanea un producto</h2>
              <p>O utiliza la barra de búsqueda superior</p>
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha: Carrito */}
      <div className="card" style={{ flex: "1", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-hover)" }}>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart /> Venta Actual
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>
              El carrito está vacío
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {cart.map(item => (
                <div key={item.cartId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ color: "var(--primary)", fontWeight: 600 }}>C$ {item.price.toFixed(2)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button className="btn btn-outline" style={{ padding: "0.25rem", borderRadius: "50%" }} onClick={() => updateQuantity(item.cartId, -1)}>
                      <Minus size={16} />
                    </button>
                    <span style={{ width: "2rem", textAlign: "center", fontWeight: 600 }}>{item.quantity}</span>
                    <button className="btn btn-outline" style={{ padding: "0.25rem", borderRadius: "50%" }} onClick={() => updateQuantity(item.cartId, 1)}>
                      <Plus size={16} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: "0.25rem", marginLeft: "0.5rem" }} onClick={() => removeFromCart(item.cartId)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-hover)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
            <span>Total:</span>
            <span>C$ {total.toFixed(2)}</span>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1rem", fontSize: "1.125rem" }}
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Cobrar Venta
          </button>
        </div>
      </div>

      {/* Modal de Cobro */}
      {isCheckoutOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Procesar Pago</h2>
            <div style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: "2rem", color: "var(--primary)" }}>
              C$ {total.toFixed(2)}
            </div>

            <form onSubmit={handleCheckout}>
              <div className="input-group">
                <label className="input-label">Método de Pago</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {[
                    { id: "Efectivo", icon: Banknote },
                    { id: "Tarjeta", icon: CreditCard },
                    { id: "Crédito", icon: Users }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      className={`btn ${paymentMethod === method.id ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1, padding: "1rem" }}
                      onClick={() => setPaymentMethod(method.id as any)}
                    >
                      <method.icon size={20} style={{ marginBottom: "0.5rem" }} />
                      <br/>{method.id}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "Crédito" && (
                <div className="input-group" style={{ marginTop: "1rem" }}>
                  <label className="input-label">Seleccionar Cliente (Fiado)</label>
                  <select 
                    className="input-field" 
                    value={selectedCustomerId} 
                    onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {customers.map(c => {
                      const available = c.creditLimit - c.currentDebt;
                      return (
                        <option key={c.id} value={c.id} disabled={available < total}>
                          {c.name} (Disponible: C$ {available.toFixed(2)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCheckoutOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading || (paymentMethod === "Crédito" && !selectedCustomerId)}>
                  {loading ? "Procesando..." : "Confirmar e Imprimir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
