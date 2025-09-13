// src/types.ts
export interface M3UPlaylist {
  id: string;
  name: string;
  url: string;
}

export interface XtreamPlaylist {
  id: string;
  name: string;
  server: string;
  username: string;
  password: string;
}

export type Playlist = M3UPlaylist | XtreamPlaylist;
