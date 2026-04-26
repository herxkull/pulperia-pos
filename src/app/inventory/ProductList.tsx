"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "@/actions/product";

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
};

export default function ProductList({
  initialProducts,
  initialQuery,
}: {
  initialProducts: Product[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    price: "",
    cost: "",
    stock: "",
    minStock: "5",
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
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: "",
        name: "",
        price: "",
        cost: "",
        stock: "",
        minStock: "5",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
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
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data);
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      await deleteProduct(id);
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
              <th>Precio Venta</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              initialProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.barcode || "-"}</td>
                  <td style={{ fontWeight: 500 }}>{product.name}</td>
                  <td>C$ {product.price.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${product.stock <= product.minStock ? 'badge-danger' : 'badge-success'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
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

      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2">
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Nombre del Producto *</label>
                  <input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Código de Barras</label>
                  <input className="input-field" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Precio Venta (C$) *</label>
                  <input type="number" step="0.01" required className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Costo (C$) *</label>
                  <input type="number" step="0.01" required className="input-field" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Stock Actual *</label>
                  <input type="number" required className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Stock Mínimo (Alarma) *</label>
                  <input type="number" required className="input-field" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
