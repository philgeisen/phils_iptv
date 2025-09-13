import React from "react";

interface ChannelCardProps {
  name: string;
  logo: string;
  nowPlaying: string;
  onSelect: () => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  name,
  logo,
  nowPlaying,
  onSelect,
}) => {
  return (
    <div
      className="bg-white/10 backdrop-blur-xl rounded-xl shadow-lg p-4 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
      onClick={onSelect}
    >
      <img src={logo} alt={name} className="w-24 h-24 object-contain mb-2" />
      <h3 className="text-white font-semibold">{name}</h3>
      <p className="text-gray-300 text-sm">{nowPlaying}</p>
    </div>
  );
};

export default ChannelCard;
