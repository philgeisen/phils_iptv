// src/lib/epgUtils.ts
import { v4 as uuidv4 } from "uuid";
import { Channel } from "../components/ChannelsTypes";
import { EPGChannel, EPGEvent } from "../EPG";

/**
 * Utilities for creating/normalizing/merging EPGChannel data.
 *
 * - channelsToPlaceholderEPG(channel[], options) -> EPGChannel[]
 * - mergeEPGWithChannels(epg[], channels[]) -> fill/align logos & add placeholders
 * - normalizeEPGDates(epg[]) -> ensures ISO strings + sorts events
 * - getNowNextForChannel(epg[], channelId, now?) -> [now?, next?]
 * - remapChannels, adjustChannelOffset (your existing helpers preserved)
 */

/* -------------------------
   Helpers
   ------------------------- */
function toDate(d: string | Date | undefined): Date | null {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function toISOStringSafe(d: string | Date | undefined): string | null {
  const dt = toDate(d);
  return dt ? dt.toISOString() : null;
}

function sortEvents(events: EPGEvent[]) {
  return [...events].sort((a, b) => {
    const as = new Date(a.start).getTime();
    const bs = new Date(b.start).getTime();
    return as - bs;
  });
}

/* -------------------------
   Core: placeholder generation
   ------------------------- */
export function channelsToPlaceholderEPG(
  channels: Channel[],
  opts?: {
    startHour?: number; // day start hour (default 6)
    slotCount?: number; // how many slots to generate (default 12)
    slotDurationMin?: number; // minutes per slot (default 60)
    pattern?: "hourly" | "halfhour" | "compact";
    baseDay?: Date; // default today
  }
): EPGChannel[] {
  const {
    startHour = 6,
    slotCount = 12,
    slotDurationMin = 60,
    pattern = "hourly",
    baseDay = new Date(),
  } = opts ?? {};

  // create base start at baseDay with startHour
  const base = new Date(baseDay);
  base.setHours(startHour, 0, 0, 0);

  return channels.map((ch, chIdx) => {
    const events: EPGEvent[] = [];
    for (let i = 0; i < slotCount; i++) {
      const s = new Date(
        base.getTime() + i * slotDurationMin * 60_000 + chIdx * 500
      ); // tiny offset per channel
      const e = new Date(s.getTime() + slotDurationMin * 60_000);
      events.push({
        id: uuidv4(),
        channelId: ch.id,
        title: `${ch.name} • ${i === 0 ? "Live" : `Episode ${i}`}`,
        start: s.toISOString(),
        end: e.toISOString(),
        description: `${ch.name} placeholder program ${i + 1}`,
      });
    }

    return {
      id: ch.id,
      name: ch.name,
      logo: ch.logo,
      events: sortEvents(events),
    } as EPGChannel;
  });
}

/* -------------------------
   Merge: align parsed EPG with your channel list
   - fills missing logos/names from channels[]
   - ensures every channel in `channels` has an EPGChannel (placeholder if needed)
   ------------------------- */
export function mergeEPGWithChannels(
  epgChannels: EPGChannel[],
  channels: Channel[],
  opts?: { generatePlaceholders?: boolean }
) {
  const generatePlaceholders = opts?.generatePlaceholders ?? true;

  const epgMap = new Map<string, EPGChannel>();
  // index incoming EPG by id and name for matching
  epgChannels.forEach((ec) =>
    epgMap.set(ec.id, { ...ec, events: sortEvents(ec.events || []) })
  );

  const result: EPGChannel[] = [];

  channels.forEach((ch) => {
    // try to find by id
    let matched = epgMap.get(ch.id);

    // try to find by name (case-insensitive) if not matched by id
    if (!matched) {
      for (const ec of epgChannels) {
        if ((ec.name || "").toLowerCase() === (ch.name || "").toLowerCase()) {
          matched = ec;
          break;
        }
      }
    }

    if (matched) {
      // fill name/logo if missing in EPG
      const filled: EPGChannel = {
        ...matched,
        id: matched.id || ch.id,
        name: matched.name || ch.name,
        logo: matched.logo || ch.logo,
        events: sortEvents(matched.events || []),
      };
      result.push(filled);
    } else if (generatePlaceholders) {
      result.push({
        id: ch.id,
        name: ch.name,
        logo: ch.logo,
        events: [], // empty — caller can invoke channelsToPlaceholderEPG for placeholders
      });
    } else {
      // optionally skip
    }
  });

  // Also append any epgChannels that don't match a channel (useful if EPG contains extras)
  for (const ec of epgChannels) {
    const exists = result.some((r) => r.id === ec.id);
    if (!exists) {
      result.push({ ...ec, events: sortEvents(ec.events || []) });
    }
  }

  return result;
}

/* -------------------------
   Normalization: convert possibly-typed event start/end into ISO strings and sort
   - returns new array (non-mutating)
   ------------------------- */
export function normalizeEPGDates(epgChannels: EPGChannel[]) {
  return epgChannels.map((ch) => {
    const events = (ch.events || [])
      .map((ev) => {
        const startIso = toISOStringSafe(ev.start);
        const endIso = toISOStringSafe(ev.end);
        if (!startIso || !endIso) return null;
        return {
          ...ev,
          start: startIso,
          end: endIso,
        } as EPGEvent;
      })
      .filter(Boolean) as EPGEvent[];

    return {
      ...ch,
      events: sortEvents(events),
    } as EPGChannel;
  });
}

/* -------------------------
   Now/Next helper
   - returns [nowEvent | null, nextEvent | null]
   ------------------------- */
export function getNowNextForChannel(
  epgChannels: EPGChannel[],
  channelId: string,
  nowDate?: Date
) {
  const now = nowDate ?? new Date();
  const ch = epgChannels.find((c) => c.id === channelId);
  if (!ch || !ch.events || ch.events.length === 0) return [null, null] as const;

  // ensure events are sorted and parsed
  const events = ch.events
    .map((ev) => ({
      ...ev,
      _start: toDate(ev.start),
      _end: toDate(ev.end),
    }))
    .filter((ev) => ev._start && ev._end)
    .sort((a, b) => a._start!.getTime() - b._start!.getTime());

  let current: EPGEvent | null = null;
  let next: EPGEvent | null = null;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i] as EPGEvent & { _start?: Date; _end?: Date };
    if (!ev._start || !ev._end) continue;
    if (
      ev._start.getTime() <= now.getTime() &&
      ev._end.getTime() >= now.getTime()
    ) {
      current = { ...ev };
      next = i + 1 < events.length ? { ...events[i + 1] } : null;
      break;
    }
    if (ev._start.getTime() > now.getTime()) {
      current = null;
      next = { ...ev };
      break;
    }
  }

  // strip internal _start/_end if present on returned objects
  const strip = (e: any) => {
    if (!e) return null;
    const { _start, _end, ...rest } = e;
    return rest as EPGEvent;
  };

  return [strip(current), strip(next)] as const;
}

/* -------------------------
   Your existing helpers (kept and exported)
   ------------------------- */

/** Remap channel ids/names given a mapping { oldId: newId } and optionally rename */
export function remapChannels(
  channels: EPGChannel[],
  mapping: Record<string, { id?: string; name?: string }>
) {
  return channels.map((ch) => {
    const map = mapping[ch.id];
    if (!map) return ch;
    return {
      ...ch,
      id: map.id ?? ch.id,
      name: map.name ?? ch.name,
    };
  });
}

/** Shift a channel's events by minutes (positive or negative) */
export function adjustChannelOffset(
  ch: EPGChannel,
  minutes: number
): EPGChannel {
  const shiftMs = minutes * 60 * 1000;
  const events = ch.events.map((ev) => ({
    ...ev,
    start: new Date(new Date(ev.start).getTime() + shiftMs).toISOString(),
    end: new Date(new Date(ev.end).getTime() + shiftMs).toISOString(),
  }));
  return { ...ch, events, offsetMinutes: (ch.offsetMinutes || 0) + minutes };
}
