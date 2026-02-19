import React from 'react';
import { Copy, Truck, ExternalLink } from 'lucide-react';
import RetroRadio from './RetroRadio';

const RadioView = () => {
    const radioUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/radio/stream.mp3` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(radioUrl);
        alert('URL copiada para a área de transferência!');
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen pb-32 animate-fade-in relative overflow-x-hidden">
            <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-12 z-10">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                        Rádio <span className="text-brand">Vinil Suno</span>
                    </h1>
                    <p className="text-zinc-400 font-medium max-w-2xl mx-auto text-lg">
                        A melhor seleção musical, <span className="text-brand-light font-bold">24 horas por dia</span>.
                        <br className="hidden md:block" /> Sintonize agora em alta qualidade.
                    </p>
                </div>

                {/* The Retro Player */}
                <div className="transform hover:scale-[1.01] transition-transform duration-500 ease-out">
                    <RetroRadio />
                </div>

                {/* Integration Details Grid */}
                <div className="grid md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto pt-8 border-t border-white/5">

                    {/* Visual Direct Link Card */}
                    <div className="bg-[#18181b]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-brand/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ExternalLink className="w-24 h-24 text-white transform rotate-12" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Streaming URL</h3>
                        <p className="text-zinc-500 text-sm mb-6">Use este link direto no seu player favorito (VLC, Winamp, AIMP) ou simuladores.</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 relative z-10">
                                <code className="flex-1 bg-black/60 border border-white/5 px-4 py-4 rounded-xl text-brand-light font-mono text-sm break-all shadow-inner select-all">
                                    {radioUrl}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-4 bg-white/5 hover:bg-brand hover:text-white rounded-xl text-zinc-400 transition-all active:scale-95 border border-white/5 shadow-lg group/btn"
                                    title="Copiar URL"
                                >
                                    <Copy className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <a href={radioUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> Abrir no navegador
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Gaming Integration Card */}
                    <div className="bg-[#18181b]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl hover:border-brand/30 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Truck className="w-24 h-24 text-white transform -rotate-12" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            Euro Truck Simulator 2
                        </h3>
                        <p className="text-zinc-500 text-sm mb-6">Instruções para adicionar a rádio ao jogo.</p>

                        <ol className="text-sm text-zinc-400 space-y-4 list-decimal list-inside font-mono leading-relaxed relative z-10">
                            <li className="pl-2">
                                Acesse: <span className="text-zinc-200 bg-white/5 px-1 rounded">Documents/Euro Truck Simulator 2/</span>
                            </li>
                            <li className="pl-2">
                                Abra o arquivo: <span className="text-zinc-200 bg-white/5 px-1 rounded">live_streams.sii</span>
                            </li>
                            <li className="pl-2">
                                Adicione a linha:
                                <div className="mt-2 bg-black/40 p-3 rounded border border-white/5 text-xs text-emerald-400 break-all select-all hover:bg-black/60 transition-colors cursor-text">
                                    stream_data[X]: "{radioUrl}|Vinil Suno|Pop|PT|128|0"
                                </div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Background Ambient Light */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-brand opacity-[0.08] blur-[120px] pointer-events-none rounded-full"></div>
        </div>
    );
};

export default RadioView;
