// src/App.tsx
import { useState, useEffect, useMemo } from "react";
import { Routes, Route } from "react-router-dom";

import Background from "./components/Background";
import MenuBar from "./components/MenuBar";
import PlaylistManager from "./components/PlaylistManager";
import ChannelsList from "./components/ChannelsList";
import ThemePanel from "./components/ThemePanel";
import LivePlayer from "./components/LivePlayer";
import EPG from "./components/EPG";
import EPGManager from "./components/EPGManager";

import { Channel } from "./components/ChannelsTypes";
import { exampleChannels } from "./data/Channels";

// 🔹 Correct import: EPG types come from /src/types/epg.ts
import { EPGChannel, EPGEvent } from "./EPG";

// 🔹 Import utilities
import { channelsToPlaceholderEPG, normalizeEPGDates } from "./lib/epgUtils";

import { parseM3U } from "./components/ParseM3U";

export default function App() {
  // -----------------------------
  // Theme presets
  // -----------------------------
  const themePresets = useMemo(
    () => [
      {
        id: "apple",
        name: "Apple Blue",
        primary: "#0A84FF",
        accent: "#FF9F0A",
        bg: "radial-gradient(circle at 10% 20%, #0B1225, #0B0B0E)",
      },
      {
        id: "aurora",
        name: "Aurora",
        primary: "#7C5CFF",
        accent: "#FF6B6B",
        bg: "linear-gradient(135deg,#0b1020,#2c0b4b)",
      },
      {
        id: "midnight",
        name: "Midnight",
        primary: "#00D4FF",
        accent: "#FFB86B",
        bg: "linear-gradient(180deg,#04040a,#0a0a10)",
      },
    ],
    []
  );

  // -----------------------------
  // Theme state
  // -----------------------------
  const savedTheme = localStorage.getItem("themeId") || "apple";
  const [themeId, setThemeId] = useState<string>(savedTheme);
  const activeTheme = useMemo(
    () => themePresets.find((t) => t.id === themeId) ?? themePresets[0],
    [themeId, themePresets]
  );

  const [primaryColor, setPrimaryColor] = useState(activeTheme.primary);
  const [accentColor, setAccentColor] = useState(activeTheme.accent);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // -----------------------------
  // Playlist & channels state
  // -----------------------------
  const [playlists, setPlaylists] = useState<any[]>(() => {
    const saved = localStorage.getItem("playlists");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedChannels, setSelectedChannels] =
    useState<Channel[]>(exampleChannels);
  const [lastPlayed, setLastPlayed] = useState<Channel | null>(null);

  // -----------------------------
  // EPG state
  // -----------------------------
  const [epgData, setEpgData] = useState<EPGChannel[]>([]);
  const [reminders, setReminders] = useState<EPGEvent[]>([]);

  const addReminder = (event: EPGEvent) => {
    setReminders((prev) => [...prev, event]);
    console.log("Reminder set:", event.title);
  };

  const getNowNextForChannel = (channelId: string): EPGEvent[] => {
    const ch = epgData.find((c) => c.id === channelId);
    if (!ch) return [];
    const now = new Date();
    return ch.events.filter(
      (e) => new Date(e.start) <= now && new Date(e.end) >= now
    );
  };

  // -----------------------------
  // UI controls
  // -----------------------------
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // -----------------------------
  // Persist theme + playlists
  // -----------------------------
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("primaryColor", primaryColor);
    localStorage.setItem("accentColor", accentColor);
  }, [primaryColor, accentColor]);

  useEffect(() => {
    localStorage.setItem("themeId", themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }, [playlists]);

  // -----------------------------
  // Compute categories from channels
  // -----------------------------
  const categories = useMemo(() => {
    const s = new Set<string>();
    selectedChannels.forEach((c) => s.add(c.category || "Uncategorized"));
    return ["All", ...Array.from(s)];
  }, [selectedChannels]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // -----------------------------
  // Generate default EPG if none exists
  // -----------------------------
  useEffect(() => {
    if (!epgData.length && selectedChannels.length) {
      const generated = channelsToPlaceholderEPG(selectedChannels, {
        startHour: 8,
        slotCount: 6,
        slotDurationMin: 60,
      });
      setEpgData(normalizeEPGDates(generated));
    }
  }, [selectedChannels]);

  // -----------------------------
  // Handle M3U import (auto-generate placeholder EPG)
  // -----------------------------
  const handleM3UImport = (m3uText: string) => {
    const importedChannels = parseM3U(m3uText);
    setSelectedChannels(importedChannels);

    const placeholders = channelsToPlaceholderEPG(importedChannels, {
      startHour: 12,
      slotCount: 8,
      slotDurationMin: 60,
    });
    setEpgData(normalizeEPGDates(placeholders));
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: activeTheme.bg }}
    >
      <Background />

      {/* App routes */}
      <div className="p-4 pb-32">
        <Routes>
          <Route
            path="/"
            element={
              <ChannelsList
                channels={selectedChannels}
                lastPlayed={lastPlayed}
                setLastPlayed={setLastPlayed}
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
              />
            }
          />

          <Route
            path="/playlists"
            element={
              <PlaylistManager
                playlists={playlists}
                setPlaylists={setPlaylists}
                setSelectedChannels={setSelectedChannels}
                onM3UImport={handleM3UImport}
              />
            }
          />

          <Route
            path="/settings"
            element={
              <ThemePanel
                themePresets={themePresets}
                themeId={themeId}
                setThemeId={setThemeId}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            }
          />

          <Route
            path="/epg"
            element={
              <div className="space-y-4">
                <EPGManager onLoad={(ch) => setEpgData(ch)} />
                <EPG epgData={epgData} onSetReminder={addReminder} />
              </div>
            }
          />
        </Routes>
      </div>

      {/* Live player overlay */}
      {lastPlayed && (
        <LivePlayer
          channel={lastPlayed}
          onClose={() => setLastPlayed(null)}
          nowNext={getNowNextForChannel(lastPlayed.id)}
          addReminder={addReminder}
        />
      )}

      {/* Bottom menu bar */}
      <MenuBar
        primaryColor={primaryColor}
        accentColor={accentColor}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
    </div>
  );
}
