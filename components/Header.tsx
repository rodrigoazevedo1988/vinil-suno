import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, X, Sun, Moon, Play } from 'lucide-react';
import { Song } from '../types';

interface HeaderProps {
  user: { id?: string; name: string; avatarUrl?: string; email?: string };
  onMenuClick: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onProfile?: () => void;
  songs?: Song[];
  onPlaySong?: (song: Song) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick, searchQuery, onSearch, theme, onToggleTheme, onProfile, songs = [], onPlaySong }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Check for new songs
  useEffect(() => {
    if (!user.id) return;
    const storageKey = `vinil_last_seen_id_${user.id}`;
    const lastSeenId = localStorage.getItem(storageKey);

    if (songs.length > 0) {
      if (!lastSeenId || songs[0].id !== lastSeenId) {
        setHasNew(true);
      } else {
        setHasNew(false);
      }
    }
  }, [songs, user.id]);

  const handleOpenNotif = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasNew(false);
    if (songs.length > 0 && user.id) {
      const storageKey = `vinil_last_seen_id_${user.id}`;
      localStorage.setItem(storageKey, songs[0].id);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentSongs = songs.slice(0, 5); // Assuming songs are ordered by date DESC from backend

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 md:px-8 bg-transparent">
      <div className="flex items-center gap-4 md:hidden">
        <button onClick={onMenuClick} className="p-2 text-zinc-500 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-light transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="block w-full py-2.5 pl-11 pr-10 text-sm glass-input rounded-full outline-none focus:ring-1 focus:ring-brand/30 transition-all"
            placeholder="O que você quer ouvir?"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active-press"
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 animate-scale-in" /> : <Moon className="w-5 h-5 animate-scale-in" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotif}
            className={`hidden md:flex p-2.5 rounded-full transition-all relative ${hasNew ? 'text-brand-light bg-brand/10 hover:bg-brand/20' : 'text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10'}`}
          >
            <Bell className={`w-5 h-5 ${hasNew ? 'animate-pulse' : ''}`} />
            {hasNew && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-950" />}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50">
              <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-400">Últimas Adicionadas</h3>
                {hasNew && (
                  <button onClick={handleMarkAsRead} className="text-[10px] font-bold text-brand hover:text-brand-light transition-colors uppercase tracking-widest">
                    Marcar como vistas
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {recentSongs.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-black/5 dark:border-white/[0.02] last:border-0"
                    onClick={() => { onPlaySong && onPlaySong(s); setShowNotifications(false); }}
                  >
                    <img src={s.coverUrl} className="w-10 h-10 rounded-md object-cover shadow-sm" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{s.title}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 truncate">{s.artist}</p>
                    </div>
                    <button className="p-1.5 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all">
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {recentSongs.length === 0 && <p className="p-6 text-xs text-center text-zinc-500">Nenhuma música recente.</p>}
              </div>
              <div className="p-2 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-center">
                <span className="text-[10px] font-bold text-zinc-400">Mostrando as 5 últimas</span>
              </div>
            </div>
          )}
        </div>

        <div onClick={onProfile} className="flex items-center gap-3 p-1 pl-1.5 pr-3 rounded-full bg-black/5 dark:bg-black/40 hover:bg-black/10 dark:hover:bg-white/[0.08] border border-black/5 dark:border-white/5 transition-all cursor-pointer group backdrop-blur-md">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-sm">
              <span className="text-xs font-black text-white">{user.name?.charAt(0) || '?'}</span>
            </div>
          )}
          <span className="hidden md:block text-xs font-bold text-slate-700 dark:text-zinc-200">{user.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;