"use client";

import { useState, useEffect } from "react";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/actions/supplier";
import { Truck, Plus, Edit2, Trash2, Phone, Mail, MapPin } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const loadSuppliers = async () => {
    setLoading(true);
    const data = await getSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      setFormData({ name: "", phone: "", email: "", address: "" });
      loadSuppliers();
    } catch (error: any) {
      alert(error.message || "Error al guardar proveedor");
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este proveedor?")) {
      try {
        await deleteSupplier(id);
        loadSuppliers();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1>Gestión de Proveedores</h1>
          <p style={{ color: "var(--text-muted)" }}>Administra los contactos de quienes surten tu negocio.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingSupplier(null); setFormData({ name: "", phone: "", email: "", address: "" }); setIsModalOpen(true); }}>
          <Plus size={20} /> Nuevo Proveedor
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Cargando proveedores...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: "1.5rem" }}>
          {suppliers.map((s) => (
            <div key={s.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ padding: "0.75rem", backgroundColor: "rgba(59, 130, 246, 0.1)", borderRadius: "12px", color: "var(--primary)" }}>
                    <Truck size={24} />
                  </div>
                  <h3 style={{ margin: 0 }}>{s.name}</h3>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Phone size={16} /> {s.phone || "Sin teléfono"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Mail size={16} /> {s.email || "Sin email"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin size={16} /> {s.address || "Sin dirección"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleEdit(s)}>
                  <Edit2 size={16} /> Editar
                </button>
                <button className="btn btn-outline" style={{ flex: 1, color: "var(--danger)" }} onClick={() => handleDelete(s.id)}>
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", animation: "fadeIn 0.3s ease" }}>
            <h2>{editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
            <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
              <div className="input-group">
                <label className="input-label">Nombre del Proveedor *</label>
                <input 
                  className="input-field" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Teléfono</label>
                <input 
                  className="input-field" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input 
                  className="input-field" 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Dirección</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: "80px" }}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingSupplier ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
