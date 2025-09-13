import React from "react";

interface LastPlayedProps {
  channel: { id: string; name: string; logo: string; streamUrl: string } | null;
  onSelect: (channel: any) => void;
}

const LastPlayed: React.FC<LastPlayedProps> = ({ channel, onSelect }) => {
  if (!channel) return null;

  return (
    <div
      className="bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 inline-flex items-center cursor-pointer hover:bg-white/20 transition-colors mb-4"
      onClick={() => onSelect(channel)}
    >
      <img src={channel.logo} alt={channel.name} className="w-10 h-10 mr-2" />
      <span className="text-white font-medium">Resume {channel.name}</span>
    </div>
  );
};

export default LastPlayed;
