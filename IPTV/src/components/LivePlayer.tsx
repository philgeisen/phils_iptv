// src/components/LivePlayer.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import Hls from "hls.js";
import { Video } from "@triyanox/react-video";
import { Channel } from "./ChannelsTypes";
import { motion, AnimatePresence } from "framer-motion";

interface LivePlayerProps {
  channel: Channel;
  onClose?: () => void;
  persistKeyPrefix?: string;
  showResolutionControls?: boolean;
}

export default function LivePlayer({
  channel,
  onClose,
  persistKeyPrefix = "iptv",
  showResolutionControls = true,
}: LivePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const statsIntervalRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [currentResolution, setCurrentResolution] = useState<string>("Auto");
  const [bandwidthEstimate, setBandwidthEstimate] = useState<number | null>(
    null
  );
  const [position, setPosition] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const [showResMenu, setShowResMenu] = useState(false);
  const [levels, setLevels] = useState<any[] | null>(null);

  // unify source fields
  const src =
    (channel as any)?.streamUrl ??
    (channel as any)?.url ??
    (channel as any)?.src ??
    (channel as any)?.source ??
    "";

  const multiSources: Array<{ src: string; type?: string; label?: string }> =
    (channel as any)?.sources ?? [];

  const posKey = (id: string) => `${persistKeyPrefix}:pos:${id}`;
  const lastKey = `${persistKeyPrefix}:lastPlayed`;

  const persistLastPlayed = (currentTime?: number) => {
    try {
      localStorage.setItem(
        lastKey,
        JSON.stringify({ id: channel.id, ts: Date.now() })
      );
      if (typeof currentTime === "number")
        localStorage.setItem(
          posKey(channel.id),
          String(Math.floor(currentTime))
        );
    } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(posKey(channel.id));
      if (saved) setPosition(Number(saved));
    } catch {}
  }, [channel.id]);

  // helper to find inner <video> element (react-video renders one)
  const findInnerVideo = useCallback((): HTMLVideoElement | null => {
    if (!containerRef.current) return null;
    return containerRef.current.querySelector("video");
  }, []);

  useEffect(() => {
    setError(null);
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    if (statsIntervalRef.current) {
      window.clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    if (!src && multiSources.length === 0) {
      setError("No stream/source available.");
      return;
    }

    const isHls = !!src && /\.m3u8($|\?)/i.test(src);

    if (isHls) {
      let tries = 0;
      const maxTries = 8;
      const interval = 220;

      const tryAttach = () => {
        tries++;
        const vid = findInnerVideo() || fallbackVideoRef.current;
        if (vid) {
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(vid);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLevels(hls.levels ?? null);
              const saved = localStorage.getItem(posKey(channel.id));
              if (saved && vid.duration && Number(saved) < vid.duration) {
                vid.currentTime = Number(saved);
              }
              vid.play().catch(() => {});
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data: any) => {
              setLevels(hls.levels ?? null);
              const idx = data?.level;
              const level = hls.levels?.[idx];
              setCurrentResolution(mapResolutionLabel(level?.height));
            });

            statsIntervalRef.current = window.setInterval(() => {
              try {
                const estimate = (hls as any).bandwidthEstimate ?? null;
                if (typeof estimate === "number")
                  setBandwidthEstimate(Math.round(estimate));
                const lvl = (hls as any).currentLevel;
                if (
                  typeof lvl === "number" &&
                  (hls as any).levels &&
                  (hls as any).levels[lvl]
                ) {
                  const h = (hls as any).levels[lvl].height;
                  setCurrentResolution(mapResolutionLabel(h));
                } else setCurrentResolution("Auto");
              } catch {}
            }, 600);
          } else if (vid.canPlayType("application/vnd.apple.mpegurl")) {
            vid.src = src;
            const resume = localStorage.getItem(posKey(channel.id));
            if (resume) vid.currentTime = Number(resume);
            vid.play().catch(() => {});
          } else {
            setError("HLS not supported by this browser.");
          }
        } else {
          if (tries < maxTries) {
            setTimeout(tryAttach, interval);
          } else {
            setError("Unable to initialize HLS playback (no video element).");
          }
        }
      };

      tryAttach();

      return () => {
        if (hlsRef.current) {
          try {
            hlsRef.current.destroy();
          } catch {}
          hlsRef.current = null;
        }
        if (statsIntervalRef.current) {
          window.clearInterval(statsIntervalRef.current);
          statsIntervalRef.current = null;
        }
      };
    } else {
      setCurrentResolution("N/A");
      setBandwidthEstimate(null);
    }
  }, [src, JSON.stringify(multiSources), channel.id, findInnerVideo]);

  const onRVPlay = () => persistLastPlayed();
  const onRVPause = () => persistLastPlayed();
  const onRVProgress = (cur: number) => {
    setPosition(cur);
    if (Math.floor(cur) % 5 === 0) persistLastPlayed(cur);
  };

  const handleClose = () => {
    const vid = findInnerVideo() || fallbackVideoRef.current;
    if (vid) persistLastPlayed(vid.currentTime);
    else persistLastPlayed(position);

    setVisible(false);
    setTimeout(() => onClose?.(), 260);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [position]);

  if (error) {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          >
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 text-center max-w-lg">
              <h3 className="text-white text-lg mb-2">Playback error</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => onClose?.()}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const isHls = !!src && /\.m3u8($|\?)/i.test(src);
  const reactVideoSrc =
    multiSources.length > 0
      ? (multiSources as any)
      : !isHls && src
      ? (src as any)
      : undefined;

  const hdr = (channel as any)?.metadata?.hdr ?? (channel as any)?.hdr ?? null;
  const audio =
    (channel as any)?.metadata?.audio ?? (channel as any)?.audio ?? null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="live-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.26 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            ref={containerRef}
            initial={{ y: 16, scale: 0.992 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 12, scale: 0.99, opacity: 0 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl relative"
          >
            {/* Close button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleClose}
              aria-label="Close player"
              className="absolute top-4 right-4 z-[9999] bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-sm">Close</span>
            </motion.button>

            {/* HUD (center-top) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
              <div className="backdrop-blur-md bg-black/40 rounded-xl px-3 py-2 flex items-center space-x-3">
                {showResolutionControls && (
                  <div className="relative">
                    <button
                      onClick={() => setShowResMenu((s) => !s)}
                      className="px-3 py-1.5 rounded-md bg-black/30 text-white text-sm font-medium backdrop-blur-sm"
                    >
                      Res: {currentResolution}
                    </button>

                    <AnimatePresence>
                      {showResMenu && (
                        <motion.ul
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className="absolute mt-2 min-w-[160px] bg-black/70 backdrop-blur-md rounded-xl p-2 z-50"
                        >
                          <li>
                            <button
                              className="w-full text-left p-2 rounded hover:bg-white/5 text-sm text-white"
                              onClick={() => {
                                if (hlsRef.current)
                                  hlsRef.current.currentLevel = -1;
                                setShowResMenu(false);
                              }}
                            >
                              Auto
                            </button>
                          </li>

                          {levels && levels.length ? (
                            levels.map((lvl: any, idx: number) => (
                              <li key={idx}>
                                <button
                                  className="w-full text-left p-2 rounded hover:bg-white/5 text-sm text-white"
                                  onClick={() => {
                                    if (hlsRef.current)
                                      hlsRef.current.currentLevel = idx;
                                    setShowResMenu(false);
                                  }}
                                >
                                  {mapResolutionLabel(lvl.height)}{" "}
                                  {lvl?.bitrate
                                    ? `(${Math.round(
                                        lvl.bitrate / 1000000
                                      )} Mb/s)`
                                    : ""}
                                </button>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-gray-300 p-2">
                              Resolutions loading…
                            </li>
                          )}

                          {multiSources.length > 0 && (
                            <>
                              <div className="mt-2 text-xs text-gray-300 px-2">
                                Sources
                              </div>
                              {multiSources.map((s, i) => (
                                <li key={i}>
                                  <button
                                    className="w-full text-left p-2 rounded hover:bg-white/5 text-sm text-white"
                                    onClick={() => {
                                      const inner = findInnerVideo();
                                      if (inner) {
                                        inner.src = s.src;
                                        inner.play().catch(() => {});
                                      }
                                      setShowResMenu(false);
                                    }}
                                  >
                                    {s.label ?? s.type ?? `Source ${i + 1}`}
                                  </button>
                                </li>
                              ))}
                            </>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* stats summary */}
                <div className="ml-2 px-3 py-1.5 rounded-md text-white text-sm flex flex-col items-end">
                  <div className="font-medium">
                    {kbToMbRounded(bandwidthEstimate)}
                  </div>
                  <div className="text-xs text-gray-300 flex items-center space-x-2">
                    <span>{hdr ? "HDR" : "SDR"}</span>
                    <span>•</span>
                    <span>{audio ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Player element with LIVE badge injected via React */}
            <Video
              src={reactVideoSrc as any}
              poster={(channel as any)?.poster}
              title={
                <>
                  {channel.name}
                  <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block transform -translate-y-0.5 animate-pulseRed">
                    LIVE
                  </span>
                </>
              }
              subtitle={(channel as any)?.subtitle}
              autoPlay
              showControls
              className="w-full h-auto"
              onPlay={onRVPlay}
              onPause={onRVPause}
              onProgress={onRVProgress}
              classNames={{ title: "rv-title" }}
            />

            <video
              ref={fallbackVideoRef}
              controls
              className="w-full h-auto hidden"
              playsInline
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* helpers */
function kbToMbRounded(bpsOrNull: number | null) {
  if (!bpsOrNull) return "—";
  const mb = bpsOrNull / 1000000;
  return `${mb.toFixed(1)} Mb/s`;
}
function mapResolutionLabel(height?: number | null): string {
  if (!height) return "Auto";
  if (height >= 2160) return "UHD";
  if (height >= 1440) return "QHD";
  if (height >= 1080) return "FHD";
  if (height >= 720) return "HD";
  return `${height}p`;
}
