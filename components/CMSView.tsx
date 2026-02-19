import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Save, X, Music, Image as ImageIcon,
  Activity, Download, Upload, Search, CheckCircle, AlertCircle,
  Clock, Users, Disc, LayoutGrid, List, Check, Sparkles, Loader2
} from 'lucide-react';
import { Song, Playlist } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import * as mm from 'music-metadata-browser';

interface CMSViewProps {
  songs: Song[];
  playlists: Playlist[];
  apiAvailable?: boolean;
  onAddSong: (song: Song) => void;
  onUpdateSong: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onCreatePlaylist: (playlist: Playlist) => void;
  onUpdatePlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
  currentUser?: any;
  isAdmin?: boolean;
  initialEditSong?: Song | null;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const CMSView: React.FC<CMSViewProps> = ({
  songs, playlists, apiAvailable,
  onAddSong, onUpdateSong, onDeleteSong,
  onCreatePlaylist, onUpdatePlaylist, onDeletePlaylist,
  currentUser, isAdmin, initialEditSong
}) => {
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists'>(isAdmin ? 'songs' : 'playlists');
  const [isAdding, setIsAdding] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdding && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isAdding, editingSongId, editingPlaylistId]);




  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [audioInputMode, setAudioInputMode] = useState<'upload' | 'url'>('upload');
  const [coverInputMode, setCoverInputMode] = useState<'upload' | 'url'>('upload');

  // Stats State
  const [serverStats, setServerStats] = useState<any>(null);

  useEffect(() => {
    if (apiAvailable) {
      fetch('/api/stats')
        .then(r => r.json())
        .then(setServerStats)
        .catch(console.error);
    }
  }, [apiAvailable, songs, playlists]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDurationStart = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const min = Math.floor((sec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${min}m` : `${min}m`;
  };

  // Bulk Upload State
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; filename: string } | null>(null);

  // --- Form States ---
  // --- Form States ---
  // --- Mood Presets State ---
  const DEFAULT_MOOD_PRESETS = [
    { label: 'Energia', emoji: '⚡', mood: { energy: 0.9, valence: 0.7, tempo: 140 } },
    { label: 'Relax', emoji: '☕', mood: { energy: 0.3, valence: 0.6, tempo: 70 } },
    { label: 'Sad', emoji: '🌧️', mood: { energy: 0.4, valence: 0.2, tempo: 60 } },
    { label: 'Foco', emoji: '🧠', mood: { energy: 0.5, valence: 0.5, tempo: 90 } },
    { label: 'Happy', emoji: '😄', mood: { energy: 0.8, valence: 0.9, tempo: 120 } },
  ];

  const [moodPresets, setMoodPresets] = useState(() => {
    const saved = localStorage.getItem('vinil_mood_presets');
    return saved ? JSON.parse(saved) : DEFAULT_MOOD_PRESETS;
  });

  const [isAddingMood, setIsAddingMood] = useState(false);
  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodEmoji, setNewMoodEmoji] = useState('✨');

  const saveNewMood = () => {
    if (!newMoodName) return;
    const newPreset = {
      label: newMoodName,
      emoji: newMoodEmoji,
      mood: {
        energy: songFormData.mood?.energy || 0.5,
        valence: songFormData.mood?.valence || 0.5,
        tempo: songFormData.mood?.tempo || 120
      }
    };
    const updated = [...moodPresets, newPreset];
    setMoodPresets(updated);
    localStorage.setItem('vinil_mood_presets', JSON.stringify(updated));
    setIsAddingMood(false);
    setNewMoodName('');
    // showToast not available here yet if defined below?
    // It is defined below. Ideally move valid logic or just ignore toast here for simplicity or move showToast up?
    // Move showToast definition up or use later. showToast uses state, so needs to be in component.
    // It's inside component. OK.
  };

  const deleteMood = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = moodPresets.filter((p: any) => p.label !== label);
    setMoodPresets(updated);
    localStorage.setItem('vinil_mood_presets', JSON.stringify(updated));
  };

  const [songFormData, setSongFormData] = useState<Partial<Song>>({
    title: '', artist: '', album: '',
    genre: '', lyrics: '',
    coverUrl: '',
    audioUrl: '',
    duration: 180, mood: { energy: 0.5, valence: 0.5, tempo: 120 },
    isFavorite: false, dateAdded: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialEditSong) {
      setActiveTab('songs');
      setSongFormData(initialEditSong);
      setEditingSongId(initialEditSong.id);
      setIsAdding(true);
    }
  }, [initialEditSong]);

  const durationStr = useMemo(() => {
    const d = songFormData.duration || 0;
    const m = Math.floor(d / 60);
    const s = d % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [songFormData.duration]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(':')) {
      const [m, s] = val.split(':').map(Number);
      if (!isNaN(m)) {
        setSongFormData(prev => ({ ...prev, duration: (m * 60) + (isNaN(s) ? 0 : s) }));
      }
    } else {
      const num = Number(val);
      if (!isNaN(num)) setSongFormData(prev => ({ ...prev, duration: num }));
    }
  };

  const [playlistFormData, setPlaylistFormData] = useState<Partial<Playlist>>({
    name: '', description: '', coverUrl: '',
    songIds: [], isPublic: false
  });



  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- File Upload Handlers ---
  const handleFileUpload = async (file: File, type: 'audio' | 'image') => {
    const setLoading = type === 'audio' ? setIsUploadingAudio : setIsUploadingImage;
    setLoading(true);

    // Determine which form state to update based on active tab
    const isPlaylist = activeTab === 'playlists';

    // For playlists, we only support image upload
    if (isPlaylist && type === 'audio') {
      showToast('Upload de áudio não suportado para playlists', 'error');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload/${type}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha no upload');

      const data = await response.json();

      if (isPlaylist) {
        // Playlist context (only image)
        setPlaylistFormData(prev => ({ ...prev, coverUrl: data.url }));
        showToast(`Capa da playlist enviada com sucesso!`);
      } else {
        // Song context
        if (type === 'audio') {
          setSongFormData(prev => ({ ...prev, audioUrl: data.url }));
          try {
            const audio = new Audio(data.url);
            audio.addEventListener('loadedmetadata', () => {
              if (audio.duration && isFinite(audio.duration)) {
                setSongFormData(prev => ({ ...prev, duration: Math.round(audio.duration) }));
              }
            });
          } catch { }
          showToast(`Áudio enviado com sucesso!`);
        } else {
          setSongFormData(prev => ({ ...prev, coverUrl: data.url }));
          showToast(`Capa da música enviada com sucesso!`);
        }
      }
    } catch (err) {
      console.error(`Erro no upload de ${type}:`, err);
      showToast(`Erro ao enviar ${type === 'audio' ? 'áudio' : 'imagem'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'audio' | 'image') => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, type);
  };

  const handleBulkSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBulkProgress({ current: i + 1, total: files.length, filename: file.name });

      try {
        // 0. Extract Metadata (music-metadata-browser)
        let metadata = { common: { title: '', artist: '', album: '', genre: [''], picture: [] as any[] }, format: { duration: 0 } };

        try {
          // @ts-ignore
          metadata = await mm.parseBlob(file);
        } catch (e) {
          console.warn('Metadata extraction failed', e);
        }

        const { common, format } = metadata;

        // 1. Upload Audio
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload/audio', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Falha no upload do áudio');
        const uploadData = await uploadRes.json();

        // 2. Create Song with defaults
        const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        // Clean up common trash in filenames if needed
        const title = filenameWithoutExt.replace(/_/g, ' ').replace(/-/g, ' ');

        // Try to get duration
        let duration = 180; // Default 3min
        try {
          const audio = new Audio(uploadData.url);
          await new Promise(r => { audio.addEventListener('loadedmetadata', r); audio.load(); });
          if (audio.duration && isFinite(audio.duration)) duration = Math.round(audio.duration);
        } catch (e) { console.warn('Could not detect duration', e); }

        const newSong: Song = {
          id: Math.random().toString(36).substr(2, 9), // Temp ID, backend generates real one usually
          title: title,
          artist: 'Vinil Suno',
          album: 'Suno Uploads',
          coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400', // Default placeholder
          audioUrl: uploadData.url,
          duration: duration,
          isFavorite: false,
          dateAdded: new Date().toISOString().split('T')[0],
          mood: { energy: 0.5, valence: 0.5, tempo: 120 },
          genre: '', lyrics: ''
        };

        onAddSong(newSong);
        successCount++;

      } catch (err) {
        console.error(`Erro ao enviar ${file.name}:`, err);
        showToast(`Erro em ${file.name}`, 'error');
      }
    }

    setIsBulkUploading(false);
    setBulkProgress(null);
    showToast(`${successCount} músicas enviadas com sucesso!`);

    // Clear input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const stats = useMemo(() => ({
    totalTime: Math.floor(songs.reduce((acc, s) => acc + s.duration, 0) / 60),
    uniqueArtists: new Set(songs.map(s => s.artist)).size,
    totalSongs: songs.length,
    totalPlaylists: playlists.length
  }), [songs, playlists]);

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Suggestions for autocomplete
  const suggestions = useMemo(() => ({
    artists: Array.from(new Set(songs.map(s => s.artist).filter(Boolean))).sort(),
    albums: Array.from(new Set(songs.map(s => s.album).filter(Boolean))).sort(),
    genres: Array.from(new Set(songs.map(s => s.genre).filter(Boolean))).sort(),
  }), [songs]);

  const handleSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const songData = {
      ...songFormData,
      id: editingSongId || Math.random().toString(36).substr(2, 9),
    } as Song;

    if (editingSongId) {
      onUpdateSong(songData);
      showToast('Música atualizada!');
    } else {
      onAddSong(songData);
      showToast('Nova música adicionada!');
    }
    resetForms();
  };

  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const playlistData = {
      ...playlistFormData,
      id: editingPlaylistId || `p-${Math.random().toString(36).substr(2, 5)}`,
      ownerId: currentUser?.id,
      isPublic: playlistFormData.isPublic
    } as Playlist;

    if (editingPlaylistId) {
      onUpdatePlaylist(playlistData);
      showToast('Playlist atualizada!');
    } else {
      onCreatePlaylist(playlistData);
      showToast('Playlist criada!');
    }
    resetForms();
  };

  const resetForms = () => {
    setSongFormData({
      title: '', artist: '', album: '',
      coverUrl: '',
      audioUrl: '',
      duration: 180, mood: { energy: 0.5, valence: 0.5, tempo: 120 },
      isFavorite: false, dateAdded: new Date().toISOString().split('T')[0]
    });
    // Default playlist cover
    setPlaylistFormData({ name: '', description: '', coverUrl: '', songIds: [] });
    setIsAdding(false);
    setEditingSongId(null);
    setEditingPlaylistId(null);
    setAudioInputMode('upload');
    setCoverInputMode('upload');
  };

  const toggleSongInPlaylist = (songId: string) => {
    const currentIds = playlistFormData.songIds || [];
    if (currentIds.includes(songId)) {
      setPlaylistFormData({ ...playlistFormData, songIds: currentIds.filter(id => id !== songId) });
    } else {
      setPlaylistFormData({ ...playlistFormData, songIds: [...currentIds, songId] });
    }
  };

  const handleExport = () => {
    const data = { songs, playlists };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinil-suno-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Biblioteca exportada!');
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      {/* Toast System */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white/10 animate-scale-in pointer-events-auto ${t.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {t.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">{isAdmin ? 'Painel de Controle' : 'Minhas Playlists'}</h2>
          {isAdmin && (
            <>
              {apiAvailable !== undefined && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mt-2 ${apiAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${apiAvailable ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                  {apiAvailable ? 'Conectado à API' : 'Modo Offline'}
                </span>
              )}


              {/* Detailed Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-6 bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Músicas</span>
                  <span className="text-xl font-black text-white">{serverStats?.songs || stats.totalSongs}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{serverStats ? formatBytes(serverStats.storage.audio) : '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Playlists</span>
                  <span className="text-xl font-black text-white">{serverStats?.playlists || stats.totalPlaylists}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Artistas</span>
                  <span className="text-xl font-black text-white">{serverStats?.artists || stats.uniqueArtists}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Imagens</span>
                  <span className="text-xl font-black text-white">{serverStats?.files?.images || 0}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{serverStats ? formatBytes(serverStats.storage.images) : '-'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Duração Total</span>
                  <span className="text-xl font-black text-white">{serverStats ? formatDurationStart(serverStats.totalDuration) : `${stats.totalTime}m`}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Espaço Total</span>
                  <span className="text-xl font-black text-white">{serverStats ? formatBytes(serverStats.storage.total) : '-'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button title="Exportar Backup" onClick={handleExport} className="p-3 glass-card rounded-full hover:bg-white/10 transition-all text-zinc-400 hover:text-white group">
              <Download className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white rounded-full font-bold transition-all duration-base active-press shadow-lg shadow-brand/20"
          >
            <Plus className="w-5 h-5" />
            Novo Item
          </button>

          {/* Bulk Upload Button */}
          {isAdmin && (
            <>
              <input
                type="file"
                id="bulk-upload-input"
                multiple
                accept="audio/*"
                className="hidden"
                onChange={handleBulkSelect}
                disabled={isBulkUploading}
              />
              <button
                onClick={() => document.getElementById('bulk-upload-input')?.click()}
                disabled={isBulkUploading}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold transition-all duration-base active-press shadow-lg border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {isBulkUploading ? `Enviando ${bulkProgress?.current}/${bulkProgress?.total}` : 'Upload em Massa'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      {
        isAdmin && (
          <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-xl w-fit border border-white/5">
            <button
              onClick={() => { setActiveTab('songs'); resetForms(); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'songs' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List className="w-4 h-4" /> Gestão de Músicas
            </button>
            <button
              onClick={() => { setActiveTab('playlists'); resetForms(); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'playlists' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Gestão de Playlists
            </button>
          </div>
        )
      }

      {
        isAdding && (
          <div ref={formRef} className="glass-card rounded-2xl p-8 border border-white/10 animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-brand/20 rounded-lg">
                  {activeTab === 'songs' ? <Music className="text-brand-light w-5 h-5" /> : <Disc className="text-brand-light w-5 h-5" />}
                </div>
                {activeTab === 'songs' ? (editingSongId ? 'Editar Música' : 'Nova Música') : 'Gerenciar Playlist'}
              </h3>
              <button onClick={resetForms} className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === 'songs' ? (
              <form onSubmit={handleSongSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Título</label>
                      <input required value={songFormData.title} onChange={e => setSongFormData({ ...songFormData, title: e.target.value })} className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand/50" placeholder="Neon Dreams" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Artista</label>
                      <input
                        required
                        list="artist-suggestions"
                        value={songFormData.artist}
                        onChange={e => setSongFormData({ ...songFormData, artist: e.target.value })}
                        className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand/50"
                        placeholder="Artista da obra"
                      />
                      <datalist id="artist-suggestions">
                        {suggestions.artists.map(artist => <option key={artist} value={artist} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Álbum</label>
                      <input
                        list="album-suggestions"
                        value={songFormData.album}
                        onChange={e => setSongFormData({ ...songFormData, album: e.target.value })}
                        className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none"
                        placeholder="Nome do Álbum"
                      />
                      <datalist id="album-suggestions">
                        {suggestions.albums.map(album => <option key={album} value={album} />)}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Gênero</label>
                      <input
                        list="genre-suggestions"
                        value={songFormData.genre}
                        onChange={e => setSongFormData({ ...songFormData, genre: e.target.value })}
                        className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none"
                        placeholder="Ex: Sertanejo"
                      />
                      <datalist id="genre-suggestions">
                        {suggestions.genres.map(genre => <option key={genre} value={genre} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Duração (MM:SS)</label>
                    <input type="text" value={durationStr} onChange={handleDurationChange} className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none" placeholder="03:00" />
                  </div>

                  {/* ── Upload de Áudio ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Arquivo de Áudio</label>
                      <button
                        type="button"
                        onClick={() => setAudioInputMode(prev => prev === 'upload' ? 'url' : 'upload')}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-light hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                      >
                        {audioInputMode === 'upload' ? '📎 Colar URL' : '📤 Upload'}
                      </button>
                    </div>
                    {audioInputMode === 'url' ? (
                      <input value={songFormData.audioUrl} onChange={e => setSongFormData({ ...songFormData, audioUrl: e.target.value })} className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none" placeholder="https://example.com/audio.mp3" />
                    ) : (
                      <div
                        onDrop={e => handleDrop(e, 'audio')}
                        onDragOver={handleDragOver}
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-brand/50 hover:bg-brand/5 ${songFormData.audioUrl && !songFormData.audioUrl.startsWith('http') ? 'border-emerald-500/30 bg-emerald-500/5' :
                          songFormData.audioUrl ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'
                          }`}
                        onClick={() => document.getElementById('audio-upload-input')?.click()}
                      >
                        <input
                          id="audio-upload-input"
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'audio');
                          }}
                        />
                        {isUploadingAudio ? (
                          <div className="flex flex-col items-center gap-2 text-brand-light">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Enviando áudio...</span>
                          </div>
                        ) : songFormData.audioUrl ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-bold">Áudio carregado</span>
                            </div>
                            <audio controls src={songFormData.audioUrl} className="w-full max-w-xs h-8 opacity-70" />
                            <span className="text-[10px] text-zinc-500 truncate max-w-full">{songFormData.audioUrl.split('/').pop()}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <Upload className="w-8 h-8" />
                            <span className="text-sm font-bold">Arraste o MP3 aqui ou clique para selecionar</span>
                            <span className="text-[10px] text-zinc-600">MP3, WAV, OGG, FLAC • Máx 50MB</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Upload de Capa (Song) ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Capa do Álbum</label>
                      <button
                        type="button"
                        onClick={() => setCoverInputMode(prev => prev === 'upload' ? 'url' : 'upload')}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-light hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                      >
                        {coverInputMode === 'upload' ? '📎 Colar URL' : '📤 Upload'}
                      </button>
                    </div>
                    {coverInputMode === 'url' ? (
                      <input value={songFormData.coverUrl} onChange={e => setSongFormData({ ...songFormData, coverUrl: e.target.value })} className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none" placeholder="https://example.com/cover.jpg" />
                    ) : (
                      <div
                        onDrop={e => handleDrop(e, 'image')}
                        onDragOver={handleDragOver}
                        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer hover:border-brand/50 hover:bg-brand/5 ${songFormData.coverUrl ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'
                          }`}
                        onClick={() => document.getElementById('cover-upload-input')?.click()}
                      >
                        <input
                          id="cover-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'image');
                          }}
                        />
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center gap-2 text-brand-light py-4">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Enviando imagem...</span>
                          </div>
                        ) : songFormData.coverUrl ? (
                          <div className="flex items-center gap-4">
                            <img src={songFormData.coverUrl} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-white/10 shadow-lg" />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-bold">Capa carregada</span>
                              </div>
                              <span className="text-[10px] text-zinc-500">Clique para trocar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-zinc-400 py-4">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-sm font-bold">Arraste a imagem aqui ou clique para selecionar</span>
                            <span className="text-[10px] text-zinc-600">JPG, PNG, WebP • Máx 50MB</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-6">
                    {/* ... Mood Analysis fields ... */}
                    <div className="flex items-center justify-between text-zinc-300 font-bold text-sm uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-brand-light" /> Análise de Mood
                      </div>
                    </div>

                    {/* Mood Presets */}
                    {/* Mood Presets */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {moodPresets.map((preset: any) => (
                        <div key={preset.label} className="group relative">
                          <button
                            type="button"
                            onClick={() => setSongFormData(p => ({ ...p, mood: preset.mood }))}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-3 pr-7 py-1.5 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-2"
                          >
                            <span>{preset.emoji}</span> {preset.label}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteMood(preset.label, e)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {isAddingMood ? (
                        <div className="flex items-center gap-2 bg-white/5 rounded-full px-2 py-1 transition-all animate-scale-in border border-white/10">
                          <input
                            value={newMoodEmoji}
                            onChange={e => setNewMoodEmoji(e.target.value)}
                            className="w-6 bg-transparent text-center outline-none border-r border-white/10"
                            placeholder="✨"
                            maxLength={2}
                          />
                          <input
                            value={newMoodName}
                            onChange={e => setNewMoodName(e.target.value)}
                            className="w-20 bg-transparent text-xs text-white outline-none px-1"
                            placeholder="Nome..."
                            autoFocus
                          />
                          <button type="button" onClick={saveNewMood} className="p-1 text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
                          <button type="button" onClick={() => setIsAddingMood(false)} className="p-1 text-zinc-500 hover:text-white"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingMood(true)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-600 hover:text-white hover:border-white transition-all"
                          title="Salvar mood atual como preset"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-zinc-500">ENERGIA</span>
                          <span className="text-brand-light">{Math.round((songFormData.mood?.energy || 0) * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.1" value={songFormData.mood?.energy} onChange={e => setSongFormData({ ...songFormData, mood: { ...songFormData.mood!, energy: Number(e.target.value) } })} className="w-full accent-brand h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-zinc-500">VALÊNCIA</span>
                          <span className="text-brand-light">{Math.round((songFormData.mood?.valence || 0) * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.1" value={songFormData.mood?.valence} onChange={e => setSongFormData({ ...songFormData, mood: { ...songFormData.mood!, valence: Number(e.target.value) } })} className="w-full accent-brand h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
                      </div>
                    </div>

                    {/* Lyrics */}
                    <div className="space-y-2 pt-4 border-t border-white/10">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Letra da Música</label>
                      <textarea
                        value={songFormData.lyrics}
                        onChange={e => setSongFormData({ ...songFormData, lyrics: e.target.value })}
                        className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none min-h-[150px] font-mono text-sm leading-relaxed"
                        placeholder="Cole a letra da música aqui..."
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button type="submit" className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active-press shadow-xl">
                      <Save className="w-5 h-5" />
                      {editingSongId ? 'Salvar Alterações' : 'Publicar Música'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePlaylistSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Nome da Playlist</label>
                    <input required value={playlistFormData.name} onChange={e => setPlaylistFormData({ ...playlistFormData, name: e.target.value })} className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Descrição</label>
                    <textarea value={playlistFormData.description} onChange={e => setPlaylistFormData({ ...playlistFormData, description: e.target.value })} className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none min-h-[100px]" />
                  </div>

                  <div className="flex items-center gap-3 px-1">
                    {isAdmin && (
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border border-white/20 flex items-center justify-center transition-all ${playlistFormData.isPublic ? 'bg-brand border-brand' : 'bg-transparent'}`}>
                          {playlistFormData.isPublic && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={playlistFormData.isPublic} onChange={e => setPlaylistFormData({ ...playlistFormData, isPublic: e.target.checked })} />
                        <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Playlist Pública</span>
                      </label>
                    )}
                    {!isAdmin && (
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5" title="Sua playlist será privada">
                        <Users className="w-3 h-3" />
                        <span>Visível apenas para você</span>
                      </div>
                    )}
                  </div>

                  {/* ── Upload de Capa (Playlist) ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Capa da Playlist</label>
                      <button
                        type="button"
                        onClick={() => setCoverInputMode(prev => prev === 'upload' ? 'url' : 'upload')}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-light hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                      >
                        {coverInputMode === 'upload' ? '📎 Colar URL' : '📤 Upload'}
                      </button>
                    </div>
                    {coverInputMode === 'url' ? (
                      <input value={playlistFormData.coverUrl} onChange={e => setPlaylistFormData({ ...playlistFormData, coverUrl: e.target.value })} className="w-full glass-input px-4 py-3 rounded-xl text-white outline-none" placeholder="https://example.com/cover.jpg" />
                    ) : (
                      <div
                        onDrop={e => handleDrop(e, 'image')}
                        onDragOver={handleDragOver}
                        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer hover:border-brand/50 hover:bg-brand/5 ${playlistFormData.coverUrl ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'
                          }`}
                        onClick={() => document.getElementById('playlist-cover-upload')?.click()}
                      >
                        <input
                          id="playlist-cover-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'image');
                          }}
                        />
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center gap-2 text-brand-light py-4">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Enviando imagem...</span>
                          </div>
                        ) : playlistFormData.coverUrl ? (
                          <div className="flex items-center gap-4">
                            <img src={playlistFormData.coverUrl} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-white/10 shadow-lg" />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-bold">Capa carregada</span>
                              </div>
                              <span className="text-[10px] text-zinc-500">Clique para trocar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-zinc-400 py-4">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-sm font-bold">Arraste a imagem aqui ou clique para selecionar</span>
                            <span className="text-[10px] text-zinc-600">JPG, PNG, WebP • Máx 50MB</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full py-4 bg-brand text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-brand/20">
                    <Save className="w-5 h-5" />
                    {editingPlaylistId ? 'Atualizar Playlist' : 'Criar Playlist'}
                  </button>
                </div>
                <div className="lg:col-span-6 space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Vincular Músicas ({playlistFormData.songIds?.length})</label>
                  <div className="max-h-[500px] overflow-y-auto space-y-2 scrollbar-thin pr-2 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                    {songs.map(song => (
                      <button type="button" key={song.id} onClick={() => toggleSongInPlaylist(song.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${playlistFormData.songIds?.includes(song.id) ? 'bg-brand/10 border-brand/50 shadow-inner' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}>
                        <img src={song.coverUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div className="flex-1 text-left min-w-0">
                          <div className="truncate text-sm font-bold text-white">{song.title}</div>
                          <div className="truncate text-xs text-zinc-500">{song.artist}</div>
                        </div>
                        {playlistFormData.songIds?.includes(song.id) && <Check className="w-4 h-4 text-brand-light flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>
        )
      }

      {/* List Search */}
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="w-full bg-white/[0.03] border border-white/5 rounded-full py-3 pl-12 pr-6 text-sm outline-none focus:border-brand/40 transition-all" />
        </div>

        {activeTab === 'songs' ? (
          <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="px-8 py-5">Faixa</th>
                  <th className="px-6 py-5">Álbum</th>
                  <th className="px-6 py-5">Gênero</th>
                  <th className="px-6 py-5 hidden md:table-cell">Mood</th>
                  <th className="px-8 py-5 text-right w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredSongs.map(song => (
                  <tr key={song.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4 flex items-center gap-4">
                      <img src={song.coverUrl} className="w-10 h-10 rounded-lg object-cover border border-white/5" alt="" />
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate text-sm">{song.title}</div>
                        <div className="text-zinc-500 text-xs truncate">{song.artist}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 truncate max-w-[150px]">{song.album || '-'}</td>
                    <td className="px-6 py-4 text-sm text-zinc-400 truncate max-w-[150px]">
                      {song.genre ? <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5 text-xs">{song.genre}</span> : <span className="text-zinc-600">-</span>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[10px] text-zinc-500"><span>E</span><span>{Math.round(song.mood.energy * 100)}%</span></div>
                        <div className="h-1 bg-white/5 rounded-full"><div className="h-full bg-purple-500" style={{ width: `${song.mood.energy * 100}%` }} /></div>
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-1"><span>V</span><span>{Math.round(song.mood.valence * 100)}%</span></div>
                        <div className="h-1 bg-white/5 rounded-full"><div className="h-full bg-blue-500" style={{ width: `${song.mood.valence * 100}%` }} /></div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {confirmDeleteId === song.id ? (
                          <button onClick={() => { onDeleteSong(song.id); setConfirmDeleteId(null); showToast('Removido'); }} className="bg-red-500 p-2 rounded-lg text-white"><Trash2 className="w-4 h-4" /></button>
                        ) : (
                          <>
                            <button onClick={() => { setSongFormData(song); setEditingSongId(song.id); setIsAdding(true); }} className="p-2 text-zinc-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setConfirmDeleteId(song.id)} className="p-2 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPlaylists.map(p => (
              <div key={p.id} className="glass-card p-5 rounded-2xl group border border-white/5">
                <img src={p.coverUrl} className="w-full aspect-square object-cover rounded-xl mb-4 shadow-lg" alt="" />
                <h4 className="text-white font-bold">{p.name}</h4>
                <div className="text-xs text-zinc-500 mt-1">{p.songIds?.length || 0} faixas</div>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all justify-end">
                  {confirmDeleteId === p.id ? (
                    <button onClick={() => { onDeletePlaylist(p.id); setConfirmDeleteId(null); showToast('Playlist removida'); }} className="bg-red-500 p-2 rounded-lg text-white"><Trash2 className="w-4 h-4" /></button>
                  ) : (
                    <>
                      <button onClick={() => { setPlaylistFormData(p); setEditingPlaylistId(p.id); setIsAdding(true); }} className="p-2 bg-white/10 rounded-lg hover:bg-brand text-white"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDeleteId(p.id)} className="p-2 bg-white/10 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div >
  );
};

export default CMSView;