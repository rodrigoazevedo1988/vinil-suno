import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MusicCard from './components/MusicCard';
import PlaylistCard from './components/PlaylistCard';
import PlaylistView from './components/PlaylistView';
import CMSView from './components/CMSView';
import Player from './components/Player';
import LoginPage from './components/LoginPage';
import ProfileView from './components/ProfileView';
import TermsView from './components/TermsView';
import LandingPage from './components/LandingPage';
import RadioView from './components/RadioView';
import SongContextMenu from './components/SongContextMenu';
import QueueList from './components/QueueList';
import ArtistsView from './components/ArtistsView';
import AlbumsView from './components/AlbumsView';
import GenresView from './components/GenresView';
import Pagination from './components/Pagination';
import { SONGS as INITIAL_SONGS, PLAYLISTS as INITIAL_PLAYLISTS } from './constants';
import { Song, Playlist } from './types';
import { getTrackMood, ThemeColors } from './utils/theme';
import { songsApi, playlistsApi } from './services/api';
import { Moon, Sun, Frown, Disc, Activity, Heart, Clock, Trash2, Search, Zap, Coffee, Smile, CloudRain, Sparkles, ArrowLeft, BrainCircuit, PartyPopper, Loader2, LayoutGrid, List } from 'lucide-react';
import SongListTable from './components/SongListTable';
import PlaylistListTable from './components/PlaylistListTable';

interface BackgroundLayer {
  song: Song | null;
  theme: ThemeColors;
  id: string;
}

const BackgroundManager: React.FC<{ currentSong: Song | null; currentTheme: ThemeColors; isDark: boolean }> = ({ currentSong, currentTheme, isDark }) => {
  const [layers, setLayers] = useState<BackgroundLayer[]>([]);

  useEffect(() => {
    const newLayer = {
      song: currentSong,
      theme: currentTheme,
      id: currentSong?.id || 'default-' + Date.now()
    };
    setLayers(prev => [...prev.slice(-1), newLayer]);
    const timer = setTimeout(() => setLayers(prev => prev.slice(-1)), 600);
    return () => clearTimeout(timer);
  }, [currentSong, currentTheme]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-700">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'bg-[#050505]' : 'bg-slate-50'}`} />
      {layers.map((layer, index) => (
        <div key={layer.id} className="absolute inset-0 w-full h-full animate-fade-in" style={{ zIndex: index }}>
          <div className="absolute inset-0 opacity-40 transition-all duration-[2000ms]" style={{ background: layer.theme.backgroundGradient }} />
          {layer.song && (
            <div className="absolute inset-0 opacity-20">
              <img src={layer.song.coverUrl} alt="" className="w-full h-full object-cover blur-[140px] scale-125" />
            </div>
          )}
          <div className={`absolute inset-0 transition-all duration-700 ${isDark ? 'bg-gradient-to-b from-black/40 to-black/80' : 'bg-gradient-to-b from-white/20 to-white/60'}`} />
        </div>
      ))}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
    </div>
  );
};

const ITEMS_PER_PAGE = 50;

const formatTotalTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
};

function App() {
  // ─── Auth State ─────────────────────────────────
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('vinil_auth_token');
  });
  const [authUser, setAuthUser] = useState<any>(() => {
    const saved = localStorage.getItem('vinil_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isLoggedIn = !!authToken && !!authUser;
  const isAdmin = authUser?.role === 'admin';

  const handleLogin = (token: string, user: any) => {
    setAuthToken(token);
    setAuthUser(user);
    setAuthUser(user);
    localStorage.setItem('vinil_auth_token', token);
    localStorage.setItem('vinil_auth_user', JSON.stringify(user));

    // Check pending share
    const pendingShareId = sessionStorage.getItem('pendingShareId');
    if (pendingShareId) {
      // We need songs loaded first, handled by effect
    }
  };

  const handleLogout = () => {
    // Stop music playback on logout
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentSong(null);
    setQueue([]);
    setIsPlayerExpanded(false);
    setIsQueueOpen(false);

    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('vinil_auth_token');
    localStorage.removeItem('vinil_auth_user');
    setCurrentView('home');
  };

  // ─── UI State ───────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('vinil_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [currentView, setCurrentView] = useState(() => {
    if (window.location.pathname === '/termos') return 'terms';
    if (window.location.pathname === '/lp') return 'lp';
    return 'home';
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<{
    library: 'compact' | 'list';
    favorites: 'compact' | 'list';
    playlists: 'compact' | 'list';
    home: 'compact' | 'list';
  }>({ library: 'compact', favorites: 'compact', playlists: 'compact', home: 'compact' });
  const [pagination, setPagination] = useState<{
    library: number;
    favorites: number;
    playlists: number;
    home: number;
    moods: number;
    searchSongs: number;
    searchPlaylists: number;
  }>({ library: 1, favorites: 1, playlists: 1, home: 1, moods: 1, searchSongs: 1, searchPlaylists: 1 });


  // Sync with HTML class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('vinil_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [cmsEditTarget, setCmsEditTarget] = useState<Song | null>(null);

  const handleEditCMS = (song: Song) => {
    setCmsEditTarget(song);
    setCurrentView('cms');
  };

  // Dynamic Data State
  // Dynamic Data State
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);

  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('vinil_recently_played');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);


  const [volume, setVolume] = useState(0.5);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isShuffle, setIsShuffle] = useState(false);

  const moodTheme: ThemeColors = useMemo(() => getTrackMood(currentSong), [currentSong]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dailySongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 30);
  }, [songs]);

  const paginate = useCallback((items: any[], currentPage: number) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, []);

  // Check for share link on load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      const shareId = hash.replace('#share=', '');
      if (isLoggedIn && songs.length > 0) {
        const sharedSong = songs.find(s => s.id === shareId);
        if (sharedSong) {
          handlePlaySong(sharedSong);
          window.location.hash = ''; // Clear hash
        }
      } else if (!isLoggedIn) {
        sessionStorage.setItem('pendingShareId', shareId);
        // Allow login flow to proceed naturally
      }
    }
  }, [isLoggedIn, songs]);

  const handleCreatePlaylist = async () => {
    if (!authUser) return;
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nova Playlist',
      description: '',
      coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=400',
      songIds: [],
      ownerId: authUser.id,
      isPublic: false
    };
    setPlaylists(prev => [newPlaylist, ...prev]);
    if (apiAvailable) { try { await playlistsApi.create(newPlaylist); } catch (e) { console.error(e); } }
    setSelectedPlaylistId(newPlaylist.id);
    setCurrentView('playlists');
    // We assume default edit mode opens if selecting a new playlist inside PlaylistView - needs check but creating is key now.
  };

  // Load data from API on mount and when user changes (login/logout)
  useEffect(() => {
    async function loadData() {
      try {
        const [songsData, playlistsData] = await Promise.all([
          songsApi.getAll(authUser?.id),
          playlistsApi.getAll(authUser?.id),
        ]);
        setSongs(songsData);
        setPlaylists(playlistsData);
        setApiAvailable(true);
        console.log('✅ Dados carregados da API');
      } catch (err) {
        console.warn('⚠️ API indisponível, usando dados locais:', err);
        // Fallback to localStorage if API is not available
        const savedSongs = localStorage.getItem('vinil_suno_songs');
        const savedPlaylists = localStorage.getItem('vinil_suno_playlists');
        if (savedSongs) setSongs(JSON.parse(savedSongs));
        if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));
        setApiAvailable(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [authUser?.id]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
  }, []);

  // Persist to localStorage as backup
  useEffect(() => {
    localStorage.setItem('vinil_suno_songs', JSON.stringify(songs));
    localStorage.setItem('vinil_suno_playlists', JSON.stringify(playlists));
    localStorage.setItem('vinil_recently_played', JSON.stringify(recentlyPlayedIds));
  }, [songs, playlists, recentlyPlayedIds]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      if (audioRef.current.src !== currentSong.audioUrl) {
        audioRef.current.src = currentSong.audioUrl;
        audioRef.current.load();
      }
      isPlaying ? audioRef.current.play().catch(() => setIsPlaying(false)) : audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'off' && !isShuffle && queue.length === 0) {
      const idx = songs.findIndex(s => s.id === currentSong?.id);
      if (idx === songs.length - 1) {
        setIsPlaying(false);
        return;
      }
      handleNext();
    } else {
      handleNext();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleSongEnd);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleSongEnd);
    };
  }, [currentSong, songs, repeatMode, isShuffle, queue]);

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) setIsPlaying(!isPlaying);
    else { setCurrentSong(song); setIsPlaying(true); }

    setRecentlyPlayedIds(prev => {
      const filtered = prev.filter(id => id !== song.id);
      return [song.id, ...filtered].slice(0, 5);
    });
  };

  const handleToggleFavorite = async (song: Song) => {
    if (!authUser?.id) return; // Must be logged in
    // Optimistic update
    setSongs(prevSongs =>
      prevSongs.map(s => s.id === song.id ? { ...s, isFavorite: !s.isFavorite } : s)
    );
    // Sync with API — per-user favorites
    if (apiAvailable) {
      try { await songsApi.toggleFavorite(song.id, authUser.id); } catch (e) { console.warn('Erro ao favoritar:', e); }
    }
  };

  const handleClearHistory = () => {
    setRecentlyPlayedIds([]);
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handlePlayFromQueue = (song: Song, index: number) => {
    // Remove selected song from queue and play it
    setQueue(prev => prev.filter((_, i) => i !== index));
    handlePlaySong(song);
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentSong(next);
      setIsPlaying(true);
      return;
    }
    if (!currentSong || songs.length === 0) return;

    if (isShuffle) {
      let nextIndex = Math.floor(Math.random() * songs.length);
      if (songs.length > 1 && songs[nextIndex].id === currentSong.id) {
        nextIndex = (nextIndex + 1) % songs.length;
      }
      setCurrentSong(songs[nextIndex]);
    } else {
      const idx = songs.findIndex(s => s.id === currentSong.id);
      setCurrentSong(songs[(idx + 1) % songs.length]);
    }
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!currentSong || songs.length === 0) return;
    const idx = songs.findIndex(s => s.id === currentSong.id);
    setCurrentSong(songs[idx === 0 ? songs.length - 1 : idx - 1]);
    setIsPlaying(true);
  };

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    setSearchQuery(''); // Clear search on navigation
    setSelectedMoodId(null);
    setIsPlayerExpanded(false); // Close expanded player on navigation
    if (view !== 'cms') {
      setCmsEditTarget(null);
    }
    if (id) {
      setSelectedPlaylistId(id);
    } else if (view !== 'playlist-detail') {
      setSelectedPlaylistId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleAddToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
    // Optionally show toast
  };

  const handleAddSongToPlaylist = async (songId: string, playlistId: string) => {
    // Optimistic update
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, songIds: [...(p.songIds || []), songId] };
      }
      return p;
    }));

    // API Call
    if (apiAvailable) {
      try {
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist) {
          const newSongIds = [...(playlist.songIds || []), songId];
          await playlistsApi.update(playlistId, { songIds: newSongIds });
        }
      } catch (e) {
        console.error('Failed to add to playlist', e);
      }
    }
  };

  const renderView = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filteredSongs = songs.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query) ||
        s.album.toLowerCase().includes(query)
      );
      const filteredPlaylists = playlists.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );

      return (
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col gap-1 border-b border-zinc-200 dark:border-white/[0.08] pb-6">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8 text-brand-light" />
              <h2 className="text-3xl font-black tracking-tight">
                Resultados para <span className="text-zinc-500 dark:text-zinc-400">"{searchQuery}"</span>
              </h2>
            </div>
            {filteredSongs.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500 font-medium ml-11">
                <span>{filteredSongs.length} músicas</span>
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>{formatTotalTime(filteredSongs.reduce((acc, s) => acc + s.duration, 0))}</span>
              </div>
            )}
          </div>

          {filteredSongs.length === 0 && filteredPlaylists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-400 gap-4">
              <Search className="w-20 h-20 opacity-20" />
              <p className="text-xl font-bold">Nenhum resultado encontrado.</p>
              <p className="text-sm">Tente buscar por título, artista, álbum ou nome da playlist.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredSongs.length > 0 && (
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Músicas</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {paginate(filteredSongs, pagination.searchSongs).map((song: Song) => (
                      <MusicCard key={song.id} song={song} isPlaying={isPlaying} isCurrent={currentSong?.id === song.id} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddSongToPlaylist} onCreatePlaylist={handleCreatePlaylist} isAdmin={isAdmin} onEditCMS={handleEditCMS} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pagination.searchSongs}
                    totalPages={Math.ceil(filteredSongs.length / ITEMS_PER_PAGE)}
                    onPageChange={page => setPagination({ ...pagination, searchSongs: page })}
                  />
                </section>
              )}

              {filteredPlaylists.length > 0 && (
                <section className="space-y-6">
                  <h3 className="text-xl font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Playlists</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {paginate(filteredPlaylists, pagination.searchPlaylists).map((playlist: Playlist) => (
                      <PlaylistCard key={playlist.id} playlist={playlist} onClick={() => handleNavigate('playlist-detail', playlist.id)} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pagination.searchPlaylists}
                    totalPages={Math.ceil(filteredPlaylists.length / ITEMS_PER_PAGE)}
                    onPageChange={page => setPagination({ ...pagination, searchPlaylists: page })}
                  />
                </section>
              )}
            </div>
          )}
        </div>
      );
    }



    switch (currentView) {
      case 'lp':
        return <LandingPage onLoginClick={() => setCurrentView('home')} />;
      case 'cms':
        return <CMSView
          isAdmin={isAdmin}
          currentUser={authUser}
          songs={songs}
          playlists={playlists}
          initialEditSong={cmsEditTarget}
          apiAvailable={apiAvailable} onAddSong={async (s) => {
            setSongs(prev => [s, ...prev]);
            if (apiAvailable) { try { await songsApi.create(s); } catch (e) { console.warn('Erro ao criar música na API:', e); } }
          }} onUpdateSong={async (us) => {
            setSongs(songs.map(s => s.id === us.id ? us : s));
            if (apiAvailable) { try { await songsApi.update(us.id, us); } catch (e) { console.warn('Erro ao atualizar música na API:', e); } }
          }} onDeleteSong={async (id) => {
            setSongs(songs.filter(s => s.id !== id));
            if (apiAvailable) { try { await songsApi.delete(id); } catch (e) { console.warn('Erro ao deletar música na API:', e); } }
          }} onCreatePlaylist={async (p) => {
            // Optimistic UI update
            setPlaylists([p, ...playlists]);
            if (apiAvailable) {
              try {
                const newPlaylist = await playlistsApi.create(p);
                // Replace optimistic ID with real ID if needed, though they match UUID format
                setPlaylists(prev => prev.map(pl => pl.id === p.id ? newPlaylist : pl));
              } catch (e) {
                console.warn('Erro ao criar playlist na API:', e);
                // Revert on failure? For now just log
              }
            }
          }} onUpdatePlaylist={async (p) => {
            setPlaylists(playlists.map(curr => curr.id === p.id ? p : curr));
            if (apiAvailable) { try { await playlistsApi.update(p.id, p); } catch (e) { console.warn('Erro ao atualizar playlist na API:', e); } }
          }} onDeletePlaylist={async (id) => {
            setPlaylists(playlists.filter(p => p.id !== id));
            if (apiAvailable) { try { await playlistsApi.delete(id); } catch (e) { console.warn('Erro ao deletar playlist na API:', e); } }
          }} />;
      case 'profile':
        if (!authUser || !authToken) return null;
        return <ProfileView user={authUser} token={authToken} onLogout={handleLogout} onUpdateAuth={handleLogin} />;
      case 'library':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">Minha Biblioteca</h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500 font-medium">
                  <span>{songs.length} músicas</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span>{formatTotalTime(songs.reduce((acc, s) => acc + s.duration, 0))}</span>
                </div>
              </div>
              <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.03] rounded-full p-1 border border-black/5 dark:border-white/5">
                <button onClick={() => setViewMode(p => ({ ...p, library: 'compact' }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.library === 'compact' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}><LayoutGrid className="w-4 h-4" /> Compacto</button>
                <button onClick={() => setViewMode(p => ({ ...p, library: 'list' }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.library === 'list' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}><List className="w-4 h-4" /> Lista</button>
              </div>
            </div>
            {viewMode.library === 'compact' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {paginate(songs, pagination.library).map((song: Song) => <MusicCard key={song.id} song={song} isPlaying={isPlaying} isCurrent={currentSong?.id === song.id} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddSongToPlaylist} onCreatePlaylist={handleCreatePlaylist} isAdmin={isAdmin} onEditCMS={handleEditCMS} />)}
              </div>
            ) : (
              <SongListTable songs={paginate(songs, pagination.library)} currentSong={currentSong} isPlaying={isPlaying} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddSongToPlaylist} onCreatePlaylist={handleCreatePlaylist} isAdmin={isAdmin} onEditCMS={handleEditCMS} startIndex={(pagination.library - 1) * ITEMS_PER_PAGE} />
            )}
            <Pagination
              currentPage={pagination.library}
              totalPages={Math.ceil(songs.length / ITEMS_PER_PAGE)}
              onPageChange={page => setPagination({ ...pagination, library: page })}
            />
          </div>
        );
      case 'favorites':
        const favoriteSongs = songs.filter(s => s.isFavorite);
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <Heart className="w-8 h-8 text-brand fill-brand" />
                  Suas Favoritas
                </h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500 font-medium pl-11">
                  <span>{favoriteSongs.length} músicas</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span>{formatTotalTime(favoriteSongs.reduce((acc, s) => acc + s.duration, 0))}</span>
                </div>
              </div>
              {favoriteSongs.length > 0 && (
                <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.03] rounded-full p-1 border border-black/5 dark:border-white/5">
                  <button onClick={() => setViewMode(p => ({ ...p, favorites: 'compact' }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.favorites === 'compact' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}><LayoutGrid className="w-4 h-4" /> Compacto</button>
                  <button onClick={() => setViewMode(p => ({ ...p, favorites: 'list' }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.favorites === 'list' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}><List className="w-4 h-4" /> Lista</button>
                </div>
              )}
            </div>
            {favoriteSongs.length > 0 ? (
              <>
                {viewMode.favorites === 'compact' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {paginate(favoriteSongs, pagination.favorites).map((song: Song) => <MusicCard key={song.id} song={song} isPlaying={isPlaying} isCurrent={currentSong?.id === song.id} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddSongToPlaylist} onCreatePlaylist={handleCreatePlaylist} isAdmin={isAdmin} onEditCMS={handleEditCMS} />)}
                  </div>
                ) : (
                  <SongListTable songs={paginate(favoriteSongs, pagination.favorites)} currentSong={currentSong} isPlaying={isPlaying} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddSongToPlaylist} onCreatePlaylist={handleCreatePlaylist} isAdmin={isAdmin} onEditCMS={handleEditCMS} startIndex={(pagination.favorites - 1) * ITEMS_PER_PAGE} />
                )}
                <Pagination
                  currentPage={pagination.favorites}
                  totalPages={Math.ceil(favoriteSongs.length / ITEMS_PER_PAGE)}
                  onPageChange={page => setPagination({ ...pagination, favorites: page })}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                <Frown className="w-16 h-16 opacity-20" />
                <p className="text-lg font-medium">Você ainda não favoritou nenhuma música.</p>
              </div>
            )}
          </div>
        );
      case 'playlists':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">Suas Playlists</h2>
              <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.03] rounded-full p-1 border border-black/5 dark:border-white/5">
                <button onClick={() => setViewMode(p => ({ ...p, playlists: 'compact' }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.playlists === 'compact' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}><LayoutGrid className="w-4 h-4" /> Compacto</button>
                <button onClick={() => setViewMode(p => ({ ...p, playlists: 'list' }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.playlists === 'list' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}><List className="w-4 h-4" /> Lista</button>
              </div>
            </div>
            {viewMode.playlists === 'compact' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginate(playlists, pagination.playlists).map((playlist: Playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={() => handleNavigate('playlist-detail', playlist.id)}
                  />
                ))}
              </div>
            ) : (
              <PlaylistListTable playlists={paginate(playlists, pagination.playlists)} onClick={(id) => handleNavigate('playlist-detail', id)} />
            )}
            <Pagination
              currentPage={pagination.playlists}
              totalPages={Math.ceil(playlists.length / ITEMS_PER_PAGE)}
              onPageChange={page => setPagination({ ...pagination, playlists: page })}
            />
          </div>
        );
      case 'radio':
        return <RadioView />;
      case 'artists':
        return (
          <ArtistsView
            songs={songs}
            playlists={playlists}
            isPlaying={isPlaying}
            currentSong={currentSong}
            onPlay={handlePlaySong}
            onToggleFavorite={handleToggleFavorite}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleAddSongToPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            isAdmin={isAdmin}
            onEditCMS={handleEditCMS}
          />
        );
      case 'albums':
        return (
          <AlbumsView
            songs={songs}
            playlists={playlists}
            isPlaying={isPlaying}
            currentSong={currentSong}
            onPlay={handlePlaySong}
            onToggleFavorite={handleToggleFavorite}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleAddSongToPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            isAdmin={isAdmin}
            onEditCMS={handleEditCMS}
          />
        );
      case 'genres':
        return (
          <GenresView
            songs={songs}
            playlists={playlists}
            isPlaying={isPlaying}
            currentSong={currentSong}
            onPlay={handlePlaySong}
            onToggleFavorite={handleToggleFavorite}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleAddSongToPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            isAdmin={isAdmin}
            onEditCMS={handleEditCMS}
          />
        );
      case 'moods':
        const moodCategories = [
          { id: 'energy', label: 'Energia Pura', color: 'bg-gradient-to-br from-orange-500 to-red-600', filter: (s: Song) => s.mood.energy >= 0.7 },
          { id: 'chill', label: 'Modo Zen', color: 'bg-gradient-to-br from-emerald-500 to-teal-700', filter: (s: Song) => s.mood.energy < 0.4 },
          { id: 'happy', label: 'Good Vibes', color: 'bg-gradient-to-br from-pink-500 to-purple-600', filter: (s: Song) => s.mood.valence >= 0.6 },
          { id: 'sad', label: 'Melancolia', color: 'bg-gradient-to-br from-indigo-600 to-blue-800', filter: (s: Song) => s.mood.valence < 0.4 },
          { id: 'focus', label: 'Foco & Estudo', color: 'bg-gradient-to-br from-slate-600 to-zinc-700', filter: (s: Song) => s.mood.tempo < 100 && s.mood.energy < 0.5 },
          { id: 'party', label: 'Festa', color: 'bg-gradient-to-br from-violet-600 to-fuchsia-600', filter: (s: Song) => s.mood.energy > 0.8 && s.mood.valence > 0.5 },
        ];

        if (selectedMoodId) {
          const category = moodCategories.find(c => c.id === selectedMoodId);
          const moodSongs = songs.filter(category?.filter || (() => false));

          return (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-6">
                <button
                  onClick={() => setSelectedMoodId(null)}
                  className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">MOOD</span>
                  <h1 className="text-4xl font-black tracking-tight">{category?.label}</h1>
                  <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500 font-medium">
                    <span>{moodSongs.length} músicas</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    <span>{formatTotalTime(moodSongs.reduce((acc, s) => acc + s.duration, 0))}</span>
                  </div>
                </div>
              </div>

              {moodSongs.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {paginate(moodSongs, pagination.moods).map((song: Song) => (
                      <MusicCard key={song.id} song={song} isPlaying={isPlaying} isCurrent={currentSong?.id === song.id} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddSongToPlaylist} onCreatePlaylist={handleCreatePlaylist} isAdmin={isAdmin} onEditCMS={handleEditCMS} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pagination.moods}
                    totalPages={Math.ceil(moodSongs.length / ITEMS_PER_PAGE)}
                    onPageChange={page => setPagination({ ...pagination, moods: page })}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                  <Sparkles className="w-16 h-16 opacity-20" />
                  <p className="text-lg font-medium">Nenhuma música encontrada para este mood.</p>
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-8 animate-fade-in">
            <header className="space-y-2 pb-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
                Navegar por moods
              </h1>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {moodCategories.map((cat) => {
                // Find a representative image from the songs that match this filter
                const repSong = songs.find(cat.filter);
                const bgImage = repSong?.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400';

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedMoodId(cat.id)}
                    className={`relative overflow-hidden rounded-xl aspect-[1.6/1] md:aspect-square cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${cat.color} group`}
                  >
                    <span className="absolute top-4 left-4 text-xl md:text-2xl font-black text-white z-10 max-w-[80%] leading-tight">
                      {cat.label}
                    </span>

                    <img
                      src={bgImage}
                      alt={cat.label}
                      className="absolute -bottom-2 -right-4 w-24 h-24 md:w-32 md:h-32 object-cover rotate-[25deg] shadow-2xl rounded-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[30deg]"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'playlist-detail':
        const pl = playlists.find(p => p.id === selectedPlaylistId);
        return pl ? <PlaylistView playlist={pl} allSongs={songs} isPlaying={isPlaying} currentSong={currentSong} onPlay={handlePlaySong} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddSongToPlaylist} onCreatePlaylist={handleCreatePlaylist} isAdmin={isAdmin} onEditCMS={handleEditCMS} /> : null;
      case 'terms':
        return <TermsView onBack={() => {
          window.history.pushState({}, '', '/');
          setCurrentView(isLoggedIn ? 'home' : 'login');
        }} />;
      default:
        const recentSongs = recentlyPlayedIds
          .map(id => songs.find(s => s.id === id))
          .filter(Boolean) as Song[];

        return (
          <div className="space-y-16 animate-fade-in">
            {isLoading && (
              <div className="flex items-center justify-center py-32 gap-3 text-zinc-400 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-lg font-bold">Carregando biblioteca...</span>
              </div>
            )}
            <header className="space-y-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                  {getGreeting()}, {authUser?.name || 'Ouvinte'}
                </h1>
                <p className="text-slate-500 dark:text-zinc-500 font-medium text-lg">
                  {apiAvailable ? 'O que vamos ouvir agora?' : 'Modo offline — dados locais'}
                </p>
              </div>
              <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.03] rounded-full p-1 border border-black/5 dark:border-white/5 w-fit">
                <button
                  onClick={() => setViewMode(p => ({ ...p, home: 'compact' }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.home === 'compact' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
                >
                  <LayoutGrid className="w-4 h-4" /> Compacto
                </button>
                <button
                  onClick={() => setViewMode(p => ({ ...p, home: 'list' }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode.home === 'list' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
                >
                  <List className="w-4 h-4" /> Lista
                </button>
              </div>
            </header>

            {recentSongs.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-brand-light" />
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">Ouvidas Recentemente</h2>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-red-400 flex items-center gap-2 transition-colors px-4 py-2 rounded-full hover:bg-red-400/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar
                  </button>
                </div>
                {viewMode.home === 'compact' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {paginate(recentSongs, pagination.home).map((song: Song) => (
                      <MusicCard
                        key={song.id}
                        song={song}
                        isPlaying={isPlaying}
                        isCurrent={currentSong?.id === song.id}
                        onPlay={handlePlaySong}
                        onToggleFavorite={handleToggleFavorite}
                        playlists={playlists}
                        onAddToQueue={handleAddToQueue}
                        onAddToPlaylist={handleAddSongToPlaylist}
                        onCreatePlaylist={handleCreatePlaylist}
                        isAdmin={isAdmin}
                        onEditCMS={handleEditCMS}
                      />
                    ))}
                  </div>
                ) : (
                  <SongListTable
                    songs={paginate(recentSongs, pagination.home)}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onPlay={handlePlaySong}
                    onToggleFavorite={handleToggleFavorite}
                    playlists={playlists}
                    onAddToQueue={handleAddToQueue}
                    onAddToPlaylist={handleAddSongToPlaylist}
                    onCreatePlaylist={handleCreatePlaylist}
                    isAdmin={isAdmin}
                    onEditCMS={handleEditCMS}
                    startIndex={(pagination.home - 1) * ITEMS_PER_PAGE}
                  />
                )}
                <Pagination
                  currentPage={pagination.home}
                  totalPages={Math.ceil(recentSongs.length / ITEMS_PER_PAGE)}
                  onPageChange={page => setPagination({ ...pagination, home: page })}
                />
              </section>
            )}

            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-brand-light" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tight">Descobertas Diárias</h2>
              </div>
              {viewMode.home === 'compact' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {dailySongs.map(song => (
                    <MusicCard
                      key={song.id}
                      song={song}
                      isPlaying={isPlaying}
                      isCurrent={currentSong?.id === song.id}
                      onPlay={handlePlaySong}
                      onToggleFavorite={handleToggleFavorite}
                      playlists={playlists}
                      onAddToQueue={handleAddToQueue}
                      onAddToPlaylist={handleAddSongToPlaylist}
                      onCreatePlaylist={handleCreatePlaylist}
                      isAdmin={isAdmin}
                      onEditCMS={handleEditCMS}
                    />
                  ))}
                </div>
              ) : (
                <SongListTable
                  songs={dailySongs}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onPlay={handlePlaySong}
                  onToggleFavorite={handleToggleFavorite}
                  playlists={playlists}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={handleAddSongToPlaylist}
                  onCreatePlaylist={handleCreatePlaylist}
                  isAdmin={isAdmin}
                  onEditCMS={handleEditCMS}
                />
              )}
              {/* Limited to 30, no pagination needed for Daily Discoveries as per request */}
            </section>
          </div>
        );
    }
  };

  // ─── Login Gate ─────────────────────────────────
  if (!isLoggedIn) {
    if (currentView === 'terms') {
      return (
        <div className="min-h-screen bg-black text-white p-6 overflow-y-auto">
          <TermsView onBack={() => {
            window.history.pushState({}, '', '/');
            setCurrentView('login');
          }} />
        </div>
      );
    }
    if (currentView === 'lp') {
      return (
        <LandingPage onLoginClick={() => {
          window.history.pushState({}, '', '/');
          setCurrentView('login');
        }} />
      );
    }
    return <LoginPage onLogin={handleLogin} onTerms={() => {
      window.history.pushState({}, '', '/termos');
      setCurrentView('terms');
    }} />;
  }

  return (
    <div className="relative min-h-screen flex font-sans overflow-hidden">
      <BackgroundManager currentSong={currentSong} currentTheme={moodTheme} isDark={theme === 'dark'} />
      <Sidebar
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        currentView={currentView} playlists={playlists} onNavigate={handleNavigate}
        selectedPlaylistId={selectedPlaylistId}
        isAdmin={isAdmin}
        onProfile={() => setCurrentView('profile')}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        <Header
          user={authUser} onMenuClick={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery} onSearch={setSearchQuery}
          theme={theme} onToggleTheme={toggleTheme}
          onProfile={() => setCurrentView('profile')}
          songs={songs}
          onPlaySong={handlePlaySong}
        />
        <div className="flex-1 overflow-y-auto pb-32 scrollbar-thin">
          <div className="px-6 py-10 md:px-10 max-w-[1600px] mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        progress={progress}
        duration={currentSong?.duration || 0}
        currentTime={currentTime}
        onSeek={v => { if (audioRef.current) audioRef.current.currentTime = (v / 100) * audioRef.current.duration }}
        onNext={handleNext}
        onPrev={handlePrev}
        volume={volume}
        onVolumeChange={setVolume}
        onPlaySong={handlePlaySong}
        isExpanded={isPlayerExpanded}
        onToggleExpand={() => setIsPlayerExpanded(!isPlayerExpanded)}
        isQueueOpen={isQueueOpen}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        queueLength={queue.length}
        repeatMode={repeatMode}
        onToggleRepeat={() => setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off')}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
      />
      <QueueList
        queue={queue}
        currentSong={currentSong}
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onRemoveFromQueue={handleRemoveFromQueue}
        onPlayFromQueue={handlePlayFromQueue}
      />
    </div>
  );
}

export default App;