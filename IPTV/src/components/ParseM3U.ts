// src/components/ParseM3U.ts
import { v4 as uuidv4 } from "uuid";
import { Channel } from "./ChannelsTypes";

/**
 * Robust M3U parser that extracts tvg-id, tvg-logo, group-title, and channel name.
 * Returns an array of Channel shaped objects (canonical: streamUrl).
 */
export function parseM3U(m3uText: string): Channel[] {
  const lines = m3uText.split(/\r?\n/);
  const channels: Channel[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = (lines[i] || "").trim();

    if (line.startsWith("#EXTINF")) {
      // Extract attributes between ":<attrs>" and the comma that starts the display name
      const firstComma = line.indexOf(",");
      const attrPart = line.substring(line.indexOf(":") + 1, firstComma).trim();
      const displayName = line.substring(firstComma + 1).trim();

      // parse attributes like tvg-id="..." tvg-logo="..." group-title="..."
      const attrRegex = /([a-zA-Z0-9\-]+?)="([^"]*)"/g;
      const meta: Record<string, string> = {};
      let match;
      while ((match = attrRegex.exec(attrPart))) {
        meta[match[1]] = match[2];
      }

      // next non-empty non-comment line should be the stream URL
      let url = "";
      let j = i + 1;
      while (j < lines.length) {
        const next = (lines[j] || "").trim();
        if (!next) { j++; continue; }
        if (next.startsWith("#")) { j++; continue; }
        url = next;
        break;
      }

      const ch: Channel = {
        id: meta["tvg-id"] || uuidv4(),
        name: displayName || meta["tvg-name"] || "Unknown",
        logo: meta["tvg-logo"] || undefined,
        poster: meta["tvg-logo"] || undefined,
        streamUrl: url || undefined,
        category: meta["group-title"] || "Uncategorized",
        live: true,
        metadata: {
          rawAttrs: meta,
        },
      };
      channels.push(ch);
      i = j; // continue after url
    } else {
      i++;
    }
  }

  return channels;
}
