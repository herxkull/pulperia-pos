"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, ArrowUpRight, ArrowDownRight, PlusCircle } from "lucide-react";
import { createProduct, updateProduct, deleteProduct, registerAdjustment } from "@/actions/product";
import { createCategory } from "@/actions/category";
import { createSupplier } from "@/actions/supplier";
import { formatStock } from "@/lib/inventory-utils";

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  unitName: string;
  packageName: string;
  unitsPerPackage: number;
  wholesalePrice: number | null;
  categoryId: number | null;
  supplierId: number | null;
  expiryDate: Date | string | null;
};

type Category = { id: number; name: string };
type Supplier = { id: number; name: string };

export default function ProductList({
  initialProducts,
  initialQuery,
  categories,
  suppliers
}: {
  initialProducts: any[];
  initialQuery: string;
  categories: Category[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [isAddingSup, setIsAddingSup] = useState(false);
  const [showHybridStock, setShowHybridStock] = useState(true);

  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    price: "",
    cost: "",
    stock: "",
    minStock: "5",
    unitName: "Unidad",
    packageName: "Paquete",
    unitsPerPackage: "1",
    wholesalePrice: "",
    categoryId: "",
    supplierId: "",
    expiryDate: "",
  });

  const [adjustmentData, setAdjustmentData] = useState({
    quantity: "",
    reason: "Ajuste Manual",
    isAddition: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/inventory?q=${encodeURIComponent(query)}`);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode || "",
        name: product.name,
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        unitName: product.unitName || "Unidad",
        packageName: product.packageName || "Paquete",
        unitsPerPackage: product.unitsPerPackage?.toString() || "1",
        wholesalePrice: product.wholesalePrice?.toString() || "",
        categoryId: product.categoryId?.toString() || "",
        supplierId: product.supplierId?.toString() || "",
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: "",
        name: "",
        price: "",
        cost: "",
        stock: "0",
        minStock: "5",
        unitName: "Unidad",
        packageName: "Paquete",
        unitsPerPackage: "1",
        wholesalePrice: "",
        categoryId: "",
        supplierId: "",
        expiryDate: "",
      });
    }
    setIsModalOpen(true);
  };

  const openAdjustmentModal = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustmentData({ quantity: "", reason: "Ajuste Manual", isAddition: true });
    setIsAdjustmentModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsAdjustmentModalOpen(false);
    setEditingProduct(null);
    setAdjustingProduct(null);
  };

  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const cat = await createCategory(newCatName);
      setFormData({ ...formData, categoryId: cat.id.toString() });
      setNewCatName("");
      setIsAddingCat(false);
      router.refresh();
    } catch (error) {
      alert("Error al crear categoría");
    }
  };

  const handleQuickAddSupplier = async () => {
    if (!newSupName.trim()) return;
    try {
      const sup = await createSupplier({ name: newSupName });
      setFormData({ ...formData, supplierId: sup.id.toString() });
      setNewSupName("");
      setIsAddingSup(false);
      router.refresh();
    } catch (error) {
      alert("Error al crear proveedor");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        barcode: formData.barcode || undefined,
        name: formData.name,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        unitName: formData.unitName,
        packageName: formData.packageName,
        unitsPerPackage: parseInt(formData.unitsPerPackage),
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data);
      }
      closeModal();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setLoading(true);
    try {
      const qty = parseInt(adjustmentData.quantity) * (adjustmentData.isAddition ? 1 : -1);
      await registerAdjustment({
        productId: adjustingProduct.id,
        quantity: qty,
        reason: adjustmentData.reason,
      });
      closeModal();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al registrar ajuste");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      await deleteProduct(id);
      router.refresh();
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", width: "400px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              className="input-field"
              style={{ paddingLeft: "2.5rem" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline">Buscar</button>
        </form>

        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Cat.</th>
              <th>Precio</th>
              <th style={{ textAlign: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                  <span>Stock</span>
                  <button 
                    className="btn btn-outline" 
                    style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem", height: "auto" }}
                    onClick={() => setShowHybridStock(!showHybridStock)}
                  >
                    {showHybridStock ? "Ver Unidades" : "Ver Paquetes"}
                  </button>
                </div>
              </th>
              <th>Costo Unit.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              initialProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.barcode || "-"}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{product.packageName} de {product.unitsPerPackage} {product.unitName}</div>
                  </td>
                  <td><span className="badge">{product.category?.name || "Sin cat."}</span></td>
                  <td>
                    <div style={{ fontWeight: "bold" }}>C$ {product.price.toFixed(2)}</div>
                    {product.wholesalePrice && <div style={{ fontSize: "0.7rem", color: "var(--success)" }}>Mayor: C$ {product.wholesalePrice.toFixed(2)}</div>}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className={`badge ${product.stock <= product.minStock ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: "bold", padding: "0.5rem 0.75rem" }}>
                      {showHybridStock 
                        ? formatStock(product.stock, product.unitsPerPackage, product.unitName, product.packageName)
                        : `${product.stock} ${product.unitName}`
                      }
                    </div>
                  </td>
                  <td style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>C$ {product.cost.toFixed(2)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button title="Ajustar Stock" className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", color: "var(--warning)" }} onClick={() => openAdjustmentModal(product)}>
                        <ArrowUpRight size={16} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem" }} onClick={() => openModal(product)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Producto */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="card" style={{ width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Nombre del Producto *</label>
                  <input required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="input-group">
                  <label className="input-label">Código de Barras</label>
                  <input className="input-field" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    Categoría
                    <button type="button" style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={() => setIsAddingCat(!isAddingCat)}>
                      <PlusCircle size={14} /> {isAddingCat ? "Cancelar" : "Nueva"}
                    </button>
                  </label>
                  {isAddingCat ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input className="input-field" placeholder="Nombre de categoría" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                      <button type="button" className="btn btn-primary" onClick={handleQuickAddCategory}>Ok</button>
                    </div>
                  ) : (
                    <select className="input-field" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                      <option value="">Sin Categoría</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                <div style={{ gridColumn: "span 2", padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Configuración de Paquetes y Unidades</h3>
                  <div className="grid grid-cols-3" style={{ gap: "1rem" }}>
                    <div className="input-group">
                      <label className="input-label">Nombre Unidad</label>
                      <input placeholder="Unidad, Libra..." className="input-field" value={formData.unitName} onChange={e => setFormData({ ...formData, unitName: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Nombre Paquete</label>
                      <input placeholder="Caja, Cajilla..." className="input-field" value={formData.packageName} onChange={e => setFormData({ ...formData, packageName: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Unidades por Paquete</label>
                      <input type="number" min="1" className="input-field" value={formData.unitsPerPackage} onChange={e => setFormData({ ...formData, unitsPerPackage: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Stock Actual (en Unidades) *</label>
                  <input type="number" required className="input-field" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Stock Mínimo *</label>
                  <input type="number" required className="input-field" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
                </div>

                <div className="input-group">
                  <label className="input-label">Costo Unitario (C$) *</label>
                  <input type="number" step="0.0001" required className="input-field" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Precio Venta (C$) *</label>
                  <input type="number" step="0.01" required className="input-field" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Precio por Mayor (Opcional)</label>
                  <input type="number" step="0.01" className="input-field" value={formData.wholesalePrice} onChange={e => setFormData({ ...formData, wholesalePrice: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Fecha de Vencimiento</label>
                  <input type="date" className="input-field" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                </div>

                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    Proveedor
                    <button type="button" style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={() => setIsAddingSup(!isAddingSup)}>
                      <PlusCircle size={14} /> {isAddingSup ? "Cancelar" : "Nuevo"}
                    </button>
                  </label>
                  {isAddingSup ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input className="input-field" placeholder="Nombre de proveedor" value={newSupName} onChange={e => setNewSupName(e.target.value)} />
                      <button type="button" className="btn btn-primary" onClick={handleQuickAddSupplier}>Ok</button>
                    </div>
                  ) : (
                    <select className="input-field" value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
                      <option value="">Sin Proveedor</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste */}
      {isAdjustmentModalOpen && adjustingProduct && (
        <div className="modal-overlay">
          <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
            <h2 style={{ marginBottom: "1rem" }}>Ajustar Stock</h2>
            <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>{adjustingProduct.name}</p>
            <form onSubmit={handleAdjustmentSubmit}>
              <div className="input-group">
                <label className="input-label">Tipo de Movimiento</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className={`btn ${adjustmentData.isAddition ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setAdjustmentData({ ...adjustmentData, isAddition: true })}>
                    Entrada (+)
                  </button>
                  <button type="button" className={`btn ${!adjustmentData.isAddition ? 'btn-danger' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setAdjustmentData({ ...adjustmentData, isAddition: false })}>
                    Salida (-)
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Cantidad</label>
                <input type="number" required className="input-field" value={adjustmentData.quantity} onChange={e => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Motivo</label>
                <select className="input-field" value={adjustmentData.reason} onChange={e => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}>
                  <option value="Ajuste Manual">Ajuste Manual</option>
                  <option value="Daño">Producto Dañado</option>
                  <option value="Vencimiento">Vencimiento</option>
                  <option value="Autoconsumo">Autoconsumo</option>
                  <option value="Regalo/Muestra">Regalo / Muestra</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Registrar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0,0,0,0.5); z-index: 50;
          display: flex; alignItems: center; justifyContent: center;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
