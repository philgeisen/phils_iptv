// src/components/EPGEvent.tsx
import React from "react";
import { EPGEvent } from "../EPG";

interface Props {
  event: EPGEvent;
  timelineStart: Date;
  pixelsPerMinute: number;
  onClick?: (ev: EPGEvent) => void;
}

const parseAsDate = (v: string | Date) =>
  typeof v === "string" ? new Date(v) : v;

const EPGEventBlock: React.FC<Props> = ({
  event,
  timelineStart,
  pixelsPerMinute,
  onClick,
}) => {
  const startDate = parseAsDate(event.start as any);
  const endDate = parseAsDate(event.end as any);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    // invalid date — don't render the block
    return null;
  }

  const startOffsetMins =
    (startDate.getTime() - timelineStart.getTime()) / 60000;
  const durationMins = Math.max(
    1,
    (endDate.getTime() - startDate.getTime()) / 60000
  );

  const left = startOffsetMins * pixelsPerMinute;
  const width = Math.max(28, durationMins * pixelsPerMinute);

  const now = Date.now();
  const isNow = startDate.getTime() <= now && endDate.getTime() >= now;

  return (
    <div
      title={`${
        event.title
      } — ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`}
      onClick={() => onClick?.(event)}
      className={`absolute top-1 h-10 rounded px-2 text-xs truncate flex flex-col justify-center overflow-hidden transition-shadow ${
        isNow
          ? "bg-red-600 shadow-lg text-white"
          : "bg-white/6 hover:bg-white/20 text-white"
      }`}
      style={{ left, width }}
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="text-[10px] text-white/70">
        {startDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        -{" "}
        {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
};

export default EPGEventBlock;
