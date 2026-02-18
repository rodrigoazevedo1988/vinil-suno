import React from 'react';
import { Home, Music, Disc, Heart, PlusSquare, Mic2, Settings, Sparkles, User, LogOut } from 'lucide-react';
import { Playlist } from '../types';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
  currentView: string;
  playlists: Playlist[];
  onNavigate: (view: string, id?: string) => void;
  selectedPlaylistId: string | null;
  isAdmin?: boolean;
  onProfile?: () => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  isOpen,
  onClose,
  currentView,
  playlists,
  onNavigate,
  selectedPlaylistId,
  isAdmin = false,
  onProfile,
  onLogout
}) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'library', icon: Music, label: 'Minhas Músicas' },
    { id: 'moods', icon: Sparkles, label: 'Moods' },
    { id: 'playlists', icon: Disc, label: 'Playlists' },
    { id: 'favorites', icon: Heart, label: 'Favoritas' },
  ];

  const handleNavigation = (viewId: string, id?: string) => {
    onNavigate(viewId, id);
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/80 backdrop-blur-sm md:hidden transition-all duration-slow ease-premium ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col transition-transform duration-slow ease-premium
        glass-sidebar
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${className}
      `}>
        <div className="px-6 py-8 flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigation('home')}>
          <div className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(123,30,58,0.6)] shrink-0 transition-transform duration-base ease-premium group-hover:scale-105">
            <Mic2 className="w-5 h-5 ml-px" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white/95 transition-colors">Vinil Suno</span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-8 overflow-y-auto scrollbar-hide pb-24">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full group flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-fast ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${isActive
                    ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-black/5 dark:border-white/5'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors duration-fast ease-out ${isActive ? 'text-brand-light' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-200'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/[0.06] px-2">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-4">
              Suas Playlists
            </h3>
            <ul className="space-y-0.5">
              {playlists.map((playlist) => {
                const isSelected = currentView === 'playlist-detail' && selectedPlaylistId === playlist.id;
                return (
                  <li key={playlist.id}>
                    <button
                      onClick={() => handleNavigation('playlist-detail', playlist.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-fast ease-out truncate outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${isSelected
                        ? 'text-brand-light dark:text-white bg-black/5 dark:bg-white/10 font-bold'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                      {playlist.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Admin / CMS Section */}
          {/* Admin / CMS Section */}
          <div className="pt-4 border-t border-black/5 dark:border-white/[0.06] px-2">
            <button
              onClick={() => handleNavigation('cms')}
              className={`w-full group flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-fast ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${currentView === 'cms'
                ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-black/5 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
            >
              {isAdmin ? (
                <>
                  <Settings className="w-5 h-5 transition-colors group-hover:text-brand-light" />
                  <span>Gerenciar (CMS)</span>
                </>
              ) : (
                <>
                  <PlusSquare className="w-5 h-5 transition-colors group-hover:text-brand-light" />
                  <span>Criar Playlist</span>
                </>
              )}
            </button>
          </div>

          {/* Profile & Logout */}
          <div className="pt-4 border-t border-black/5 dark:border-white/[0.06] px-2 space-y-1">
            <button
              onClick={() => { onProfile?.(); if (onClose && window.innerWidth < 768) onClose(); }}
              className={`w-full group flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-fast ease-out ${currentView === 'profile'
                ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-black/5 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
            >
              <User className="w-5 h-5 transition-colors group-hover:text-brand-light" />
              <span>Meu Perfil</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full group flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded-lg transition-all text-red-400/60 hover:text-red-400 hover:bg-red-500/5"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;