import React from 'react';
import { Play } from 'lucide-react';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  return (
    <div 
        className="group p-4 glass-card rounded-xl cursor-pointer flex flex-col gap-3 h-full outline-none focus-visible:ring-2 focus-visible:ring-brand/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active-press"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
            if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
            }
        }}
    >
      <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-xl bg-slate-200 dark:bg-zinc-800">
        <img 
          src={playlist.coverUrl} 
          alt={playlist.name} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-slow ease-premium group-hover:scale-[1.03]"
        />
        <div className="absolute right-3 bottom-3 w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-brand-light active-press">
           <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>
      </div>
      
      <div className="min-h-[52px] flex flex-col gap-1 px-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-brand-light transition-colors">{playlist.name}</h3>
        <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium line-clamp-2 leading-relaxed">{playlist.description}</p>
      </div>
    </div>
  );
};

export default PlaylistCard;