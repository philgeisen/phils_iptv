// src/lib/xmltv.ts
import { XMLParser } from "fast-xml-parser";
import { EPGChannel, EPGEvent } from "../EPG";

/**
 * Parse XMLTV text and return EPGChannel[].
 * Handles single-item vs array nodes and XMLTV date format like:
 *  20250912080000 +0000  -> parsed to ISO string
 */
function ensureArray<T>(maybe: any): T[] {
  if (!maybe) return [];
  return Array.isArray(maybe) ? maybe : [maybe];
}

function parseXmlTvDate(s: string): Date {
  // Common XMLTV format: YYYYMMDDhhmmss [ +ZZZZ ]
  if (!s) return new Date(NaN);
  const m = s.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{4}))?/
  );
  if (!m) {
    // fallback: let Date try to parse
    return new Date(s);
  }
  const [, YYYY, MM, DD, hh, mm, ss, tz] = m;
  let iso = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
  if (tz) {
    // convert +hhmm -> +hh:mm
    const isoTz = tz.slice(0, 3) + ":" + tz.slice(3);
    iso = iso + isoTz;
  } else {
    iso = iso + "Z";
  }
  return new Date(iso);
}

export function parseXMLTV(xmlText: string): EPGChannel[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // preserve order/text content nodes
  });

  const obj = parser.parse(xmlText);
  const tv = obj?.tv ?? {};
  const xmlChannels = ensureArray<any>(tv.channel);
  const xmlProgrammes = ensureArray<any>(tv.programme);

  const map = new Map<string, EPGChannel>();

  // build channel map
  xmlChannels.forEach((ch: any) => {
    const id =
      ch["@_id"] ??
      (ch["display-name"]
        ? typeof ch["display-name"] === "string"
          ? ch["display-name"]
          : ch["display-name"]["#text"]
        : `ch_${Math.random().toString(36).slice(2, 9)}`);
    const name =
      (ch["display-name"] &&
        (typeof ch["display-name"] === "string"
          ? ch["display-name"]
          : ch["display-name"]["#text"])) ||
      id;
    const logo = ch.icon?.["@_src"] ?? undefined;
    map.set(id, { id, name, logo, events: [] });
  });

  // attach programmes
  xmlProgrammes.forEach((p: any, idx: number) => {
    const channelId = p["@_channel"];
    const start = parseXmlTvDate(p["@_start"]);
    const stop = parseXmlTvDate(p["@_stop"]);
    const title = p.title
      ? typeof p.title === "string"
        ? p.title
        : p.title["#text"] ?? p.title
      : "Untitled";
    const desc = p.desc
      ? typeof p.desc === "string"
        ? p.desc
        : p.desc["#text"]
      : undefined;
    const evt: EPGEvent = {
      id: p["@_id"] ?? `${channelId}-${idx}`,
      channelId,
      title,
      start: start.toISOString(),
      end: stop.toISOString(),
      description: desc,
    };
    if (!map.has(channelId)) {
      map.set(channelId, { id: channelId, name: channelId, events: [] });
    }
    map.get(channelId)!.events.push(evt);
  });

  // sort events per channel
  const result = Array.from(map.values()).map((ch) => {
    ch.events.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    return ch;
  });

  return result;
}
