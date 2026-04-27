"use client";

import { useSettings } from "@/context/SettingsContext";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

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

  const resetBgColor = () => {
    updateSettings({ customBgColor: "" });
  };

  return (
    <div>
      <h1>Configuraciones</h1>
      
      <div className="card" style={{ maxWidth: "600px", marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Apariencia del Sistema</h2>
        
        <div className="grid grid-cols-1">
          <div className="input-group">
            <label className="input-label">Tema (Claro / Oscuro)</label>
            <select 
              className="input-field" 
              value={settings.themeMode} 
              onChange={handleModeChange}
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Fuente Tipográfica</label>
            <select 
              className="input-field" 
              value={settings.fontFamily} 
              onChange={handleFontChange}
            >
              <option value="'Inter', system-ui, sans-serif">Inter (Por defecto)</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Outfit', sans-serif">Outfit</option>
              <option value="monospace">Monospace (Terminal)</option>
              <option value="serif">Serif (Clásica)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Tamaño de Texto Base ({settings.fontSize}px)</label>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={settings.fontSize} 
              onChange={handleSizeChange}
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Color de Fondo Personalizado</label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <input 
                type="color" 
                value={settings.customBgColor || (settings.themeMode === "dark" ? "#0f172a" : "#f8fafc")} 
                onChange={handleBgColorChange}
                style={{ width: "50px", height: "40px", padding: "0", cursor: "pointer" }}
              />
              <button type="button" className="btn btn-outline" onClick={resetBgColor}>
                Restablecer por Defecto
              </button>
            </div>
            {settings.customBgColor && (
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Actualmente usando: {settings.customBgColor}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
