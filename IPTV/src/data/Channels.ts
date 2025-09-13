// src/data/channels.ts
export const exampleChannels = [
  {
    id: "1",
    name: "News Channel",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    poster: "https://via.placeholder.com/480x270.png?text=News",
    subtitles: [
      {
        src: "/subs/news_en.vtt",
        srclang: "en",
        label: "English",
        default: true,
      },
    ],
    previews: [
      { time: 0, src: "https://via.placeholder.com/320x180.png?text=Preview1" },
      {
        time: 30,
        src: "https://via.placeholder.com/320x180.png?text=Preview2",
      },
    ],
  },
  {
    id: "2",
    name: "Sports Channel",
    streamUrl:
      "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    poster: "https://via.placeholder.com/480x270.png?text=Sports",
  },
];
