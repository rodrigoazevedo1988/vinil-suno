import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { Song, Playlist } from '../types';
import SongContextMenu from './SongContextMenu';

interface MusicCardProps {
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  playlists?: Playlist[];
  onAddToQueue?: (song: Song) => void;
  onAddToPlaylist?: (songId: string, playlistId: string) => void;
  onCreatePlaylist?: () => void;
}

const MusicCard: React.FC<MusicCardProps> = ({
  song, isPlaying, isCurrent, onPlay, onToggleFavorite,
  playlists = [], onAddToQueue = () => { }, onAddToPlaylist = () => { }, onCreatePlaylist = () => { }
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(song);
  };

  return (
    <div
      className="group p-4 glass-card rounded-2xl cursor-pointer flex flex-col gap-3 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active-press"
      onClick={() => onPlay(song)}
    >
      <div className="relative aspect-square w-full">
        {/* Image Container */}
        <div className="absolute inset-0 rounded-xl overflow-hidden shadow-lg bg-slate-200 dark:bg-zinc-800">
          <img
            src={song.coverUrl}
            alt={song.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${isCurrent && isPlaying ? 'scale-110' : 'group-hover:scale-105'}`}
          />

          {/* Play Button Overlay */}
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className={`
              w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center 
              shadow-[0_8px_24px_rgba(var(--brand-primary-rgb),0.6)] 
              transition-all duration-300 transform 
              ${isCurrent ? 'scale-100 translate-y-0' : 'scale-75 translate-y-6 group-hover:scale-100 group-hover:translate-y-0'} 
              hover:scale-110 hover:bg-brand-light active:scale-95
            `}>
              {isCurrent && isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </div>
          </div>
        </div>

        {/* Actions (Outside Overflow) */}
        <div className="absolute top-3 left-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <SongContextMenu
            song={song}
            playlists={playlists}
            onAddToQueue={onAddToQueue}
            onAddToPlaylist={onAddToPlaylist}
            onCreatePlaylist={onCreatePlaylist}
            triggerClassName="bg-black/20 hover:bg-black/40 text-white backdrop-blur-md shadow-lg"
          />
        </div>

        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-30 ${song.isFavorite
            ? 'bg-brand/20 text-brand-light opacity-100'
            : 'bg-black/20 text-white/70 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/40'
            }`}
        >
          <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="min-h-[48px] px-1">
        <h3 className={`font-bold text-sm truncate transition-colors duration-300 ${isCurrent ? 'text-brand-light' : 'text-slate-900 dark:text-zinc-100'}`}>
          {song.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors">
          {song.artist}
        </p>
      </div>
    </div>
  );
};

export default MusicCard;