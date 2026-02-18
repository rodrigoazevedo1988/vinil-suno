import React, { useMemo, useState } from 'react';
import { Play, Clock, Music2, Shuffle, List, LayoutGrid } from 'lucide-react';
import { Playlist, Song } from '../types';
import MusicCard from './MusicCard';
import SongListTable from './SongListTable';

interface PlaylistViewProps {
  playlist: Playlist;
  allSongs: Song[];
  isPlaying: boolean;
  currentSong: Song | null;
  onPlay: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  allSongs,
  isPlaying,
  currentSong,
  onPlay,
  onToggleFavorite
}) => {
  const [viewMode, setViewMode] = useState<'compact' | 'list'>('compact');

  const playlistSongs = useMemo(() => {
    // Preserve order from playlist.songIds if possible, otherwise just filter
    if (!playlist.songIds) return [];

    // Map IDs to songs, filtering out any missing ones
    return playlist.songIds
      .map(id => allSongs.find(s => s.id === id))
      .filter((s): s is Song => !!s);
  }, [playlist.songIds, allSongs]);

  const totalDuration = playlistSongs.reduce((acc, song) => acc + song.duration, 0);

  const formatTotalTime = (sec: number) => {
    const min = Math.floor(sec / 60);
    return `${min} min`;
  };

  const handleShufflePlay = () => {
    if (playlistSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * playlistSongs.length);
    onPlay(playlistSongs[randomIndex]);
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 pb-8 border-b border-white/[0.08] mb-8 bg-gradient-to-b from-transparent to-black/20">
        {/* Cover Art */}
        <div className="w-52 h-52 shrink-0 rounded-lg shadow-2xl overflow-hidden relative group">
          <img
            src={playlist.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop'}
            alt={playlist.name}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-slow" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 w-full">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Playlist Pública</span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
            {playlist.name}
          </h1>
          <p className="text-zinc-400 text-sm md:text-base font-medium max-w-2xl text-balance line-clamp-2">
            {playlist.description || 'Sem descrição.'}
          </p>

          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-300 font-medium">
            <div className="flex items-center gap-1">
              <Music2 className="w-4 h-4" />
              <span>{playlistSongs.length} músicas</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-600" />
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatTotalTime(totalDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => playlistSongs.length > 0 && onPlay(playlistSongs[0])}
            className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center hover:scale-105 active:scale-95 hover:bg-brand-light transition-all duration-base ease-bounce-soft shadow-lg shadow-brand/20 group"
            title="Tocar Playlist"
          >
            <Play className="w-6 h-6 fill-current ml-1 transition-transform group-hover:scale-110" />
          </button>

          <button
            onClick={handleShufflePlay}
            className="w-10 h-10 rounded-full glass-card border border-white/10 text-zinc-400 flex items-center justify-center hover:text-white hover:border-white/30 transition-all active:scale-95"
            title="Ordem Aleatória"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-white/[0.03] rounded-full p-1 border border-white/5">
          <button
            onClick={() => setViewMode('compact')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'compact' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Compacto
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <List className="w-4 h-4" /> Lista
          </button>
        </div>
      </div>

      {/* Content */}
      {playlistSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-4">
          <Music2 className="w-12 h-12 opacity-10" />
          <p className="text-sm font-medium">Essa playlist está vazia. Adicione músicas pelo Painel de Controle.</p>
        </div>
      ) : (
        <>
          {viewMode === 'compact' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8 animate-fade-in">
              {playlistSongs.map((song) => (
                <MusicCard
                  key={song.id}
                  song={song}
                  isPlaying={isPlaying}
                  isCurrent={currentSong?.id === song.id}
                  onPlay={onPlay}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <SongListTable
              songs={playlistSongs}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlay={onPlay}
              onToggleFavorite={onToggleFavorite}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PlaylistView;