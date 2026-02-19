import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Radio } from 'lucide-react';

const RetroRadio = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [metadata, setMetadata] = useState<any>(null);
    const [vuLevel, setVuLevel] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch periodicmetadata
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await fetch('/api/radio/now-playing');
                if (res.ok) {
                    const data = await res.json();
                    setMetadata(data);
                }
            } catch (e) {
                console.error('Radio meta error:', e);
            }
        };

        fetchMeta();
        const interval = setInterval(fetchMeta, 5000);
        return () => clearInterval(interval);
    }, []);

    // VU Meter Animation
    useEffect(() => {
        if (!isPlaying) {
            setVuLevel(0);
            return;
        }
        const interval = setInterval(() => {
            // Random fluctuations between 20% and 100%
            setVuLevel(20 + Math.random() * 80);
        }, 80);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Audio Control
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/api/radio/stream.mp3');
            audioRef.current.crossOrigin = 'anonymous';
            audioRef.current.preload = 'none';
        }

        audioRef.current.volume = volume;

        if (isPlaying) {
            // Adicionar timestamp para evitar cache do navegador se reconectar
            if (audioRef.current.src.includes('stream.mp3')) {
                // Manter src
            } else {
                audioRef.current.src = `/api/radio/stream.mp3?t=${Date.now()}`;
            }

            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed", error);
                    setIsPlaying(false);
                });
            }
        } else {
            audioRef.current.pause();
            // Desconectar para economizar banda? 
            // Melhor não recarregar src toda hora para evitar delay
        }
    }, [isPlaying]);

    // Volume update
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    return (
        <div className="w-full max-w-4xl mx-auto my-8 relative group perspective-1000">
            {/* Case Body */}
            <div className="bg-[#1a1a1a] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#333] relative overflow-hidden transition-transform duration-500 ease-out hover:scale-[1.01]">

                {/* Wood/Metal Texture Overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>

                {/* Top Panel: Branding & Shiny Strip */}
                <div className="h-12 bg-gradient-to-r from-[#222] via-[#444] to-[#222] border-b border-[#000] flex items-center justify-between px-6 shadow-md relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_red] animate-pulse" style={{ opacity: isPlaying ? 1 : 0.3 }}></div>
                        <span className="text-zinc-400 font-bold text-xs tracking-widest uppercase font-mono">Stereo Reception</span>
                    </div>
                    <div className="text-zinc-500 font-black italic tracking-tighter text-lg opacity-50">VINIL SUNO <span className="text-brand text-xs not-italic font-normal tracking-normal border border-brand px-1 rounded ml-1">HI-FI</span></div>
                </div>

                {/* Main Face */}
                <div className="p-8 flex flex-col md:flex-row gap-8 items-stretch bg-[#1a1a1a] relative">

                    {/* Left Speaker */}
                    <div className="flex-1 bg-[#111] rounded-lg border border-[#333] relative overflow-hidden shadow-inner group-hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-all">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_2px,#080808_2px)] bg-[length:6px_6px] opacity-80"></div>
                        {/* Fake Driver */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`w-32 h-32 rounded-full border-8 border-[#222] bg-[#151515] shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-transform duration-75 ${isPlaying ? 'scale-105' : 'scale-100'}`} style={{ transform: `scale(${1 + (vuLevel / 1000)})` }}></div>
                        </div>
                    </div>

                    {/* Center Console */}
                    <div className="flex-[1.5] flex flex-col gap-6">

                        {/* Frequency Display Window */}
                        <div className="bg-[#050505] rounded-md border-4 border-[#333] shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative h-32 flex flex-col items-center justify-center p-4 overflow-hidden">
                            {/* Glass Glare */}
                            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 pointer-events-none"></div>

                            {/* Digital/Retro Text */}
                            {metadata ? (
                                <div className="z-10 text-center w-full">
                                    <div className="text-amber-500/80 font-mono text-xs uppercase tracking-[0.3em] mb-2 border-b border-amber-500/20 pb-1 inline-block">Now Playing</div>
                                    <div className="text-amber-100 font-bold text-xl md:text-2xl font-serif tracking-wide truncate drop-shadow-[0_0_5px_rgba(251,191,36,0.3)] animate-pulse-slow">
                                        {metadata.title}
                                    </div>
                                    <div className="text-amber-500/60 font-medium text-sm mt-1 truncate font-mono">
                                        {metadata.artist}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-zinc-700 font-mono text-sm animate-pulse">SEARCHING SIGNAL...</div>
                            )}

                            {/* Analog VU Meters */}
                            <div className="absolute bottom-2 left-0 right-0 px-4 flex gap-2 h-1.5 opacity-80">
                                <div className="flex-1 bg-[#222] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-600 via-yellow-600 to-red-600 transition-all duration-75" style={{ width: `${vuLevel}%` }}></div>
                                </div>
                                <div className="flex-1 bg-[#222] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-600 via-yellow-600 to-red-600 transition-all duration-75 delay-75" style={{ width: `${vuLevel * 0.9}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between px-4 bg-[#222] rounded-lg p-3 border border-[#333] shadow-md">

                            {/* Volume Knob */}
                            <div className="flex items-center gap-3">
                                <Volume2 className="w-4 h-4 text-zinc-500" />
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                />
                            </div>

                            {/* Big Play Button */}
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all active:translate-y-0.5 active:shadow-none ${isPlaying
                                    ? 'bg-amber-600 border-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                                    : 'bg-[#333] border-[#444] text-zinc-500 hover:text-white hover:border-zinc-400'}`}
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                            </button>
                        </div>

                    </div>

                    {/* Right Speaker */}
                    <div className="flex-1 bg-[#111] rounded-lg border border-[#333] relative overflow-hidden shadow-inner hidden md:block group-hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-all">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_2px,#080808_2px)] bg-[length:6px_6px] opacity-80"></div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`w-32 h-32 rounded-full border-8 border-[#222] bg-[#151515] shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-transform duration-75 ${isPlaying ? 'scale-105' : 'scale-100'}`} style={{ transform: `scale(${1 + (vuLevel / 1000)})` }}></div>
                        </div>
                    </div>

                </div>

                {/* Bottom Footer */}
                <div className="h-8 bg-[#151515] border-t border-[#000] flex items-center justify-center">
                    <div className="text-[10px] text-zinc-600 font-mono tracking-widest">DESIGNED IN BERLIN • VINIL SUNO ENGINEERING</div>
                </div>
            </div>

            {/* Reflection on surface */}
            <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 blur-xl rounded-[100%]"></div>
        </div>
    );
};

export default RetroRadio;
