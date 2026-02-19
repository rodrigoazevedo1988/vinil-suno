import React, { useState } from 'react';
import { Loader2, Music, AlertCircle, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';

interface LoginPageProps {
    onLogin: (token: string, user: any) => void;
    onTerms?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onTerms }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for register
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin ? { email, password } : { name, email, password };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || (isLogin ? 'Erro ao fazer login' : 'Erro ao criar conta'));
            }

            onLogin(data.token, data.user);
        } catch (err: any) {
            setError(err.message || 'Erro de conexão');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                        <Music className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Vinil Suno</h1>
                    <p className="text-zinc-400 text-sm mt-1">Sua música, sua vibração.</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => { setIsLogin(true); setError(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <LogIn className="w-4 h-4" /> Entrar
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <UserPlus className="w-4 h-4" /> Cadastrar
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-1.5 animate-slide-up">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 pl-1">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium placeholder:text-zinc-700"
                                placeholder="Como devemos chamar você?"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 pl-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium placeholder:text-zinc-700"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 pl-1">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium placeholder:text-zinc-700 pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isLogin ? 'Entrar na Plataforma' : 'Criar Conta Grátis'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center" style={{ fontSize: '0.75rem', lineHeight: '1rem', color: 'rgb(113 113 122)' }}>
                    Ao {isLogin ? 'entrar' : 'se cadastrar'}, você concorda com nossos{' '}
                    <button
                        onClick={onTerms}
                        className="text-zinc-400 hover:text-white underline decoration-zinc-700 font-medium cursor-pointer bg-transparent border-0 p-0 inline"
                        type="button"
                    >
                        Termos de Uso
                    </button>
                    {' '}e{' '}
                    <a href="#" className="text-zinc-400 hover:text-white underline decoration-zinc-700">Privacidade</a>.
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
