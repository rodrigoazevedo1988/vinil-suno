export interface MoodMetadata {
  energy: number; // 0.0 to 1.0 (Intensity)
  valence: number; // 0.0 to 1.0 (Positivity: 0 = Sad/Dark, 1 = Happy/Bright)
  tempo: number; // BPM
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number; // in seconds
  genre?: string;
  lyrics?: string;
  audioUrl: string;
  isFavorite: boolean;
  dateAdded: string;
  mood: MoodMetadata;
}

export interface Playlist {
  id: string;
  name: string;
  coverUrl: string;
  description: string;
  songIds: string[]; // List of song IDs associated with this playlist
  ownerId?: string;
  isPublic?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}