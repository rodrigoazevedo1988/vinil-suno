import React from 'react';
import { Play, Pause, Clock, Heart } from 'lucide-react';
import { Song, Playlist } from '../types';
import SongContextMenu from './SongContextMenu';

interface SongListTableProps {
    songs: Song[];
    currentSong: Song | null;
    isPlaying: boolean;
    onPlay: (song: Song) => void;
    onToggleFavorite: (song: Song) => void;
    // New Props
    playlists?: Playlist[];
    onAddToQueue?: (song: Song) => void;
    onAddToPlaylist?: (songId: string, playlistId: string) => void;
    onCreatePlaylist?: () => void;
}

const SongListTable: React.FC<SongListTableProps> = ({
    songs,
    currentSong,
    isPlaying,
    onPlay,
    onToggleFavorite,
    playlists = [], onAddToQueue = () => { }, onAddToPlaylist = () => { }, onCreatePlaylist = () => { }
}) => {
    const formatTime = (sec: number) => {
        const min = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${min}:${s.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-[auto_2fr_1.5fr_1fr_auto_auto_auto] gap-4 px-4 py-2 border-b border-black/10 dark:border-white/[0.08] text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2 items-center">
                <div className="w-8 text-center">#</div>
                <div>Título</div>
                <div className="hidden md:block">Álbum</div>
                <div className="hidden md:block">Gênero</div>
                <div className="hidden lg:block text-right">Adicionada em</div>
                <div className="w-16 text-right"><Clock className="w-4 h-4 ml-auto" /></div>
            </div>

            <div className="space-y-1">
                {songs.map((song, index) => {
                    const isCur = currentSong?.id === song.id;
                    return (
                        <div
                            key={song.id}
                            className={`group grid grid-cols-[auto_2fr_1.5fr_1fr_auto_auto_auto] gap-4 px-4 py-3 rounded-lg items-center hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors ${isCur ? 'bg-black/[0.04] dark:bg-white/[0.08]' : ''}`}
                        >
                            {/* Index / Play Button */}
                            <div className="w-8 text-center text-sm font-medium text-slate-400 dark:text-zinc-500 relative flex justify-center items-center">
                                <span className={`group-hover:opacity-0 ${isCur ? 'text-brand' : ''}`}>
                                    {isCur && isPlaying ? <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="h-3.5" alt="playing" /> : index + 1}
                                </span>
                                <button
                                    onClick={() => onPlay(song)}
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {isCur && isPlaying ? (
                                        <Pause className="w-4 h-4 text-white fill-white" />
                                    ) : (
                                        <Play className="w-4 h-4 text-white fill-white" />
                                    )}
                                </button>
                            </div>

                            {/* Title & Artist */}
                            <div className="flex items-center gap-3 min-w-0">
                                <img src={song.coverUrl} className="w-10 h-10 rounded shadow-sm object-cover" alt={song.title} />
                                <div className="min-w-0 flex-1">
                                    <div className={`font-bold truncate text-sm ${isCur ? 'text-brand' : 'text-slate-900 dark:text-white'}`}>{song.title}</div>
                                    <div className="text-slate-500 dark:text-zinc-500 text-xs truncate group-hover:text-slate-700 dark:group-hover:text-white transition-colors cursor-pointer hover:underline">{song.artist}</div>
                                </div>
                            </div>

                            {/* Album */}
                            <div className="hidden md:flex items-center text-sm text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors truncate">
                                {song.album || '-'}
                            </div>

                            {/* Genre */}
                            <div className="hidden md:flex items-center text-sm text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors truncate">
                                {song.genre ? <span className="bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-xs">{song.genre}</span> : '-'}
                            </div>

                            {/* Date Added */}
                            <div className="hidden lg:flex justify-end text-sm text-slate-400 dark:text-zinc-500">
                                {formatDate(song.dateAdded)}
                            </div>

                            {/* Duration & Heart */}
                            <div className="w-16 flex items-center justify-end gap-3 text-sm text-slate-400 dark:text-zinc-500 font-tabular-nums">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(song); }}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 ${song.isFavorite ? 'opacity-100 text-brand' : 'hover:text-white'}`}
                                >
                                    <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
                                </button>
                                <span>{formatTime(song.duration)}</span>
                            </div>

                            {/* Context Menu */}
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <SongContextMenu
                                    song={song}
                                    playlists={playlists}
                                    onAddToQueue={onAddToQueue}
                                    onAddToPlaylist={onAddToPlaylist}
                                    onCreatePlaylist={onCreatePlaylist}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SongListTable;
