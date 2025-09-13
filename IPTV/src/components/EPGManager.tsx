// src/components/EPGManager.tsx
import React, { useState } from "react";
import { parseXMLTV } from "../lib/xmltv";
import { saveEPG, loadEPG } from "../lib/epgStorage";
import { EPGChannel } from "../types/epg";

export default function EPGManager({ onLoad }: { onLoad?: (ch: EPGChannel[]) => void }) {
  const [xml, setXml] = useState("");
  const [channels, setChannels] = useState<EPGChannel[]>(loadEPG());

  const handleImport = () => {
    try {
      const parsed = parseXMLTV(xml);
      setChannels(parsed);
      saveEPG(parsed);
      onLoad?.(parsed);
      alert("Imported EPG with " + parsed.length + " channels");
    } catch (e) {
      console.error(e);
      alert("Failed to parse XMLTV");
    }
  };

  const handleSave = () => {
    saveEPG(channels);
    alert("Saved EPG");
  };

  return (
    <div className="p-4 space-y-3">
      <textarea className="w-full h-48 p-2 bg-black/40" value={xml} onChange={(e) => setXml(e.target.value)} placeholder="Paste XMLTV here" />
      <div className="flex gap-2">
        <button onClick={handleImport} className="px-4 py-2 bg-blue-600 rounded">Import</button>
        <button onClick={handleSave} className="px-4 py-2 bg-green-600 rounded">Save</button>
      </div>

      <div>
        <h4 className="text-sm font-semibold">Preview ({channels.length} channels)</h4>
        <div className="max-h-40 overflow-auto">
          {channels.map((c) => (
            <div key={c.id} className="py-1">
              <div className="font-medium">{c.name} <span className="text-xs text-white/60">({c.events.length})</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
