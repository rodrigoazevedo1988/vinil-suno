import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, ArrowLeft, Disc, Clock, Music2 } from 'lucide-react';
import { Song, Playlist } from '../types';
import MusicCard from './MusicCard';
import SongListTable from './SongListTable';
import Pagination from './Pagination';

interface GenresViewProps {
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

const formatTotalTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} h ${m} min`;
    return `${m} min`;
};

const GenresView: React.FC<GenresViewProps> = ({
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
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'compact' | 'list'>('compact');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const genres = useMemo(() => {
        const genreMap = new Map<string, { name: string; songs: Song[]; coverUrl: string }>();

        songs.forEach(song => {
            const genreName = song.genre || 'Outros';
            if (!genreMap.has(genreName)) {
                // Find a representative image (first song's cover)
                genreMap.set(genreName, { name: genreName, songs: [], coverUrl: song.coverUrl });
            }
            genreMap.get(genreName)!.songs.push(song);
        });

        return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [songs]);

    const genreSongs = useMemo(() => {
        if (!selectedGenre) return [];
        return songs.filter(s => (s.genre || 'Outros') === selectedGenre);
    }, [selectedGenre, songs]);

    // Visual palettes for genre cards
    const genrePalettes = [
        'from-purple-600 to-blue-600',
        'from-emerald-600 to-teal-600',
        'from-orange-600 to-red-600',
        'from-pink-600 to-rose-600',
        'from-amber-500 to-orange-600',
        'from-indigo-600 to-violet-700',
        'from-cyan-500 to-blue-600',
        'from-lime-500 to-emerald-600'
    ];

    if (selectedGenre) {
        return (
            <div className="animate-fade-in space-y-8 pb-20">
                <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-6">
                    <button
                        onClick={() => setSelectedGenre(null)}
                        className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">GÊNERO</span>
                        <h1 className="text-4xl font-black tracking-tight">{selectedGenre}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 font-medium">
                            <div className="flex items-center gap-1">
                                <Music2 className="w-4 h-4" />
                                <span>{genreSongs.length} músicas</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-zinc-600" />
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTotalTime(genreSongs.reduce((acc, s) => acc + s.duration, 0))}</span>
                            </div>
                        </div>
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
                        {genreSongs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(song => (
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
                        songs={genreSongs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
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
                    totalPages={Math.ceil(genreSongs.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <header className="space-y-2 pb-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
                    Navegar por Gêneros
                </h1>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {genres.map((genre, idx) => (
                    <div
                        key={genre.name}
                        onClick={() => setSelectedGenre(genre.name)}
                        className={`relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg bg-gradient-to-br ${genrePalettes[idx % genrePalettes.length]} group`}
                    >
                        <div className="absolute top-4 left-4 z-10">
                            <h3 className="text-2xl font-black text-white leading-tight">
                                {genre.name}
                            </h3>
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                                {genre.songs.length} {genre.songs.length === 1 ? 'Música' : 'Músicas'}
                            </p>
                        </div>

                        <img
                            src={genre.coverUrl}
                            alt={genre.name}
                            className="absolute -bottom-2 -right-4 w-24 h-24 md:w-28 md:h-28 object-cover rotate-[25deg] shadow-2xl rounded-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[30deg] opacity-40 group-hover:opacity-100"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GenresView;
