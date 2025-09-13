import React from "react";
import { EPGChannel } from "../types/epg";
import EPGEventBlock from "./EPGEvent";

interface Props {
  channel: EPGChannel;
  timelineStart: Date;
  pixelsPerMinute: number;
}

const EPGChannelRow: React.FC<Props> = ({
  channel,
  timelineStart,
  pixelsPerMinute,
}) => {
  return (
    <div className="relative h-12 border-b border-gray-300 dark:border-gray-700 flex items-center">
      {/* Channel logo */}
      {channel.logo && (
        <img
          src={channel.logo}
          alt={channel.name}
          className="h-8 w-8 rounded mr-2 ml-1"
        />
      )}
      <span className="w-24 truncate">{channel.name}</span>

      {/* Events */}
      <div className="relative flex-1">
        {channel.events.map((ev) => (
          <EPGEventBlock
            key={ev.id}
            event={ev}
            timelineStart={timelineStart}
            pixelsPerMinute={pixelsPerMinute}
          />
        ))}
      </div>
    </div>
  );
};

export default EPGChannelRow;
