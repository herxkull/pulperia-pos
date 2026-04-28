"use client";

import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { Palette, Store, Users as UsersIcon, ShieldCheck, Database, Download, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { userRole, username } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"appearance" | "business" | "users" | "maintenance">("appearance");

  // Si el usuario es 'dueno' y está en la pestaña de usuarios (por URL o refresh), redirigir
  if (username === 'dueno' && activeTab === 'users') {
    setActiveTab('appearance');
  }

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

  const handleBusinessChange = (field: string, value: string) => {
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
          {username === 'admin' && (
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
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Mensaje al Pie del Recibo</label>
                  <textarea className="input-field" style={{ minHeight: "80px" }} value={settings.receiptFooter} onChange={e => handleBusinessChange('receiptFooter', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card" style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ marginBottom: "1.5rem" }}>Control de Accesos</h2>
              <div style={{ padding: "2rem", textAlign: "center", border: "2px dashed var(--border-color)", borderRadius: "12px" }}>
                <ShieldCheck size={48} style={{ color: "var(--primary)", margin: "0 auto 1rem", opacity: 0.5 }} />
                <h3>Gestión de Usuarios Activa</h3>
                <p style={{ color: "var(--text-muted)", maxWidth: "400px", margin: "1rem auto" }}>
                  Los roles actuales permiten diferenciar entre <strong>Administrador</strong> y <strong>Cajero</strong>.
                  Para agregar nuevos usuarios, contacta con soporte o utiliza el script de semilla.
                </p>
                <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
                  <button className="btn btn-outline" disabled>Crear Usuario</button>
                  <button className="btn btn-outline" disabled>Editar Permisos</button>
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
