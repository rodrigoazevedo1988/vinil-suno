import React, { useMemo, useState } from 'react';
import { Disc, LayoutGrid, List, ArrowLeft } from 'lucide-react';
import { Song, Playlist } from '../types';
import MusicCard from './MusicCard';
import SongListTable from './SongListTable';
import Pagination from './Pagination';

interface AlbumsViewProps {
    songs: Song[];
    playlists: Playlist[];
    isPlaying: boolean;
    currentSong: Song | null;
    onPlay: (song: Song) => void;
    onToggleFavorite: (song: Song) => void;
    onAddToQueue?: (song: Song) => void;
    onAddToPlaylist?: (songId: string, playlistId: string) => void;
    onCreatePlaylist?: () => void;
    isAdmin?: boolean;
    onEditCMS?: (song: Song) => void;
}

const AlbumsView: React.FC<AlbumsViewProps> = ({
    songs,
    playlists,
    isPlaying,
    currentSong,
    onPlay,
    onToggleFavorite,
    onAddToQueue,
    onAddToPlaylist,
    onCreatePlaylist,
    isAdmin,
    onEditCMS
}) => {
    const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'compact' | 'list'>('compact');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const albums = useMemo(() => {
        const albumMap = new Map<string, { name: string; artist: string; songs: Song[]; coverUrl: string }>();

        songs.forEach(song => {
            const albumName = song.album || 'Álbum Desconhecido';
            if (!albumMap.has(albumName)) {
                albumMap.set(albumName, {
                    name: albumName,
                    artist: song.artist,
                    songs: [],
                    coverUrl: song.coverUrl
                });
            }
            albumMap.get(albumName)!.songs.push(song);
        });

        return Array.from(albumMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [songs]);

    const albumSongs = useMemo(() => {
        if (!selectedAlbum) return [];
        return songs.filter(s => (s.album || 'Álbum Desconhecido') === selectedAlbum);
    }, [selectedAlbum, songs]);

    if (selectedAlbum) {
        return (
            <div className="animate-fade-in space-y-8 pb-20">
                <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-6">
                    <button
                        onClick={() => setSelectedAlbum(null)}
                        className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">ÁLBUM</span>
                        <h1 className="text-4xl font-black tracking-tight">{selectedAlbum}</h1>
                    </div>

                    <div className="ml-auto flex items-center bg-black/[0.03] dark:bg-white/[0.03] rounded-full p-1 border border-black/5 dark:border-white/5">
                        <button
                            onClick={() => setViewMode('compact')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'compact' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Compacto
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
                        >
                            <List className="w-4 h-4" /> Lista
                        </button>
                    </div>
                </div>

                {viewMode === 'compact' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {albumSongs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(song => (
                            <MusicCard
                                key={song.id}
                                song={song}
                                isPlaying={isPlaying}
                                isCurrent={currentSong?.id === song.id}
                                onPlay={onPlay}
                                onToggleFavorite={onToggleFavorite}
                                playlists={playlists}
                                onAddToQueue={onAddToQueue}
                                onAddToPlaylist={onAddToPlaylist}
                                onCreatePlaylist={onCreatePlaylist}
                                isAdmin={isAdmin}
                                onEditCMS={onEditCMS}
                            />
                        ))}
                    </div>
                ) : (
                    <SongListTable
                        songs={albumSongs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
                        currentSong={currentSong}
                        isPlaying={isPlaying}
                        onPlay={onPlay}
                        onToggleFavorite={onToggleFavorite}
                        playlists={playlists}
                        onAddToQueue={onAddToQueue}
                        onAddToPlaylist={onAddToPlaylist}
                        onCreatePlaylist={onCreatePlaylist}
                        isAdmin={isAdmin}
                        onEditCMS={onEditCMS}
                        startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
                    />
                )}
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(albumSongs.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <header className="space-y-2 pb-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
                    Navegar por Álbuns
                </h1>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {albums.map((album) => (
                    <div
                        key={album.name}
                        onClick={() => setSelectedAlbum(album.name)}
                        className="relative overflow-hidden rounded-xl aspect-square cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg bg-white/5 border border-white/5 group"
                    >
                        <img
                            src={album.coverUrl}
                            alt={album.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-5 w-full">
                            <h3 className="text-lg font-black text-white truncate drop-shadow-lg">
                                {album.name}
                            </h3>
                            <p className="text-xs font-bold text-zinc-400 truncate mt-0.5">
                                {album.artist}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
                                    {album.songs.length} faixas
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlbumsView;
