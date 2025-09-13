// src/components/PlaylistManager.tsx
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Channel } from "./ChannelsTypes";
import { parseM3U } from "./ParseM3U";
import { XtreamManager } from "./XtreamManager";

/**
 * PlaylistManagerProps:
 *  - playlists and setPlaylists are accepted (App passes them)
 *  - setSelectedChannels updates the visible channels in the app
 *  - onM3UImport optional: App can pass an import handler (keeps backward compatibility)
 */
interface PlaylistManagerProps {
  playlists?: any[];
  setPlaylists?: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  onM3UImport?: (text: string) => void;
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists: playlistsProp = [],
  setPlaylists,
  setSelectedChannels,
  onM3UImport,
}) => {
  const [localPlaylists, setLocalPlaylists] = useState<any[]>(playlistsProp);
  const [formType, setFormType] = useState<"m3u" | "xtream">("m3u");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // NEW: allow using a public HTTPS CORS proxy when the Xtream server is HTTP and
  // the page is HTTPS (Codesandbox). Default ON for simplicity.
  const [useProxy, setUseProxy] = useState<boolean>(true);

  useEffect(() => {
    // keep local copy in sync when parent updates
    setLocalPlaylists(playlistsProp || []);
  }, [playlistsProp]);

  useEffect(() => {
    // persist local playlists (if parent gave setter, mirror to parent)
    setPlaylists?.(localPlaylists);
    localStorage.setItem("playlists", JSON.stringify(localPlaylists));
  }, [localPlaylists, setPlaylists]);

  const normalizeServerUrl = (raw: string) => {
    if (!raw) return raw;
    let u = raw.trim();
    if (!/^(https?:)\/\//i.test(u)) u = "http://" + u; // add protocol if absent
    u = u.replace(/\/+$/, ""); // strip trailing slash
    return u;
  };

  // Helper: proxiedFetch for simple Xtream endpoints when useProxy === true.
  // We use a public HTTPS CORS proxy so browsers won't block http -> https mixed content.
  // NOTE: public proxies have limits; for personal/dev use this is simplest.
  const proxiedFetch = async (targetUrl: string) => {
    // Using corsproxy.io (raw fetch style). If this proxy doesn't work, try another
    // like: https://api.allorigins.win/raw?url=... or https://thingproxy.freeboard.io/fetch/...
    const proxyBase = "https://corsproxy.io/?u=";
    const proxied = proxyBase + encodeURIComponent(targetUrl);
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`Proxy fetch failed ${res.status}`);
    const text = await res.text();
    return text;
  };

  // Minimal Xtream API fetcher when useProxy is true — constructs player_api.php endpoints
  // and returns parsed JSON (array for channels).
  const fetchXtreamChannelsViaProxy = async (
    serverUrl: string,
    user: string,
    pass: string
  ): Promise<any[]> => {
    // common Xtream action for live channels:
    const ep = `${serverUrl}/player_api.php?username=${encodeURIComponent(
      user
    )}&password=${encodeURIComponent(pass)}&action=get_live_streams`;
    const raw = await proxiedFetch(ep);
    // servers sometimes return JSON or string wrapped JSON — try to be forgiving:
    try {
      return JSON.parse(raw);
    } catch (e) {
      // sometimes response contains garbage lines — try to extract first JSON-looking part
      const m = raw.match(/(\[|\{).*(\]|\})/s);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch (e2) {
          throw new Error("Xtream getChannels: invalid JSON response (proxy)");
        }
      }
      throw new Error("Xtream getChannels: invalid JSON response (proxy)");
    }
  };

  // Attempt to fetch channels using either the official XtreamManager (no proxy)
  // or the proxied fetch (if useProxy)
  const fetchChannels = async (
    normalizedServer: string,
    user: string,
    pass: string
  ) => {
    // If page is HTTPS and server is HTTP and user didn't enable proxy -> fail with hint
    const pageIsHttps =
      typeof window !== "undefined" && window.location.protocol === "https:";
    if (!useProxy) {
      if (pageIsHttps && normalizedServer.startsWith("http://")) {
        throw new Error(
          "Browser blocked mixed-content: page is HTTPS but Xtream server is HTTP. Enable 'Use proxy' or run the app on HTTP."
        );
      }
      // Try using the XtreamManager (direct)
      const client = new XtreamManager(normalizedServer, username, password);
      // XtreamManager normally returns standardized objects; rely on it when direct
      const chans = await client.getChannels();
      return chans;
    } else {
      // Proxy flow: fetch via proxied endpoints
      const chans = await fetchXtreamChannelsViaProxy(
        normalizedServer,
        user,
        pass
      );
      return chans;
    }
  };

  const handleAdd = async () => {
    if (formType === "m3u") {
      if (!url) return alert("Please provide an M3U URL");
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const text = await res.text();
        const channels = parseM3U(text);
        setSelectedChannels(channels);

        const newPlaylist = {
          id: uuidv4(),
          type: "m3u",
          name: name || "M3U",
          url,
        };
        setLocalPlaylists((p) => [...p, newPlaylist]);
        onM3UImport?.(text);
      } catch (err) {
        console.error("M3U load error", err);
        alert("Could not load M3U playlist — check URL and CORS");
      }
    } else {
      // xtream
      if (!server || !username || !password)
        return alert("Server, username and password are required for Xtream");

      const normalized = normalizeServerUrl(server);

      try {
        // Fetch channels (either via proxy or direct)
        const chans = await fetchChannels(normalized, username, password);

        if (!Array.isArray(chans))
          throw new Error("Unexpected channels response (not an array)");

        // Map Xtream channels -> your Channel type (use streamUrl key to match your other components)
        const mappedChannels: Channel[] = (chans as any[]).map((ch: any) => {
          // many xtream servers use different keys; map robustly
          const id =
            ch.id ??
            ch.stream_id ??
            ch.channel_id ??
            ch.channelId ??
            ch.streamId ??
            uuidv4();

          const name =
            ch.name ??
            ch.title ??
            ch.channelName ??
            ch.channel_name ??
            "Unknown";
          const logo =
            ch.stream_icon ?? ch.tvg_logo ?? ch.logo ?? ch.channel_logo ?? "";

          // stream URL: if using the XtreamManager client directly (no proxy) we can call generateStreamUrl.
          // If we used the proxied path, we still produce the standard stream URL pattern so LivePlayer/HLS code can play it.
          // Try to construct an HLS (.m3u8) stream if possible using typical Xtream URL form:
          // {server}/live/{username}/{password}/{stream_id}.m3u8  (some providers)
          // Better approach: use XtreamManager.generateStreamUrl when available (useProxy=false).
          let streamUrl: string | undefined = undefined;
          try {
            if (!useProxy) {
              const client = new XtreamManager(normalized, username, password);
              streamUrl = client.generateStreamUrl("channel", id);
            } else {
              // best-effort construction; many Xtream servers support this format:
              // `${server}/live/${username}/${password}/${stream_id}.${ext}`
              streamUrl = `${normalized}/live/${encodeURIComponent(
                username
              )}/${encodeURIComponent(password)}/${id}.m3u8`;
            }
          } catch {
            streamUrl = undefined;
          }

          return {
            id: String(id),
            name: String(name),
            logo: String(logo ?? ""),
            poster: logo ?? undefined,
            streamUrl,
            category:
              ch.category_name ?? ch.categoryName ?? ch.category ?? "Unknown",
            live: true,
            metadata: { raw: ch },
          } as Channel;
        });

        setSelectedChannels(mappedChannels);

        const newPlaylist = {
          id: uuidv4(),
          type: "xtream",
          name: name || "Xtream",
          server: normalized,
          username,
        };
        setLocalPlaylists((p) => [...p, newPlaylist]);
      } catch (err: any) {
        console.error("Xtream load failed:", err);
        if (String(err).includes("mixed-content")) {
          alert(
            "Xtream request blocked by browser (mixed content). Enable 'Use proxy' to route requests through an HTTPS proxy, or host this app on HTTP."
          );
        } else {
          alert(
            "Could not load Xtream playlist. Check server/credentials and CORS/proxy. See console for details."
          );
        }
      }
    }
    clearForm();
  };

  const handleDelete = (id: string) => {
    setLocalPlaylists((p) => p.filter((pl) => pl.id !== id));
  };

  const clearForm = () => {
    setName("");
    setUrl("");
    setServer("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setFormType("m3u")}
          className={`px-4 py-2 rounded-full ${
            formType === "m3u" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          M3U
        </button>
        <button
          onClick={() => setFormType("xtream")}
          className={`px-4 py-2 rounded-full ${
            formType === "xtream" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Xtream
        </button>
      </div>

      <div className="flex flex-col space-y-2 bg-white/10 p-4 rounded-xl backdrop-blur-lg border border-white/20 shadow-lg">
        <input
          type="text"
          placeholder="Playlist Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 rounded border border-gray-300 focus:outline-none"
        />

        {formType === "m3u" ? (
          <input
            type="text"
            placeholder="M3U URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="p-2 rounded border border-gray-300 focus:outline-none"
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="Server URL (eg. 123.45.67.89:8080 or https://example.com:8080)"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="p-2 rounded border border-gray-300 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-2 rounded border border-gray-300 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 rounded border border-gray-300 focus:outline-none"
            />

            {/* NEW: proxy toggle */}
            <label className="flex items-center space-x-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="form-checkbox"
              />
              <span>
                Use public HTTPS proxy for Xtream requests (recommended on
                Codesandbox)
              </span>
            </label>
          </>
        )}

        <button
          onClick={handleAdd}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          Add Playlist
        </button>
      </div>

      <div className="space-y-2">
        {localPlaylists.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-white/20 shadow-lg"
          >
            <span>{p.name}</span>
            <button
              onClick={() => handleDelete(p.id)}
              className="text-red-500 hover:text-red-700 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistManager;
