"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Users } from "lucide-react";
import { processSale } from "@/actions/pos";
import { useRouter } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
  categoryId: number | null;
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
  categories,
}: {
  products: Product[];
  customers: Customer[];
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const { settings } = useSettings();
  const exchangeRate = settings.exchangeRate ?? 36.5;
  const [payInUSD, setPayInUSD] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal de Pago
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Efectivo" | "Tarjeta" | "Crédito" | "Transferencia">("Efectivo");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Escáner de Código de Barras (Captura global de teclado)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atajos Globales
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutOpen(true);
          setPayInUSD(false);
          setReceivedAmount("");
        }
      }
      if (e.key === "Escape") {
        setIsCheckoutOpen(false);
      }

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
      } else if (e.key.length === 1) {
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

  const addToCart = (product: any) => {
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

  const clearCart = () => {
    if (cart.length > 0 && confirm("¿Estás seguro de vaciar el carrito?")) {
      setCart([]);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const receivedInCordobas = payInUSD ? (Number(receivedAmount) * exchangeRate) : Number(receivedAmount);
  const change = (Number(receivedAmount) > 0) ? receivedInCordobas - total : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === "Efectivo" && receivedInCordobas < total) {
      alert("El monto pagado es insuficiente.");
      return;
    }

    if (paymentMethod === "Crédito" && !selectedCustomerId) {
      alert("Debes seleccionar un cliente para la venta al crédito.");
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        total,
        receivedAmount: receivedAmount ? Number(receivedInCordobas) : undefined,
        customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const result = await processSale(saleData);
      
      if (result.success && result.saleId) {
        setCart([]);
        setIsCheckoutOpen(false);
        router.push(`/receipt/${result.saleId}`);
      } else {
        alert(result.error || "Error al procesar la venta");
      }
    } catch (error: any) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode === searchQuery;
    const matchesCategory = selectedCategory === null || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  }).slice(0, 20);

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
              placeholder="Escanea o busca un producto..."
              className="input-field"
              style={{ paddingLeft: "3rem", fontSize: "1.125rem", padding: "1rem 1rem 1rem 3rem" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Barra de Categorías */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", scrollbarWidth: "none" }}>
          <button 
            className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: "nowrap" }}
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: "nowrap" }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="card" style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          <div className="grid grid-cols-3">
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: "span 3", textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                No se encontraron productos.
              </div>
            ) : (
              filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  style={{ 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "12px", 
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backgroundColor: "var(--bg-card)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                  }}
                  onClick={() => addToCart(product)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                  }}
                >
                  <div>
                    <h4 style={{ marginBottom: "0.25rem", color: "var(--text-main)" }}>{product.name}</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{product.barcode || "N/A"}</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                    <strong style={{ color: "var(--primary)", fontSize: "1.125rem" }}>C$ {product.price.toFixed(2)}</strong>
                    <span className={`badge ${product.stock > 5 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: "0.75rem" }}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Carrito */}
      <div className="card" style={{ flex: "1", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", border: "1px solid var(--border-color)" }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-hover)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1.25rem" }}>
            <ShoppingCart size={22} /> Venta
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Trash2 size={14} /> Vaciar
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "4rem" }}>
              <ShoppingCart size={48} style={{ opacity: 0.1, margin: "0 auto 1rem" }} />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {cart.map(item => (
                <div key={item.cartId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{item.name}</div>
                    <div style={{ color: "var(--primary)", fontWeight: 600 }}>C$ {(item.price * item.quantity).toFixed(2)} <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.8125rem" }}>({item.quantity} x C${item.price.toFixed(2)})</span></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <button className="btn btn-outline" style={{ width: "24px", height: "24px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }} onClick={() => updateQuantity(item.cartId, -1)}>
                      <Minus size={14} />
                    </button>
                    <span style={{ width: "1.5rem", textAlign: "center", fontWeight: 600, fontSize: "0.875rem" }}>{item.quantity}</span>
                    <button className="btn btn-outline" style={{ width: "24px", height: "24px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }} onClick={() => updateQuantity(item.cartId, 1)}>
                      <Plus size={14} />
                    </button>
                    <button className="btn btn-danger" style={{ width: "24px", height: "24px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "0.25rem" }} onClick={() => removeFromCart(item.cartId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "1.25rem", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-hover)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.25rem", color: "var(--primary)" }}>
            <span>Total:</span>
            <span>C$ {total.toFixed(2)}</span>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "1.125rem", fontSize: "1.125rem", fontWeight: 600, borderRadius: "12px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
            disabled={cart.length === 0}
            onClick={() => {
              setIsCheckoutOpen(true);
              setPayInUSD(false);
              setReceivedAmount("");
            }}
          >
            Cobrar (F4)
          </button>
        </div>
      </div>

      {/* Modal de Cobro */}
      {isCheckoutOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "550px", borderRadius: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0 }}>Finalizar Venta</h2>
              <button className="btn btn-outline" style={{ padding: "0.5rem" }} onClick={() => setIsCheckoutOpen(false)}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
              <div className="card" style={{ flex: 1, padding: "1rem", textAlign: "center", backgroundColor: "var(--bg-hover)", border: "none" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>TOTAL A PAGAR</p>
                <h3 style={{ margin: 0, fontSize: "1.65rem", color: "var(--primary)" }}>C$ {total.toFixed(2)}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                  (${ (total / exchangeRate).toFixed(2) } USD)
                </span>
              </div>
              {paymentMethod === "Efectivo" && (
                <div className="card" style={{ flex: 1, padding: "1rem", textAlign: "center", backgroundColor: change >= 0 && receivedAmount ? "rgba(34, 197, 94, 0.1)" : "var(--bg-hover)", border: "none" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>CAMBIO</p>
                  <h3 style={{ margin: 0, fontSize: "1.65rem", color: change >= 0 ? "var(--success)" : "var(--danger)" }}>
                    C$ {change >= 0 ? change.toFixed(2) : "0.00"}
                  </h3>
                  {change >= 0 && receivedAmount && (
                    <span style={{ fontSize: "0.8rem", color: "var(--success)", display: "block", marginTop: "0.25rem" }}>
                      (${ (change / exchangeRate).toFixed(2) } USD)
                    </span>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleCheckout}>
              <div className="input-group">
                <label className="input-label">Método de Pago</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                  {[
                    { id: "Efectivo", icon: Banknote },
                    { id: "Tarjeta", icon: CreditCard },
                    { id: "Transferencia", icon: Banknote },
                    { id: "Crédito", icon: Users }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      className={`btn ${paymentMethod === method.id ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: "0.75rem 0.25rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
                      onClick={() => setPaymentMethod(method.id as any)}
                    >
                      <method.icon size={18} />
                      {method.id}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "Efectivo" && (
                <div className="input-group" style={{ marginTop: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Moneda de Pago</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        type="button" 
                        className={`btn ${!payInUSD ? "btn-primary" : "btn-outline"}`} 
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px" }} 
                        onClick={() => { setPayInUSD(false); setReceivedAmount(""); }}
                      >
                        Córdoba (C$)
                      </button>
                      <button 
                        type="button" 
                        className={`btn ${payInUSD ? "btn-primary" : "btn-outline"}`} 
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "8px" }} 
                        onClick={() => { setPayInUSD(true); setReceivedAmount(""); }}
                      >
                        Dólar ($)
                      </button>
                    </div>
                  </div>

                  {payInUSD && (
                    <div style={{ backgroundColor: "var(--bg-hover)", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                      <span>Tasa de cambio aplicada:</span>
                      <strong>1 USD = C$ {exchangeRate.toFixed(2)}</strong>
                    </div>
                  )}

                  <label className="input-label">Paga con ({payInUSD ? "USD $" : "C$" })</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    style={{ fontSize: "1.5rem", padding: "1rem", textAlign: "center", fontWeight: 700 }}
                    value={receivedAmount}
                    onChange={e => setReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                  />

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                    {!payInUSD ? (
                      <>
                        {[50, 100, 200, 500, 1000].map(cash => (
                          <button 
                            key={cash} 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ flex: 1, minWidth: "55px", fontSize: "0.8rem", fontWeight: 700 }}
                            onClick={() => setReceivedAmount(cash.toString())}
                          >
                            {cash}
                          </button>
                        ))}
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          style={{ flex: 1, minWidth: "60px", fontSize: "0.8rem", fontWeight: 700, backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--primary)" }}
                          onClick={() => setReceivedAmount(total.toString())}
                        >
                          Exacto
                        </button>
                      </>
                    ) : (
                      <>
                        {[5, 10, 20, 50, 100].map(cash => (
                          <button 
                            key={cash} 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ flex: 1, minWidth: "55px", fontSize: "0.8rem", fontWeight: 700 }}
                            onClick={() => setReceivedAmount(cash.toString())}
                          >
                            ${cash}
                          </button>
                        ))}
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          style={{ flex: 1, minWidth: "60px", fontSize: "0.8rem", fontWeight: 700, backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--primary)" }}
                          onClick={() => setReceivedAmount((total / exchangeRate).toFixed(2))}
                        >
                          Exacto
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "Crédito" && (
                <div className="input-group" style={{ marginTop: "1rem" }}>
                  <label className="input-label">Seleccionar Cliente (Fiado)</label>
                  <select 
                    className="input-field" 
                    value={selectedCustomerId} 
                    onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                    required
                  >
                    <option value="">-- Buscar Cliente --</option>
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

              <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "1.25rem", fontSize: "1.125rem" }} disabled={loading || (paymentMethod === "Crédito" && !selectedCustomerId) || (paymentMethod === "Efectivo" && receivedInCordobas < total)}>
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
