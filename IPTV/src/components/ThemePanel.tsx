// src/components/ThemePanel.tsx
import React from "react";

interface Preset {
  id: string;
  name: string;
  primary: string;
  accent: string;
  bg: string;
}

interface Props {
  themePresets: Preset[];
  themeId: string;
  setThemeId: (id: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function ThemePanel({
  themePresets,
  themeId,
  setThemeId,
  darkMode,
  toggleDarkMode,
}: Props) {
  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h2 className="text-white text-xl font-semibold">Theme Presets</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themePresets.map((tp) => (
          <button
            key={tp.id}
            onClick={() => setThemeId(tp.id)}
            className={`p-4 rounded-xl border ${
              tp.id === themeId ? "ring-2 ring-offset-2" : ""
            }`}
            style={{ background: tp.bg }}
          >
            <div className="text-white font-semibold">{tp.name}</div>
            <div className="mt-2 text-sm text-white/90">
              Primary: <span style={{ color: tp.primary }}>{tp.primary}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-full bg-white/10 text-white"
        >
          {darkMode ? "Switch to Light" : "Switch to Dark"}
        </button>
      </div>
    </div>
  );
}
