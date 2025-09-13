// src/components/EPG.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EPGChannel, EPGEvent } from "../EPG";

interface Props {
  epgData: EPGChannel[];
  pixelsPerMinute?: number;
  timelineHours?: number;
  onSetReminder?: (event: EPGEvent) => void;
}

const DEFAULT_PIXELS_PER_MIN = 2;

const EPG: React.FC<Props> = ({
  epgData,
  pixelsPerMinute = DEFAULT_PIXELS_PER_MIN,
  timelineHours = 24,
  onSetReminder,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const timelineStart = new Date();
  timelineStart.setHours(0, 0, 0, 0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const timelineWidth = timelineHours * 60 * pixelsPerMinute;

  const nowPosition =
    ((currentTime.getTime() - timelineStart.getTime()) / 60000) *
    pixelsPerMinute;

  return (
    <div className="relative overflow-x-auto rounded-2xl shadow-xl border border-white/10 frosted-panel">
      {/* Timeline header */}
      <div className="flex sticky top-0 bg-black/40 backdrop-blur-md z-10 border-b border-white/10 text-xs text-white">
        <div className="w-40 px-2 py-1 font-semibold">Channel</div>
        <div className="relative flex-1">
          <div style={{ width: timelineWidth, position: "relative" }}>
            {Array.from({ length: timelineHours + 1 }).map((_, i) => {
              const left = i * 60 * pixelsPerMinute;
              const labelDate = new Date(
                timelineStart.getTime() + i * 60 * 60 * 1000
              );
              const label = labelDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div key={i} className="absolute top-0 h-full" style={{ left }}>
                  <div className="absolute -top-5 text-white/70 text-[10px]">
                    {label}
                  </div>
                  <div className="w-px h-full bg-white/10" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="max-h-[60vh] overflow-auto">
        {epgData.map((channel) => (
          <div
            key={channel.id}
            className="flex border-b border-white/5 relative"
          >
            <div className="w-40 px-2 py-1 flex items-center gap-2 bg-black/30 backdrop-blur-sm">
              {channel.logo && (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="h-6 w-6 object-contain rounded"
                />
              )}
              <span className="text-white text-sm truncate">
                {channel.name}
              </span>
            </div>

            <div className="relative flex-1">
              <div
                style={{
                  width: timelineWidth,
                  minHeight: 48,
                  position: "relative",
                }}
              >
                {channel.events.map((ev) => {
                  const start = new Date(ev.start).getTime();
                  const end = new Date(ev.end).getTime();
                  const left =
                    ((start - timelineStart.getTime()) / 60000) *
                    pixelsPerMinute;
                  const width = Math.max(
                    28,
                    ((end - start) / 60000) * pixelsPerMinute
                  );
                  const isNow =
                    start <= currentTime.getTime() &&
                    end >= currentTime.getTime();

                  return (
                    <motion.div
                      key={ev.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`absolute top-1 h-10 rounded-lg px-2 text-xs truncate cursor-pointer backdrop-blur-md shadow-md ${
                        isNow
                          ? "bg-red-600/90 text-white font-semibold"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                      style={{ left, width }}
                      title={`${ev.title} (${new Date(
                        ev.start
                      ).toLocaleTimeString()} - ${new Date(
                        ev.end
                      ).toLocaleTimeString()})`}
                      onClick={() => onSetReminder?.(ev)}
                    >
                      <div className="truncate">{ev.title}</div>
                      <div className="text-[10px] text-white/70">
                        {new Date(ev.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(ev.end).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Now line */}
                <div
                  className="absolute top-0 bottom-0 w-px z-20"
                  style={{ left: nowPosition }}
                >
                  <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-red-500 blur-sm" />
                  <div className="absolute left-1 bg-red-500/70 w-px h-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EPG;
