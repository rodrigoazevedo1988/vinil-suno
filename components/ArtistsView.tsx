import React, { useMemo, useState } from 'react';
import { Users, LayoutGrid, List, ArrowLeft, Music2, Clock } from 'lucide-react';
import { Song, Playlist } from '../types';
import MusicCard from './MusicCard';
import SongListTable from './SongListTable';
import Pagination from './Pagination';

interface ArtistsViewProps {
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

const ArtistsView: React.FC<ArtistsViewProps> = ({
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
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'compact' | 'list'>('compact');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const artists = useMemo(() => {
        const artistMap = new Map<string, { name: string; songs: Song[]; coverUrl: string }>();

        songs.forEach(song => {
            const artistName = song.artist || 'Artista Desconhecido';
            if (!artistMap.has(artistName)) {
                artistMap.set(artistName, { name: artistName, songs: [], coverUrl: song.coverUrl });
            }
            artistMap.get(artistName)!.songs.push(song);
        });

        return Array.from(artistMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [songs]);

    const artistSongs = useMemo(() => {
        if (!selectedArtist) return [];
        return songs.filter(s => s.artist === selectedArtist);
    }, [selectedArtist, songs]);

    if (selectedArtist) {
        const artistInfo = artists.find(a => a.name === selectedArtist);
        return (
            <div className="animate-fade-in space-y-8 pb-20">
                <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-6">
                    <button
                        onClick={() => setSelectedArtist(null)}
                        className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">ARTISTA</span>
                        <h1 className="text-4xl font-black tracking-tight">{selectedArtist}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 font-medium">
                            <div className="flex items-center gap-1">
                                <Music2 className="w-4 h-4" />
                                <span>{artistSongs.length} músicas</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-zinc-600" />
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTotalTime(artistSongs.reduce((acc, s) => acc + s.duration, 0))}</span>
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
                        {artistSongs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(song => (
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
                        songs={artistSongs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
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
                    totalPages={Math.ceil(artistSongs.length / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <header className="space-y-2 pb-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
                    Navegar por Artistas
                </h1>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {artists.map((artist) => (
                    <div
                        key={artist.name}
                        onClick={() => setSelectedArtist(artist.name)}
                        className="relative overflow-hidden rounded-xl aspect-square cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg bg-white/5 border border-white/5 group"
                    >
                        <img
                            src={artist.coverUrl}
                            alt={artist.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <h3 className="text-xl font-black text-white truncate drop-shadow-lg">
                                {artist.name}
                            </h3>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                {artist.songs.length} {artist.songs.length === 1 ? 'Música' : 'Músicas'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArtistsView;
