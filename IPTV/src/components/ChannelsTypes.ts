// src/components/ChannelsTypes.ts (update)
export interface Channel {
  id: string;
  name: string;
  logo?: string;
  poster?: string;
  streamUrl?: string;       // canonical url for playback (m3u8)
  sources?: Array<{ src: string; type?: string; label?: string }>; // alternative sources
  category?: string;
  live?: boolean;
  metadata?: { hdr?: boolean; audio?: string; [k: string]: any };
}
