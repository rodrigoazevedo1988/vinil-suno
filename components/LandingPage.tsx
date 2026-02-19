import React from 'react';
import { Music, Play, Layers, ShieldCheck, Zap, Disc, Sparkles, ChevronRight } from 'lucide-react';

interface LandingPageProps {
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-purple-500/30">

            {/* ─── Background Effects ─── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-900/15 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            {/* ─── Header ─── */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 backdrop-blur-sm border-b border-white/[0.05]">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Music className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Vinil Suno</span>
                </div>
                <button
                    onClick={onLoginClick}
                    className="px-6 py-2.5 text-sm font-bold bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center gap-2"
                >
                    Entrar <ChevronRight className="w-4 h-4" />
                </button>
            </header>

            {/* ─── Hero Section ─── */}
            <main className="relative z-10 pt-32 pb-20 px-6 md:px-12 flex flex-col md:flex-row items-center gap-16 max-w-7xl mx-auto min-h-screen">

                {/* Text Content */}
                <div className="flex-1 space-y-8 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-purple-300 animate-fade-in">
                        <Sparkles className="w-3 h-3" /> Nova Versão V5 Disponível
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                        Sua Música, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 animate-gradient-text">
                            Sua Vibração.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-400 max-w-lg leading-relaxed">
                        Experimente a revolução musical com IA. Crie, organize e descubra sons que definem o seu momento com a tecnologia Suno AI.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={onLoginClick}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
                        >
                            Começar Agora
                            <Play className="w-5 h-5 fill-current group-hover:scale-125 transition-transform" />
                        </button>
                        <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                            Ver Demo
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-500 pt-8 border-t border-white/5">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                    User
                                </div>
                            ))}
                        </div>
                        <p>Junte-se a +10k criadores</p>
                    </div>
                </div>

                {/* Visual Content (Vinyl Animation) */}
                <div className="flex-1 relative w-full flex justify-center perspective-[1000px]">
                    {/* Glass Card Behind */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-[3rem] blur-3xl transform rotate-6 scale-90"></div>

                    {/* Vinyl Container */}
                    <div className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px]">
                        {/* Album Cover */}
                        <div className="absolute inset-4 z-20 rounded-full shadow-2xl animate-[spin_8s_linear_infinite] overflow-hidden border-4 border-zinc-900 group cursor-pointer">
                            <img
                                src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop"
                                alt="Vinyl Cover"
                                className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700"
                            />
                            {/* Vinyl Shine */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-full"></div>
                            {/* Inner Hole */}
                            <div className="absolute inset-0 m-auto w-16 h-16 bg-black rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-inner">
                                <div className="w-4 h-4 bg-zinc-900 rounded-full"></div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-10 -right-10 p-4 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex items-center gap-3 animate-float delay-100 z-30">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 font-bold uppercase">Gerado por IA</p>
                                <p className="text-sm font-bold text-white">Suno V5</p>
                            </div>
                        </div>

                        <div className="absolute -bottom-5 -left-5 p-4 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex items-center gap-3 animate-float delay-500 z-30">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Disc className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 font-bold uppercase">Qualidade</p>
                                <p className="text-sm font-bold text-white">Hi-Fi Audio</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Features Grid ─── */}
            <section className="relative z-10 px-6 md:px-12 py-20 border-t border-white/5 bg-black/50 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-16">Tudo o que você precisa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <Disc className="w-6 h-6" />, title: "Gestão de Álbuns", desc: "Organize suas músicas em álbuns virtuais com capas personalizadas e metadados ricos." },
                            { icon: <Layers className="w-6 h-6" />, title: "Playlists Inteligentes", desc: "Crie sequências perfeitas para cada momento. O sistema sugere transições suaves." },
                            { icon: <ShieldCheck className="w-6 h-6" />, title: "Segurança Total", desc: "Seus arquivos são criptografados e armazenados com segurança máxima na nuvem." }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors group">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="relative z-10 px-6 py-12 border-t border-white/10 text-center text-zinc-600 text-sm">
                <p>&copy; {new Date().getFullYear()} Vinil Suno. Todos os direitos reservados.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a>
                    <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                    <a href="#" className="hover:text-white transition-colors">Contato</a>
                </div>
            </footer>

            {/* Custom Keyframes (if not in Tailwind) */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
        </div>
    );
};

export default LandingPage;
