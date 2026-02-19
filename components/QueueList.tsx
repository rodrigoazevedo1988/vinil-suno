import React from 'react';
import { X, ListMusic, Play } from 'lucide-react';
import { Song } from '../types';

interface QueueListProps {
    queue: Song[];
    currentSong: Song | null;
    isOpen: boolean;
    onClose: () => void;
    onRemoveFromQueue: (index: number) => void;
    onPlayFromQueue: (song: Song, index: number) => void;
}

const QueueList: React.FC<QueueListProps> = ({
    queue,
    currentSong,
    isOpen,
    onClose,
    onRemoveFromQueue,
    onPlayFromQueue
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-4 w-80 bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[calc(100vh-200px)] animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <ListMusic className="w-5 h-5 text-brand" />
                    <span>Fila de Reprodução</span>
                </div>
                <button onClick={onClose} className="text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700">
                {/* Tocando Agora */}
                {currentSong && (
                    <div className="mb-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2">Tocando Agora</h3>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-brand/5 dark:bg-white/5 border border-brand/20">
                            <img src={currentSong.coverUrl} className="w-10 h-10 rounded object-cover shadow-sm" alt={currentSong.title} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-brand-light truncate animate-pulse">{currentSong.title}</div>
                                <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">{currentSong.artist}</div>
                            </div>
                            <div className="w-4 h-4 flex items-center justify-center">
                                <span className="block w-2 h-2 bg-brand rounded-full animate-ping" />
                            </div>
                        </div>
                    </div>
                )}

                {/* A Seguir */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2">A Seguir ({queue.length})</h3>
                    {queue.length === 0 ? (
                        <div className="text-slate-400 dark:text-zinc-500 text-sm p-4 text-center italic">
                            A fila está vazia.
                            <br />Adicione músicas com "..."
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {queue.map((song, index) => (
                                <div key={`${song.id}-${index}`} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors">
                                    <div className="relative w-10 h-10 shrink-0">
                                        <img src={song.coverUrl} className="w-full h-full rounded object-cover" alt={song.title} />
                                        <button
                                            onClick={() => onPlayFromQueue(song, index)}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Play className="w-4 h-4 text-white fill-white" />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{song.title}</div>
                                        <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">{song.artist}</div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemoveFromQueue(index); }}
                                        className="text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remover da fila"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueList;
