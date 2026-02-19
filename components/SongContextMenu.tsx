import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, Download, Share2, ListPlus, Plus, PlayCircle, Check, Music, ChevronLeft } from 'lucide-react';
import { Song, Playlist } from '../types';

interface SongContextMenuProps {
    song: Song;
    playlists: Playlist[];
    onAddToQueue: (song: Song) => void;
    onAddToPlaylist: (songId: string, playlistId: string) => void;
    onCreatePlaylist: () => void;
    triggerClassName?: string;
}

const SongContextMenu: React.FC<SongContextMenuProps> = ({
    song,
    playlists,
    onAddToQueue,
    onAddToPlaylist,
    onCreatePlaylist,
    triggerClassName = "text-zinc-400 hover:text-white"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showPlaylists, setShowPlaylists] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    // Refs
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Calcular posição e abrir
    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const MENU_WIDTH = 256; // w-64
            const MENU_HEIGHT = 300; // Altura estimada máxima

            let top = rect.bottom + 8;
            let left = rect.left;

            // Colisão Direita
            if (left + MENU_WIDTH > window.innerWidth) {
                left = rect.right - MENU_WIDTH;
            }
            // Colisão Esquerda (raro, mas possível)
            if (left < 0) left = 10;

            // Colisão Embaixo
            if (top + MENU_HEIGHT > window.innerHeight) {
                top = rect.top - MENU_HEIGHT + 20; // Abre para cima se não couber embaixo
            }

            setMenuPosition({ top, left });
            setShowPlaylists(false);
        }
        setIsOpen(!isOpen);
    };

    // Fechar ao clicar fora ou scrollar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && menuRef.current.contains(event.target as Node) ||
                buttonRef.current && buttonRef.current.contains(event.target as Node)
            ) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const handleDownload = async () => {
        try {
            const response = await fetch(song.audioUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${song.title}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Erro no download:', e);
            window.open(song.audioUrl, '_blank');
        }
        setIsOpen(false);
    };

    const handleShare = () => {
        const shareUrl = `${window.location.protocol}//${window.location.host}/#share=${song.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Link copiado! Compartilhe com amigos.');
        });
        setIsOpen(false);
    };

    const menuContent = (
        <div
            ref={menuRef}
            className="fixed w-64 bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden text-sm animate-fade-in origin-top-left"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
        >
            {!showPlaylists ? (
                <div className="flex flex-col py-1">
                    <button onClick={() => { onAddToQueue(song); setIsOpen(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 text-left text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <ListPlus className="w-4 h-4" />
                        Adicionar à Fila
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 text-left text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                        Baixar MP3
                    </button>
                    <button onClick={handleShare} className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 text-left text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors border-b border-black/5 dark:border-white/5">
                        <Share2 className="w-4 h-4" />
                        Compartilhar
                    </button>
                    <button onClick={() => setShowPlaylists(true)} className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 text-left text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                        Adicionar à Playlist...
                    </button>
                </div>
            ) : (
                <div className="flex flex-col py-1">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <button onClick={() => setShowPlaylists(false)} className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                            <ChevronLeft className="w-3 h-3" /> Voltar
                        </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-thin">
                        {playlists.map(p => (
                            <button
                                key={p.id}
                                onClick={() => { onAddToPlaylist(song.id, p.id); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 text-left text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <Music className="w-4 h-4" />
                                <span className="truncate">{p.name}</span>
                                {p.songIds?.includes(song.id) && <Check className="w-3 h-3 ml-auto text-brand" />}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { onCreatePlaylist(); setIsOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-brand/20 text-brand-light font-bold border-t border-black/5 dark:border-white/5"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Playlist
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${triggerClassName}`}
            >
                <MoreVertical className="w-5 h-5" />
            </button>
            {isOpen && ReactDOM.createPortal(menuContent, document.body)}
        </>
    );
};

export default SongContextMenu;
