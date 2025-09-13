// src/lib/epgStorage.ts
import { EPGChannel } from "../types/epg";

const EPG_KEY = "app:epg_v1";

export function saveEPG(channels: EPGChannel[]) {
  try {
    localStorage.setItem(EPG_KEY, JSON.stringify(channels));
  } catch (e) {
    console.error("Failed to save EPG:", e);
  }
}

export function loadEPG(): EPGChannel[] {
  try {
    const raw = localStorage.getItem(EPG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EPGChannel[];
    return parsed;
  } catch {
    return [];
  }
}
