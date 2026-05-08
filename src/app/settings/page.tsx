"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Palette, 
  Store, 
  Users as UsersIcon, 
  ShieldCheck, 
  Database, 
  Download, 
  Trash2,
  ShoppingCart,
  ShoppingBag,
  CupSoda,
  Cookie,
  Key,
  Lock,
  UserPlus
} from "lucide-react";
import { getUsers, createUser, changePassword, deleteUser } from "@/actions/auth";

export default function SettingsPage() {
  const { userRole, username } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"appearance" | "business" | "users" | "maintenance">("appearance");

  // User management states
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("CASHIER");
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const loadUsers = async () => {
    const res = await getUsers(userRole || undefined);
    if (res.success && res.users) {
      setUsers(res.users);
    } else {
      setUsersError(res.error || "Error al cargar los usuarios");
    }
  };

  useEffect(() => {
    if (activeTab === "users" && userRole) {
      loadUsers();
    }
  }, [activeTab, userRole]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsersError("");
    setUsersSuccess("");
    if (!newUsername || !newPassword) {
      setUsersError("Por favor completa todos los campos.");
      return;
    }
    const res = await createUser(newUsername, newPassword, newRole);
    if (res.success) {
      setUsersSuccess(`Usuario "${newUsername}" creado correctamente.`);
      setNewUsername("");
      setNewPassword("");
      loadUsers();
    } else {
      setUsersError(res.error || "Error al crear usuario.");
    }
  };

  const handleDeleteUser = async (id: number, uname: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${uname}"?`)) {
      return;
    }
    setUsersError("");
    setUsersSuccess("");
    const res = await deleteUser(id);
    if (res.success) {
      setUsersSuccess(`Usuario "${uname}" eliminado correctamente.`);
      loadUsers();
    } else {
      setUsersError(res.error || "Error al eliminar usuario.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsersError("");
    setUsersSuccess("");
    if (!editingUserId || !editPassword) {
      setUsersError("La contraseña no puede estar vacía.");
      return;
    }
    const res = await changePassword(editingUserId, editPassword);
    if (res.success) {
      setUsersSuccess("Contraseña actualizada correctamente.");
      setEditingUserId(null);
      setEditPassword("");
    } else {
      setUsersError(res.error || "Error al actualizar la contraseña.");
    }
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ fontFamily: e.target.value });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ fontSize: Number(e.target.value) });
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ themeMode: e.target.value as "light" | "dark" });
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ customBgColor: e.target.value });
  };

  const handleSidebarColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ customSidebarColor: e.target.value });
  };

  const resetSidebarColor = () => {
    updateSettings({ customSidebarColor: "" });
  };

  const handleBusinessChange = (field: string, value: any) => {
    updateSettings({ [field]: value });
  };

  const resetBgColor = () => {
    updateSettings({ customBgColor: "" });
  };

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Configuración del Sistema</h1>

      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Sidebar de Navegación */}
        <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            className={`btn ${activeTab === 'appearance' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: "flex-start", gap: "1rem", padding: "1rem" }}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={20} /> Apariencia
          </button>
          <button
            className={`btn ${activeTab === 'business' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: "flex-start", gap: "1rem", padding: "1rem" }}
            onClick={() => setActiveTab('business')}
          >
            <Store size={20} /> Datos del Negocio
          </button>
          {(userRole === "ADMIN" || userRole === "OWNER") && (
            <button 
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: "flex-start", gap: "1rem", padding: "1rem" }}
              onClick={() => setActiveTab('users')}
            >
              <UsersIcon size={20} /> Usuarios y Roles
            </button>
          )}
          <button 
            className={`btn ${activeTab === 'maintenance' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: "flex-start", gap: "1rem", padding: "1rem" }}
            onClick={() => setActiveTab('maintenance')}
          >
            <Database size={20} /> Mantenimiento
          </button>
        </div>

        {/* Contenido Principal */}
        <div style={{ flex: 1 }}>
          {activeTab === 'appearance' && (
            <div className="card" style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Personalizar Interfaz</h2>

              <div className="grid grid-cols-1">
                <div className="input-group">
                  <label className="input-label">Tema Visual</label>
                  <select className="input-field" value={settings.themeMode} onChange={handleModeChange}>
                    <option value="light">Modo Claro (Recomendado para impresión)</option>
                    <option value="dark">Modo Oscuro (Premium / TCG Style)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Fuente Tipográfica</label>
                  <select className="input-field" value={settings.fontFamily} onChange={handleFontChange}>
                    <option value="'Inter', sans-serif">Inter (Moderno)</option>
                    <option value="'Roboto', sans-serif">Roboto (Clásico)</option>
                    <option value="'Outfit', sans-serif">Outfit (Premium)</option>
                    <option value="monospace">Monospace (Terminal)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Tamaño de Fuente Global ({settings.fontSize}px)</label>
                  <input 
                    type="range" 
                    min="12" max="20" 
                    className="w-full"
                    value={settings.fontSize} 
                    onChange={handleSizeChange} 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Color de Fondo Personalizado (Opcional)</label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <input 
                      type="color" 
                      value={settings.customBgColor || "#f8fafc"} 
                      onChange={handleBgColorChange} 
                      style={{ height: "42px", width: "80px", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                    />
                    <button className="btn btn-outline" onClick={resetBgColor}>Restaurar Default</button>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: "1rem" }}>
                  <label className="input-label">Color de Fondo del Sidebar (Opcional)</label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <input 
                      type="color" 
                      value={settings.customSidebarColor || (settings.themeMode === "dark" ? "#1e293b" : "#ffffff")} 
                      onChange={handleSidebarColorChange} 
                      style={{ height: "42px", width: "80px", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                    />
                    <button className="btn btn-outline" onClick={resetSidebarColor}>Restaurar Default</button>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: "1.5rem" }}>
                  <label className="input-label">Icono de la Pulpería (Logo Lateral)</label>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {[
                      { name: "shopping-cart", icon: ShoppingCart, label: "Carrito" },
                      { name: "store", icon: Store, label: "Tienda" },
                      { name: "shopping-bag", icon: ShoppingBag, label: "Bolsa" },
                      { name: "cup-soda", icon: CupSoda, label: "Bebida" },
                      { name: "cookie", icon: Cookie, label: "Galleta" }
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isSelected = (settings.businessIcon || "shopping-cart") === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          className="btn"
                          onClick={() => updateSettings({ businessIcon: item.name })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1rem",
                            backgroundColor: isSelected ? "var(--primary)" : "var(--bg-card)",
                            color: isSelected ? "#ffffff" : "var(--text-main)",
                            border: `2px solid ${isSelected ? "var(--primary)" : "var(--border-color)"}`,
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <IconComp size={18} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="card" style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Información para el Ticket</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Estos datos aparecerán en el encabezado y pie de tus recibos impresos.</p>

              <div className="grid grid-cols-2">
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Nombre del Negocio</label>
                  <input className="input-field" value={settings.businessName} onChange={e => handleBusinessChange('businessName', e.target.value)} />
                </div>
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Dirección</label>
                  <input className="input-field" value={settings.businessAddress} onChange={e => handleBusinessChange('businessAddress', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Teléfono de Contacto</label>
                  <input className="input-field" value={settings.businessPhone} onChange={e => handleBusinessChange('businessPhone', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">RUC / Cédula</label>
                  <input className="input-field" value={settings.businessRUC} onChange={e => handleBusinessChange('businessRUC', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Tasa de Cambio (C$ por 1 USD)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    value={settings.exchangeRate ?? 36.5} 
                    onChange={e => handleBusinessChange('exchangeRate', parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Mensaje al Pie del Recibo</label>
                  <textarea className="input-field" style={{ minHeight: "80px" }} value={settings.receiptFooter} onChange={e => handleBusinessChange('receiptFooter', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeIn 0.3s ease" }}>
              {/* Avisos y Notificaciones */}
              {usersError && (
                <div className="card" style={{ borderLeft: "4px solid var(--danger)", backgroundColor: "rgba(239, 68, 68, 0.05)", padding: "1rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Lock size={18} />
                  <span>{usersError}</span>
                </div>
              )}
              {usersSuccess && (
                <div className="card" style={{ borderLeft: "4px solid var(--success)", backgroundColor: "rgba(34, 197, 94, 0.05)", padding: "1rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <ShieldCheck size={18} />
                  <span>{usersSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "2rem" }}>
                {/* Formulario de Registro */}
                <div className="card" style={{ height: "fit-content" }}>
                  <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserPlus size={20} style={{ color: "var(--primary)" }} /> Registrar Nuevo Usuario
                  </h3>
                  <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="input-group">
                      <label className="input-label">Nombre de Usuario</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Ej. maria_cajera" 
                        value={newUsername} 
                        onChange={e => setNewUsername(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Contraseña</label>
                      <input 
                        type="password" 
                        className="input-field" 
                        placeholder="••••••••" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Rol de Acceso</label>
                      <select 
                        className="input-field" 
                        value={newRole} 
                        onChange={e => setNewRole(e.target.value)}
                      >
                        <option value="CASHIER">Cajero / Empleado (Acceso limitado a POS)</option>
                        <option value="OWNER">Dueño de la tienda (Acceso completo)</option>
                        {userRole === "ADMIN" && (
                          <option value="ADMIN">Soporte Técnico (Root)</option>
                        )}
                      </select>
                    </div>

                    <div style={{ marginTop: "0.5rem", padding: "0.75rem", backgroundColor: "var(--bg-main)", borderRadius: "8px", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span>💡 <strong>Nota sobre límites:</strong></span>
                      <span>• Se permite un máximo de <strong>2 empleados (Cajeros)</strong> activos en el sistema.</span>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem", gap: "0.5rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <UserPlus size={18} /> Registrar Usuario
                    </button>
                  </form>
                </div>

                {/* Lista de Usuarios */}
                <div className="card" style={{ height: "fit-content" }}>
                  <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UsersIcon size={20} /> Usuarios Registrados
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {users.map((u) => {
                      const isMainUser = u.username === "admin" || u.username === "dueno";
                      return (
                        <div 
                          key={u.id} 
                          style={{ 
                            padding: "1rem", 
                            backgroundColor: "var(--bg-main)", 
                            borderRadius: "12px", 
                            border: "1px solid var(--border-color)",
                            display: "flex", 
                            flexDirection: "column", 
                            gap: "0.75rem" 
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: "1rem" }}>{u.username}</span>
                              {isMainUser && <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", backgroundColor: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>PRINCIPAL</span>}
                            </div>
                            <span className={`badge ${u.role === "ADMIN" ? "badge-primary" : u.role === "OWNER" ? "badge-warning" : "badge-success"}`}>
                              {u.role === "ADMIN" ? "Soporte Técnico" : u.role === "OWNER" ? "Dueño de la tienda" : "Cajero / Empleado"}
                            </span>
                          </div>

                          {editingUserId === u.id ? (
                            <form onSubmit={handleChangePassword} style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <input 
                                type="password" 
                                className="input-field" 
                                placeholder="Nueva Contraseña" 
                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", marginBottom: 0 }}
                                value={editPassword} 
                                onChange={e => setEditPassword(e.target.value)} 
                                required 
                              />
                              <button type="submit" className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>Guardar</button>
                              <button type="button" className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={() => setEditingUserId(null)}>Cancelar</button>
                            </form>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem", borderTop: "1px dashed var(--border-color)", paddingTop: "0.75rem" }}>
                              <button 
                                className="btn btn-ghost" 
                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--text-muted)" }}
                                onClick={() => {
                                  setEditingUserId(u.id);
                                  setEditPassword("");
                                }}
                              >
                                <Key size={12} /> Modificar Pass
                              </button>
                              {!isMainUser && (
                                <button 
                                  className="btn btn-ghost" 
                                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--danger)" }}
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                >
                                  <Trash2 size={12} /> Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="card" style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Mantenimiento del Sistema</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Gestiona la integridad y seguridad de tus datos.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ padding: "1.5rem", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ padding: "0.5rem", backgroundColor: "rgba(59, 130, 246, 0.1)", borderRadius: "8px", color: "var(--primary)" }}>
                      <Download size={20} />
                    </div>
                    <h3 style={{ margin: 0 }}>Copia de Seguridad</h3>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Descarga una copia completa de tu base de datos actual (SQLite). Recomendamos hacer esto al final de cada día.
                  </p>
                  <a href="/api/backup" className="btn btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
                    Descargar Respaldo (.db)
                  </a>
                </div>

                <div style={{ padding: "1.5rem", backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border-color)", opacity: 0.6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ padding: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", color: "var(--danger)" }}>
                      <Trash2 size={20} />
                    </div>
                    <h3 style={{ margin: 0 }}>Limpieza de Datos</h3>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Elimina registros antiguos de ventas y auditoría para liberar espacio. (Próximamente)
                  </p>
                  <button className="btn btn-outline" disabled>Iniciar Limpieza</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
