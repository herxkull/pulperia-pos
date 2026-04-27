"use client";

import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { Palette, Store, Users as UsersIcon, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"appearance" | "business" | "users">("appearance");

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
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: "flex-start", gap: "1rem", padding: "1rem" }}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon size={20} /> Usuarios y Roles
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
                    <option value="'Inter', system-ui, sans-serif">Inter (Moderna)</option>
                    <option value="'Outfit', sans-serif">Outfit (Premium)</option>
                    <option value="'Roboto', sans-serif">Roboto (Estándar)</option>
                    <option value="monospace">Monospace (Terminal)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Tamaño de Texto Base ({settings.fontSize}px)</label>
                  <input type="range" min="14" max="22" value={settings.fontSize} onChange={handleSizeChange} style={{ width: "100%" }} />
                </div>

                <div className="input-group">
                  <label className="input-label">Color de Fondo Personalizado</label>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input type="color" value={settings.customBgColor || (settings.themeMode === "dark" ? "#0f172a" : "#f8fafc")} onChange={handleBgColorChange} style={{ width: "60px", height: "40px", padding: 0, cursor: "pointer" }} />
                    <button type="button" className="btn btn-outline" onClick={resetBgColor}>Restablecer</button>
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
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
