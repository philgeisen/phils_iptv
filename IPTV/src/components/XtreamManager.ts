// src/lib/XtreamManager.ts
// Minimal wrapper for Xtream-like endpoints that proxies via /proxy in Codesandbox
export class XtreamManager {
  server: string;
  username: string;
  password: string;

  constructor(server: string, username: string, password: string) {
    // server: e.g. "http://cf.its-cdn.me"
    this.server = server.replace(/\/+$/, ""); // strip trailing slash
    this.username = username;
    this.password = password;
  }

  private proxyUrl(apiPath: string) {
    // Use window.location.origin so it's proxied through the Codesandbox HTTPS origin
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // build: /proxy?target=<server>&path=<apiPath>
    const q = new URLSearchParams({
      target: this.server,
      path: apiPath,
    });
    return `${origin}/proxy?${q.toString()}`;
  }

  // Example: get channels via player_api.php?action=get_live_streams
  async getChannels() {
    const apiPath = `player_api.php?username=${encodeURIComponent(
      this.username
    )}&password=${encodeURIComponent(this.password)}&action=get_live_streams`;
    const url = this.proxyUrl(apiPath);

    const res = await fetch(url);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // some servers return non-JSON; return raw text for debugging
      throw new Error("Xtream getChannels: invalid JSON response: " + text);
    }
  }

  // You can use this for EPG short fetch if needed
  async getShortEPG(channelId: string | number, limit = 50) {
    const apiPath = `player_api.php?username=${encodeURIComponent(
      this.username
    )}&password=${encodeURIComponent(
      this.password
    )}&action=get_short_epg&stream_id=${channelId}&limit=${limit}`;
    const url = this.proxyUrl(apiPath);
    const res = await fetch(url);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // Generate a proxied stream URL using get.php + type=m3u8 (broadly compatible)
  generateStreamUrl(
    type: "channel" | "movie" | "episode",
    streamId: string | number,
    ext = "m3u8"
  ) {
    if (type === "channel") {
      const path = `get.php?username=${encodeURIComponent(
        this.username
      )}&password=${encodeURIComponent(
        this.password
      )}&stream=${encodeURIComponent(String(streamId))}&type=m3u8`;
      // return proxied absolute URL so the player can fetch it over HTTPS
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      return `${origin}/proxy?${new URLSearchParams({
        target: this.server,
        path,
      }).toString()}`;
    }
    // fallback / simple pattern for other types:
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const path = `get.php?username=${encodeURIComponent(
      this.username
    )}&password=${encodeURIComponent(
      this.password
    )}&stream=${encodeURIComponent(String(streamId))}&type=m3u8`;
    return `${origin}/proxy?${new URLSearchParams({
      target: this.server,
      path,
    }).toString()}`;
  }
}
