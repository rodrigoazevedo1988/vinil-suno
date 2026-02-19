import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1,
  Shuffle, Maximize2, Heart, Music2, Sparkles, Loader2, X, ChevronUp, ChevronDown, Calendar, Zap, Disc, Mic2, ListMusic
} from 'lucide-react';
import { Song } from '../types';
import { GoogleGenAI } from "@google/genai";

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  progress: number;
  duration: number;
  currentTime: number;
  onSeek: (value: number) => void;
  onNext: () => void;
  onPrev: () => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  songs?: Song[];
  onPlaySong?: (song: Song) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isQueueOpen?: boolean;
  onToggleQueue?: () => void;
  queueLength?: number;
  repeatMode?: 'off' | 'all' | 'one';
  onToggleRepeat?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Player: React.FC<PlayerProps> = ({
  currentSong, isPlaying, onTogglePlay, progress, duration, currentTime, onSeek, onNext, onPrev, volume, onVolumeChange, songs = [], onPlaySong, isExpanded, onToggleExpand,
  isQueueOpen = false, onToggleQueue = () => { }, queueLength = 0,
  repeatMode = 'off', onToggleRepeat = () => { }, isShuffle = false, onToggleShuffle = () => { }
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [animateQueue, setAnimateQueue] = useState(false);
  const prevQueueLength = useRef(queueLength);

  useEffect(() => {
    if (queueLength > prevQueueLength.current) {
      setAnimateQueue(true);
      const timer = setTimeout(() => setAnimateQueue(false), 1000);
      return () => clearTimeout(timer);
    }
    prevQueueLength.current = queueLength;
  }, [queueLength]);
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);

  // Scrubber State
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  // Volume State for Mute/Unmute
  const [prevVolume, setPrevVolume] = useState(0.8);

  useEffect(() => {
    // Reset lyrics when song changes
    setLyrics([]);
    if (currentSong?.lyrics) {
      setLyrics(currentSong.lyrics.split('\n'));
    } else if (showLyrics) {
      generateLyrics();
    }
  }, [currentSong?.id, currentSong?.lyrics]);

  const generateLyrics = async () => {
    if (!currentSong) return;
    setIsGeneratingLyrics(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma letra poética e rítmica para uma música chamada "${currentSong.title}" por "${currentSong.artist}". Mood: ${currentSong.mood.energy > 0.6 ? 'Enérgico' : 'Calmo'}. Divida em versos curtos.`
      });
      const lines = response.text?.split('\n').filter(l => l.trim().length > 0) || [];
      setLyrics(lines);
    } catch (err) {
      setLyrics(["Erro ao conectar com a alma da IA...", "Tente novamente em instantes."]);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDragProgress(val);
    onSeek(val);
  };

  const handleSeekStart = () => {
    setIsDragging(true);
    setDragProgress(progress);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume || 0.5);
    }
  };

  // Generate particles (must be before early return - hooks rules)
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 4 + 4,
      delay: Math.random() * 6,
      travelY: -(Math.random() * 120 + 40),
      travelX: (Math.random() - 0.5) * 80,
      endY: -(Math.random() * 200 + 80),
      endX: (Math.random() - 0.5) * 60,
      opacity: Math.random() * 0.4 + 0.2,
      color: Math.random() > 0.5 ? 'rgba(158, 42, 77, 0.7)' : 'rgba(200, 80, 120, 0.5)',
    }));
  }, [currentSong?.id]);

  // SVG waveform path generator (must be before early return - hooks rules)
  const waveformPath = useMemo(() => {
    const points: string[] = [];
    const segments = 80;
    const height = 30;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 100;
      const y = height + Math.sin((i / segments) * Math.PI * 6 + Math.random() * 0.5) * (height * 0.7) * (Math.random() * 0.5 + 0.5);
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return points.join(' ');
  }, [currentSong?.id]);

  if (!currentSong) return null;

  // Use the dragged value while dragging, otherwise the actual progress
  const displayProgress = isDragging ? dragProgress : progress;

  // Generate equalizer bars array
  const eqBars = Array.from({ length: 32 }, (_, i) => i);

  // Filter songs for "More from Artist"
  const moreFromArtist = currentSong
    ? songs.filter(s => s.artist === currentSong.artist && s.id !== currentSong.id).slice(0, 4)
    : [];

  return (
    <>
      {/* Expanded Player Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 md:left-64 z-[45] bg-zinc-950/95 backdrop-blur-2xl flex flex-col expanded-player-enter overflow-y-auto scrollbar-hide pb-[100px]">

          {/* ── Ambient Background Orbs ── */}
          <div className={`absolute inset-0 overflow-hidden pointer-events-none ${!isPlaying ? 'opacity-30' : 'opacity-100'} transition-opacity duration-1000`}>
            <div className={`ambient-orb ${!isPlaying ? 'paused' : ''}`} />
            <div className={`ambient-orb ${!isPlaying ? 'paused' : ''}`} />
            <div className={`ambient-orb ${!isPlaying ? 'paused' : ''}`} />
          </div>

          {/* ── Floating Particles ── */}
          <div className={`absolute inset-0 overflow-hidden pointer-events-none ${!isPlaying ? 'particle-paused' : ''}`}>
            {particles.map((p) => (
              <div
                key={p.id}
                className="particle"
                style={{
                  width: p.size,
                  height: p.size,
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  background: p.color,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  '--p-travel-y': `${p.travelY}px`,
                  '--p-travel-x': `${p.travelX}px`,
                  '--p-end-y': `${p.endY}px`,
                  '--p-end-x': `${p.endX}px`,
                  '--p-opacity': p.opacity,
                  '--p-duration': `${p.duration}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 md:p-8 relative z-10">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-widest">Tocando Agora</span>
              <div className="w-1 h-1 rounded-full bg-brand-light animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-light">{currentSong.album}</span>
            </div>
            <button onClick={onToggleExpand} className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-all">
              <ChevronDown className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-8 relative z-10">
            {/* Left Column: Big Art + Visualizers */}
            <div className="flex flex-col items-center justify-start space-y-8 lg:sticky lg:top-24">

              {/* Cover Art with Sound Wave Rings & Glow */}
              <div className="relative w-full max-w-[500px]">
                {/* Sound Wave Rings */}
                <div className={`absolute inset-0 ${!isPlaying ? 'sound-wave-paused' : ''}`}>
                  <div className="sound-wave-ring" />
                  <div className="sound-wave-ring" />
                  <div className="sound-wave-ring" />
                  <div className="sound-wave-ring" />
                </div>

                {/* Glow Pulse Behind Art */}
                <div className={`absolute inset-4 rounded-2xl glow-pulse ${!isPlaying ? 'paused' : ''}`} />

                {/* Main Cover Art */}
                <div className={`relative aspect-square w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-white/5 group cover-breathe ${!isPlaying ? 'paused' : ''}`}>
                  <img src={currentSong.coverUrl} className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'scale-105' : 'scale-100 brightness-75'}`} alt="" />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Lyrics toggle on big art */}
                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`absolute bottom-6 right-6 p-3 rounded-full backdrop-blur-md border border-white/10 transition-all z-10 ${showLyrics ? 'bg-brand text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>

                  {/* Mini now-playing indicator on cover */}
                  {isPlaying && (
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                      <div className="mini-equalizer">
                        <div className="mini-eq-bar" />
                        <div className="mini-eq-bar" />
                        <div className="mini-eq-bar" />
                        <div className="mini-eq-bar" />
                        <div className="mini-eq-bar" />
                      </div>
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Ao Vivo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Waveform Line Under Cover ── */}
              <div className="waveform-line w-full max-w-[500px] opacity-60">
                <svg
                  className={`waveform-svg ${!isPlaying ? 'paused' : ''}`}
                  viewBox="0 0 200 60"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(158, 42, 77, 0)" />
                      <stop offset="20%" stopColor="rgba(158, 42, 77, 0.6)" />
                      <stop offset="50%" stopColor="rgba(200, 80, 120, 0.8)" />
                      <stop offset="80%" stopColor="rgba(158, 42, 77, 0.6)" />
                      <stop offset="100%" stopColor="rgba(158, 42, 77, 0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d={waveformPath}
                    fill="none"
                    stroke="url(#waveGrad)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={waveformPath.replace(/M|L/g, (m) => m)}
                    fill="none"
                    stroke="url(#waveGrad)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity="0.3"
                    transform="translate(100, 0)"
                  />
                </svg>
              </div>
            </div>

            {/* Right Column: Details & Lyrics */}
            <div className="flex flex-col gap-6 h-full justify-center py-6 md:py-10 overflow-hidden">
              {/* ALWAYS VISIBLE: Header & Metadata */}
              <div className="space-y-6 shrink-0 z-10">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight line-clamp-2 drop-shadow-lg">{currentSong.title}</h1>
                  <p className="text-xl md:text-2xl text-zinc-400 font-medium truncate">{currentSong.artist}</p>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm" title="Data de Adição">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-200 font-bold">{new Date(currentSong.dateAdded).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {currentSong.genre && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm" title="Gênero">
                      <Music2 className="w-3.5 h-3.5 text-brand-light" />
                      <span className="text-xs text-zinc-200 font-bold capitalize">{currentSong.genre}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm" title="Energia">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-zinc-200 font-bold">{Math.round(currentSong.mood.energy * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm" title="BPM">
                    <Disc className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-200 font-bold">{Math.round(currentSong.mood.tempo)} BPM</span>
                  </div>
                </div>
              </div>

              {/* CONDITIONAL CONTENT: Lyrics OR Recommendations */}
              <div className="flex-1 min-h-0 relative">
                {showLyrics ? (
                  <div className="h-full overflow-y-auto pr-4 scrollbar-thin animate-fade-in mask-image-gradient-b">
                    {/* Lyrics Content */}
                    {isGeneratingLyrics ? (
                      <div className="flex items-center gap-3 text-zinc-400 animate-pulse pt-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-bold uppercase tracking-wider">Gerando letras com IA...</span>
                      </div>
                    ) : lyrics.length > 0 ? (
                      <div className="space-y-4 pt-2 pb-10">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-950/0 backdrop-blur-none mb-2">Letra da Música</h3>
                        {lyrics.map((line, i) => (
                          <p key={i} className="text-xl md:text-2xl font-bold text-white/60 hover:text-white transition-colors cursor-default origin-left hover:scale-[1.005] duration-300 leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-4 pt-4">
                        <h3 className="text-xl font-bold text-zinc-300">Letra indisponível</h3>
                        <button onClick={generateLyrics} className="px-5 py-2 bg-brand text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-brand-light transition-all flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> Gerar com IA
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto pr-2 scrollbar-hide animate-fade-in pt-6 border-t border-white/5">
                    {moreFromArtist.length > 0 ? (
                      <>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 sticky top-0 bg-zinc-950 z-10 py-1">Mais de {currentSong.artist}</h3>
                        <div className="space-y-2 pb-4">
                          {moreFromArtist.map(s => (
                            <div key={s.id} onClick={() => onPlaySong && onPlaySong(s)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors border border-transparent hover:border-white/5">
                              <img src={s.coverUrl} className="w-12 h-12 rounded-lg object-cover opacity-70 group-hover:opacity-100 shadow-lg" alt="" />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm truncate group-hover:text-brand-light transition-colors">{s.title}</p>
                                <p className="text-xs text-zinc-500 truncate">{s.album}</p>
                              </div>
                              <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 mr-2" />
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-zinc-600 gap-3 border border-white/5 rounded-xl border-dashed">
                        <Music2 className="w-8 h-8 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sem sugestões</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Equalizer Bars at Bottom of Right Column ── */}
              <div className={`h-24 w-full rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 backdrop-blur-sm ${!isPlaying ? 'equalizer-paused' : ''}`}>
                <div className="equalizer-container">
                  {eqBars.map(i => (
                    <div key={i} className="equalizer-bar" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Mini Player / Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-player px-4 py-3 md:px-6 h-[90px] grid grid-cols-3 items-center">

          <div
            className="flex items-center gap-4 min-w-0 justify-start cursor-pointer group"
            onClick={() => {
              if (!isExpanded) onToggleExpand();
              setShowLyrics(true);
            }}
            title="Expandir e Ver Letra"
          >
            <div className="relative w-14 h-14 hidden md:block shrink-0 rounded overflow-hidden shadow-md border border-black/5 dark:border-white/5">
              <img src={currentSong.coverUrl} alt="Cover" className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`} />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronUp className="w-6 h-6 text-white" />
              </div>
              {/* Mini EQ overlay on thumbnail */}
              {isPlaying && (
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] h-3 pb-0.5 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="mini-eq-bar" style={{ width: 2, background: 'rgb(var(--brand-light-rgb))' }} />
                  <div className="mini-eq-bar" style={{ width: 2, background: 'rgb(var(--brand-light-rgb))' }} />
                  <div className="mini-eq-bar" style={{ width: 2, background: 'rgb(var(--brand-light-rgb))' }} />
                  <div className="mini-eq-bar" style={{ width: 2, background: 'rgb(var(--brand-light-rgb))' }} />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 justify-center gap-0.5 overflow-hidden">
              <h4 className="text-slate-900 dark:text-white text-sm font-semibold truncate group-hover:text-brand-light transition-colors flex items-center gap-2">
                {currentSong.title}
                {isPlaying && (
                  <div className={`mini-equalizer ${!isPlaying ? 'paused' : ''}`}>
                    <div className="mini-eq-bar" />
                    <div className="mini-eq-bar" />
                    <div className="mini-eq-bar" />
                  </div>
                )}
              </h4>
              <span className="text-xs text-slate-500 dark:text-zinc-400 truncate font-medium group-hover:text-slate-700 dark:group-hover:text-zinc-200">{currentSong.artist}</span>
            </div>
          </div>

          <div className="flex flex-col items-center max-w-[45%] w-full mx-auto">
            <div className="flex items-center gap-4 sm:gap-6 mb-2">
              <button
                onClick={onToggleShuffle}
                className={`transition-colors hover:scale-110 active:scale-95 ${isShuffle ? 'text-brand-light' : 'text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                title="Aleatório"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={onPrev}
                className="text-slate-600 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition-all duration-200 hover:scale-[1.15] active:scale-[0.9] group"
              >
                <SkipBack className="w-5 h-5 fill-current group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center transition-all duration-200 hover:scale-[1.1] active:scale-[0.98] shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={onNext}
                className="text-slate-600 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition-all duration-200 hover:scale-[1.15] active:scale-[0.9] group"
              >
                <SkipForward className="w-5 h-5 fill-current group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`transition-colors hover:scale-110 active:scale-95 ${repeatMode !== 'off' ? 'text-brand-light' : 'text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'} relative`}
                title={repeatMode === 'one' ? 'Repetir Uma' : repeatMode === 'all' ? 'Repetir Todas' : 'Não Repetir'}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            <div className="w-full flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 font-bold font-mono">
              <span className="w-10 text-right">{formatTime(isDragging ? (dragProgress / 100) * duration : currentTime)}</span>
              <div className="flex-1 relative h-1 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer group flex items-center">
                <div
                  className={`h-full bg-brand-light rounded-full transition-all group-hover:bg-slate-900 dark:group-hover:bg-white ${isPlaying ? 'progress-glow' : ''}`}
                  style={{ width: `${displayProgress}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={displayProgress}
                  onChange={handleSeekChange}
                  onMouseDown={handleSeekStart}
                  onMouseUp={handleSeekEnd}
                  onTouchStart={handleSeekStart}
                  onTouchEnd={handleSeekEnd}
                  className="absolute w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="w-10">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 md:gap-5">
            <div className="relative">
              <button
                onClick={onToggleQueue}
                title="Fila de Reprodução"
                className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-[1.1] active:scale-[0.98] ${isQueueOpen ? 'bg-brand text-white shadow-lg' : 'text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'} ${animateQueue ? 'text-brand scale-125 bg-black/5 dark:bg-white/10' : ''}`}
              >
                <ListMusic className="w-4.5 h-4.5" />
              </button>
              {queueLength > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#18181b] animate-scale-in">
                  {queueLength}
                </span>
              )}
            </div>

            <button
              onClick={() => setShowLyrics(!showLyrics)}
              title="Ver Letras (IA)"
              className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-[1.1] active:scale-[0.98] ${showLyrics && !isExpanded ? 'bg-brand text-white shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)]' : 'text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              <Sparkles className="w-4.5 h-4.5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 w-24 group/vol relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs font-bold text-white shadow-xl opacity-0 group-hover/vol:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover/vol:translate-y-0 z-50">
                {Math.round(volume * 100)}%
                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-b border-r border-white/10 rotate-45"></div>
              </div>

              <button onClick={toggleMute} className="text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="flex-1 h-1 bg-black/10 dark:bg-white/10 rounded-full relative">
                <div
                  className="h-full bg-slate-400 dark:bg-zinc-500 rounded-full group-hover/vol:bg-brand-light transition-all"
                  style={{ width: `${volume * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;