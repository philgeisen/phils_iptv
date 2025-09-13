// src/types/epg.ts
export interface EPGEvent {
  id: string;
  channelId: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  description?: string;
}

export interface EPGChannel {
  id: string;
  name: string;
  logo?: string;
  events: EPGEvent[];
  offsetMinutes?: number; // manual timezone offset per channel
}
