import { Song, Playlist, User } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Rodrigo',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
};

// Using a public domain placeholder audio for functionality
const DUMMY_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export const SONGS: Song[] = [
  {
    id: '1',
    title: 'Neon Cyberpunk Dreams',
    artist: 'Suno AI v3',
    album: 'Future Synth',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop',
    duration: 184,
    audioUrl: DUMMY_AUDIO,
    isFavorite: true,
    dateAdded: '2023-10-01',
    mood: { energy: 0.9, valence: 0.6, tempo: 140 }
  },
  {
    id: '2',
    title: 'Midnight Jazz Cafe',
    artist: 'Suno AI Jazz Model',
    album: 'Smooth Vibes',
    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&auto=format&fit=crop',
    duration: 210,
    audioUrl: DUMMY_AUDIO,
    isFavorite: false,
    dateAdded: '2023-10-02',
    mood: { energy: 0.3, valence: 0.7, tempo: 85 }
  },
  {
    id: '3',
    title: 'Heavy Metal Thunder',
    artist: 'Suno Metalhead',
    album: 'Raw Power',
    coverUrl: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=400&auto=format&fit=crop',
    duration: 195,
    audioUrl: DUMMY_AUDIO,
    isFavorite: true,
    dateAdded: '2023-10-03',
    mood: { energy: 0.95, valence: 0.2, tempo: 160 }
  },
  {
    id: '4',
    title: 'Lo-Fi Study Beats',
    artist: 'Chill Bot',
    album: 'Focus Mode',
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop',
    duration: 240,
    audioUrl: DUMMY_AUDIO,
    isFavorite: false,
    dateAdded: '2023-10-05',
    mood: { energy: 0.2, valence: 0.5, tempo: 70 }
  }
];

export const PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    name: 'Best of Suno V3',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
    description: 'My top generated tracks from version 3.',
    songIds: ['1', '3']
  },
  {
    id: 'p2',
    name: 'Late Night Coding',
    coverUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop',
    description: 'Focus music for deep work sessions.',
    songIds: ['2', '4']
  }
];