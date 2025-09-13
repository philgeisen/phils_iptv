// src/components/ChannelsList.tsx
import { Channel } from "./ChannelsTypes";

interface ChannelsListProps {
  channels: Channel[];
  lastPlayed: Channel | null;
  setLastPlayed: (ch: Channel) => void;
  searchQuery: string;
  selectedCategory: string;
}

export default function ChannelsList({
  channels,
  lastPlayed,
  setLastPlayed,
  searchQuery,
  selectedCategory,
}: ChannelsListProps) {
  // Filter by search + category
  const filtered = channels.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-20">No channels found.</div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {filtered.map((ch) => (
        <div
          key={ch.id}
          onClick={() => setLastPlayed(ch)}
          className="p-4 rounded-xl bg-black/30 backdrop-blur-md cursor-pointer hover:bg-black/50 transition"
        >
          <div className="font-semibold text-white">{ch.name}</div>
          <div className="text-xs text-gray-400">{ch.category}</div>
        </div>
      ))}
    </div>
  );
}
