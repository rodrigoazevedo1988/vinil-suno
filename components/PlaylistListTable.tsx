import React from 'react';
import { Clock, ListMusic } from 'lucide-react';
import { Playlist } from '../types';

interface PlaylistListTableProps {
    playlists: Playlist[];
    onClick: (id: string) => void;
}

const PlaylistListTable: React.FC<PlaylistListTableProps> = ({ playlists, onClick }) => {
    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-white/[0.08] text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 items-center">
                <div className="w-8 text-center">#</div>
                <div>Playlist</div>
                <div className="hidden md:block">Descrição</div>
                <div className="w-24 text-right">Qtd. Músicas</div>
            </div>

            <div className="space-y-1">
                {playlists.map((playlist, index) => (
                    <div
                        key={playlist.id}
                        onClick={() => onClick(playlist.id)}
                        className="group grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 rounded-lg items-center hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                        {/* Index */}
                        <div className="w-8 text-center text-sm font-medium text-zinc-500">
                            {index + 1}
                        </div>

                        {/* Title & Cover */}
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={playlist.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop'}
                                className="w-10 h-10 rounded shadow-sm object-cover"
                                alt={playlist.name}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="font-bold truncate text-sm text-white group-hover:text-brand transition-colors">{playlist.name}</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="hidden md:flex items-center text-sm text-zinc-400 group-hover:text-white transition-colors truncate">
                            {playlist.description || '-'}
                        </div>

                        {/* Song Count */}
                        <div className="w-24 flex items-center justify-end gap-2 text-sm text-zinc-500 font-tabular-nums">
                            <span>{playlist.songIds?.length || 0}</span>
                            <ListMusic className="w-4 h-4 opacity-50" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlaylistListTable;
