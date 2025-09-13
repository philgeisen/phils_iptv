import React, { useState } from "react";
import ChannelCard from "./ChannelCard";
import { channels } from "../data/channels";
import LivePlayer from "./LivePlayer";
import LastPlayed from "./LastPlayed";

const ChannelGrid = () => {
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const [lastPlayed, setLastPlayed] = useState<null | (typeof channels)[0]>(
    null
  );

  const handleSelect = (channel: (typeof channels)[0]) => {
    setLastPlayed(channel);
    setSelectedChannel(channel);
  };

  return (
    <div className="p-6">
      <LivePlayer channel={selectedChannel} />
      <LastPlayed channel={lastPlayed} onSelect={handleSelect} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
        {channels.map((ch) => (
          <ChannelCard key={ch.id} {...ch} onSelect={() => handleSelect(ch)} />
        ))}
      </div>
    </div>
  );
};

export default ChannelGrid;
