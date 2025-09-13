// src/components/Channels.tsx
import React, { useMemo } from "react";
import { Channel } from "./ChannelsTypes";

interface ChannelsProps {
  channels: Channel[];
  lastPlayed?: Channel | null;
  setLastPlayed: (channel: Channel) => void;
  searchQuery?: string;
  selectedCategory?: string;
}

const Channels: React.FC<ChannelsProps> = ({
  channels,
  setLastPlayed,
  searchQuery = "",
  selectedCategory = "All",
}) => {
  const filtered = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return channels.filter((c) => {
      if (
        selectedCategory &&
        selectedCategory !== "All" &&
        (c.category || "Uncategorized") !== selectedCategory
      )
        return false;
      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q)
      );
    });
  }, [channels, searchQuery, selectedCategory]);

  if (!filtered.length) {
    return (
      <div className="text-center text-white/70 py-10">No channels found.</div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {filtered.map((channel) => (
        <div
          key={channel.id}
          className="relative cursor-pointer rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform bg-black/20"
          onClick={() => setLastPlayed(channel)}
        >
          <img
            src={channel.logo || channel.poster}
            alt={channel.name}
            className="w-full h-28 object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-2 text-sm flex items-center justify-between">
            <div className="truncate">{channel.name}</div>
            {channel.live ? (
              <div className="ml-2 px-2 py-0.5 bg-red-600 rounded text-xs">
                LIVE
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Channels;
