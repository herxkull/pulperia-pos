"use client";

import { useState, useEffect } from "react";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierById } from "@/actions/supplier";
import { Truck, Plus, Edit2, Trash2, Phone, Mail, MapPin, Calendar, FileText, Package, ChevronRight, ArrowLeft, History, Search } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    visitDay: ""
  });

  const loadSuppliers = async () => {
    setLoading(true);
    const data = await getSuppliers();
    setSuppliers(data);
    setFilteredSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    const filtered = suppliers.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery))
    );
    setFilteredSuppliers(filtered);
  }, [searchQuery, suppliers]);

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
      setFormData({ name: "", phone: "", email: "", address: "", visitDay: "" });
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
      address: supplier.address || "",
      visitDay: supplier.visitDay || ""
    });
    setIsModalOpen(true);
  };

  const handleViewDetails = async (id: number) => {
    setLoading(true);
    const detailed = await getSupplierById(id);
    setSelectedSupplier(detailed);
    setLoading(false);
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

  if (selectedSupplier) {
    return (
      <div style={{ animation: "fadeIn 0.5s ease" }}>
        <button className="btn btn-outline" style={{ marginBottom: "1.5rem", background: "var(--bg-card)" }} onClick={() => setSelectedSupplier(null)}>
          <ArrowLeft size={18} /> Volver a la lista
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "1.5rem" }}>
          <div className="card flex flex-col gap-4">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ padding: "1rem", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--primary)", borderRadius: "12px" }}>
                <Truck size={32} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{selectedSupplier.name}</h2>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                   <span className="badge badge-success">
                    Visita: {selectedSupplier.visitDay || "No definido"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-main)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone size={16} className="text-muted" />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Teléfono</div>
                  <div style={{ fontWeight: 500 }}>{selectedSupplier.phone || "No registrado"}</div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-main)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={16} className="text-muted" />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Correo</div>
                  <div style={{ fontWeight: 500 }}>{selectedSupplier.email || "No registrado"}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-main)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MapPin size={16} className="text-muted" />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Dirección</div>
                  <div style={{ fontWeight: 500 }}>{selectedSupplier.address || "No registrado"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Package size={20} color="var(--primary)" /> Productos que suministra</h3>
            <div className="table-container" style={{ marginTop: "1rem" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Act.</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSupplier.products.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge" style={{ backgroundColor: "var(--bg-hover)" }}>{p.category?.name || "Sin cat."}</span></td>
                      <td>
                        <div className={`badge ${p.stock <= p.minStock ? 'badge-danger' : 'badge-success'}`}>
                          {p.stock} {p.unitName}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>C$ {p.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                  {selectedSupplier.products.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No hay productos asociados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card lg:col-span-3">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><History size={20} color="var(--primary)" /> Historial de Abastecimiento</h3>
            <div className="table-container" style={{ marginTop: "1rem" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Fecha de Ingreso</th>
                    <th>Productos</th>
                    <th>Inversión Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSupplier.purchases.map((p: any) => (
                    <tr key={p.id}>
                      <td><span style={{ fontFamily: "monospace", backgroundColor: "var(--bg-hover)", padding: "2px 6px", borderRadius: "4px" }}>#L-{p.id.toString().padStart(4, '0')}</span></td>
                      <td>{new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                      <td>{p.items.length} {p.items.length === 1 ? 'artículo' : 'artículos'}</td>
                      <td style={{ fontWeight: "bold", color: "var(--primary)", fontSize: "1rem" }}>C$ {p.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                  {selectedSupplier.purchases.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No hay compras registradas con este proveedor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Directorio de Proveedores</h1>
          <p style={{ color: "var(--text-muted)" }}>Gestiona tus fuentes de inventario y horarios de visita.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Buscar proveedor..." 
              className="input-field" 
              style={{ paddingLeft: "2.5rem", width: "250px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingSupplier(null); setFormData({ name: "", phone: "", email: "", address: "", visitDay: "" }); setIsModalOpen(true); }}>
            <Plus size={20} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }}></div>
          Cargando proveedores...
        </div>
      ) : (
        <>
          {filteredSuppliers.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
              <Truck size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
              <p>No se encontraron proveedores que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: "1.5rem" }}>
              {filteredSuppliers.map((s) => (
                <div key={s.id} className="card supplier-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "transform 0.2s" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ 
                          width: "48px", height: "48px", 
                          backgroundColor: "rgba(59, 130, 246, 0.1)", 
                          borderRadius: "12px", color: "var(--primary)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <Truck size={24} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{s.name}</h3>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Phone size={12} /> {s.phone || "Sin tel."}
                          </div>
                        </div>
                      </div>
                      {s.visitDay && (
                        <div className="badge badge-success" style={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.25rem", padding: "4px 8px" }}>
                          <Calendar size={12} /> {s.visitDay}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--primary)", border: "none" }} onClick={() => handleViewDetails(s.id)}>
                      <FileText size={16} /> Ver Historial y Productos
                    </button>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleEdit(s)}>
                        <Edit2 size={14} /> Editar
                      </button>
                      <button className="btn btn-outline" style={{ flex: 1, color: "var(--danger)", justifyContent: "center" }} onClick={() => handleDelete(s.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="card" style={{ width: "100%", maxWidth: "550px", animation: "fadeIn 0.3s ease", position: "relative" }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: "0.5rem" }}>{editingSupplier ? "Editar Proveedor" : "Registrar Proveedor"}</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              {editingSupplier ? "Modifica los datos del contacto." : "Ingresa los datos para un nuevo suministrador."}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Nombre de la Empresa / Proveedor *</label>
                <input 
                  className="input-field" 
                  required 
                  placeholder="Ej: Distribuidora Central"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">Teléfono de Contacto</label>
                  <input 
                    className="input-field" 
                    placeholder="+505 0000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Día de Pedido / Visita</label>
                  <select 
                    className="input-field" 
                    value={formData.visitDay}
                    onChange={e => setFormData({...formData, visitDay: e.target.value})}
                  >
                    <option value="">No definido</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <input 
                  className="input-field" 
                  type="email"
                  placeholder="proveedor@ejemplo.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Dirección / Bodega</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: "80px", resize: "none" }}
                  placeholder="Dirección física del proveedor..."
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  Descartar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingSupplier ? "Actualizar Datos" : "Crear Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
