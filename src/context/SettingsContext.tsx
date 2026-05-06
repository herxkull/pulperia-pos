"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeMode = "light" | "dark";

interface Settings {
  fontFamily: string;
  fontSize: number; // en px
  themeMode: ThemeMode;
  customBgColor: string;
  customSidebarColor?: string;
  businessIcon?: string;
  // Info del Negocio
  businessName: string;

  businessAddress: string;
  businessPhone: string;
  businessRUC: string;
  receiptFooter: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 16,
  themeMode: "light",
  customBgColor: "",
  customSidebarColor: "",
  businessIcon: "shopping-cart",
  businessName: "Mi Pulpería",

  businessAddress: "Calle Principal, Ciudad",
  businessPhone: "0000-0000",
  businessRUC: "000-000000-0000A",
  receiptFooter: "¡Gracias por su compra!",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pos_settings");
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {}
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("pos_settings", JSON.stringify(settings));
      
      const root = document.documentElement;
      
      if (settings.themeMode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      
      root.style.setProperty("--font-family", settings.fontFamily);
      root.style.setProperty("font-size", `${settings.fontSize}px`);
      
      if (settings.customBgColor) {
        root.style.setProperty("--bg-color", settings.customBgColor);
      } else {
        root.style.removeProperty("--bg-color");
      }

      if (settings.customSidebarColor) {
        root.style.setProperty("--sidebar-bg", settings.customSidebarColor);
      } else {
        root.style.removeProperty("--sidebar-bg");
      }
    }

  }, [settings, mounted]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
