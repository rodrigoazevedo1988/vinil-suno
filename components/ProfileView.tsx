import React, { useState, useRef } from 'react';
import {
    User, Shield, Key, Save, Eye, EyeOff, Loader2,
    CheckCircle, AlertCircle, LogOut, Crown, UserCheck, Plus, Camera, Trash2, Edit2
} from 'lucide-react';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string;
}

interface ProfileViewProps {
    user: UserProfile;
    token: string;
    onLogout: () => void;
    onUpdateAuth: (token: string, user: UserProfile) => void;
}

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, token, onLogout, onUpdateAuth }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'users'>('profile');
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Profile Edit
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingName, setEditingName] = useState(user.name);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // User management (admin only)
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showNewUser, setShowNewUser] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    // ─── Profile Logic ──────────────────────────────────────────────
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Selecione apenas arquivos de imagem', 'error');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload image
            const uploadRes = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Falha no upload da imagem');
            const uploadData = await uploadRes.json();
            const newAvatarUrl = uploadData.url;

            // 2. Update profile
            const updateRes = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatarUrl: newAvatarUrl })
            });

            if (!updateRes.ok) throw new Error('Falha ao atualizar perfil');
            const updateData = await updateRes.json();

            onUpdateAuth(updateData.token, updateData.user);
            showToast('Avatar atualizado com sucesso!');
        } catch (err: any) {
            showToast(err.message || 'Erro ao atualizar avatar', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveName = async () => {
        if (!editingName.trim()) return;
        if (editingName === user.name) return;

        setIsSavingProfile(true);
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: editingName })
            });

            if (!response.ok) throw new Error('Erro ao salvar nome');
            const data = await response.json();

            onUpdateAuth(data.token, data.user);
            showToast('Nome atualizado com sucesso!');
        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ─── Password Logic ─────────────────────────────────────────────
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 4) {
            showToast('Nova senha deve ter pelo menos 4 caracteres', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('As senhas não conferem', 'error');
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            showToast('Senha atualizada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            showToast(err.message || 'Erro ao alterar senha', 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // ─── Users Logic (Admin) ────────────────────────────────────────
    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await fetch('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Sem permissão');
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            showToast('Erro ao carregar usuários', 'error');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail || !newUserPassword) return;

        setIsCreatingUser(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newUserName,
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast(`Usuário "${newUserName}" criado com sucesso!`);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('user');
            setShowNewUser(false);
            loadUsers();
        } catch (err: any) {
            showToast(err.message || 'Erro ao criar usuário', 'error');
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return;

        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao deletar');

            showToast('Usuário removido');
            loadUsers();
        } catch (err) {
            showToast('Erro ao remover usuário', 'error');
        }
    };

    const roleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Admin Master';
            case 'user': return 'Usuário';
            default: return role;
        }
    };

    const roleBadge = (role: string) => {
        if (role === 'admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                    <Crown className="w-3 h-3" /> Admin Master
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                <UserCheck className="w-3 h-3" /> Usuário
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Toast Notifications */}
            <div className="fixed top-6 right-6 z-50 space-y-2">
                {toasts.map(toast => (
                    <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm backdrop-blur-xl shadow-2xl animate-slide-in border ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-8">
                <div className="flex items-center gap-5">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border-2 border-white/10">
                                <span className="text-3xl font-black text-white">{user.name.charAt(0)}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-white tracking-tight">{user.name}</h2>
                            <button
                                onClick={() => document.getElementById('name-input')?.focus()}
                                className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-zinc-500 text-sm">{user.email}</p>
                        <div className="mt-2">{roleBadge(user.role)}</div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-5 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all border border-red-500/10 hover:border-red-500/20"
                >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                >
                    <User className="w-4 h-4" />
                    Perfil
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'security' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                >
                    <Key className="w-4 h-4" />
                    Segurança
                </button>
                {user.role === 'admin' && (
                    <button
                        onClick={() => { setActiveTab('users'); loadUsers(); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                    >
                        <Shield className="w-4 h-4" />
                        Usuários
                    </button>
                )}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 space-y-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-6 w-full">
                            <h3 className="text-lg font-bold text-white mb-4">Informações Pessoais</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="name-input"
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="flex-1 bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
                                        />
                                        {editingName !== user.name && (
                                            <button
                                                onClick={handleSaveName}
                                                disabled={isSavingProfile}
                                                className="px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[3rem]"
                                            >
                                                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                                    <div className="px-4 py-3 bg-white/[0.03] rounded-xl text-zinc-400 border border-white/[0.06] cursor-not-allowed select-none font-medium">
                                        {user.email} <span className="text-[10px] ml-2 opacity-50 uppercase tracking-wider">(Não editável)</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Função</label>
                                    <div className="px-4 py-3 bg-white/[0.03] rounded-xl text-white border border-white/[0.06] opacity-80">{roleLabel(user.role)}</div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">ID</label>
                                    <div className="px-4 py-3 bg-white/[0.03] rounded-xl text-zinc-500 border border-white/[0.06] font-mono text-sm">{user.id}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-purple-400" />
                        Alterar Senha
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Senha Atual</label>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50 pr-12"
                                    placeholder="Senha atual"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nova Senha</label>
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                                placeholder="Mínimo 4 caracteres"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Confirmar Nova Senha</label>
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className={`w-full bg-white/[0.04] border px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500/50' : 'border-white/[0.08]'
                                    }`}
                                placeholder="Repita a nova senha"
                                required
                            />
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-red-400 text-xs font-medium">As senhas não conferem</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isChangingPassword ? 'Salvando...' : 'Alterar Senha'}
                        </button>
                    </form>
                </div>
            )}

            {/* Users Tab (Admin only) */}
            {activeTab === 'users' && user.role === 'admin' && (
                <div className="space-y-6">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-amber-400" />
                                Gerenciar Usuários
                            </h3>
                            <button
                                onClick={() => setShowNewUser(!showNewUser)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-300 rounded-xl font-bold text-xs hover:bg-purple-600/30 transition-all border border-purple-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Usuário
                            </button>
                        </div>

                        {/* Create User Form */}
                        {showNewUser && (
                            <form onSubmit={handleCreateUser} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-4 animate-slide-in">
                                <h4 className="text-sm font-bold text-white">Criar Novo Usuário</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome</label>
                                        <input
                                            value={newUserName}
                                            onChange={e => setNewUserName(e.target.value)}
                                            className="w-full bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 rounded-lg text-white outline-none text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                                        <input
                                            type="email"
                                            value={newUserEmail}
                                            onChange={e => setNewUserEmail(e.target.value)}
                                            className="w-full bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 rounded-lg text-white outline-none text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Senha</label>
                                        <input
                                            type="text"
                                            value={newUserPassword}
                                            onChange={e => setNewUserPassword(e.target.value)}
                                            className="w-full bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 rounded-lg text-white outline-none text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Função</label>
                                        <select
                                            value={newUserRole}
                                            onChange={e => setNewUserRole(e.target.value)}
                                            className="w-full bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 rounded-lg text-white outline-none text-sm"
                                        >
                                            <option value="user" className="bg-zinc-900">Usuário</option>
                                            <option value="admin" className="bg-zinc-900">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isCreatingUser}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-500 disabled:opacity-50"
                                    >
                                        {isCreatingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Criar
                                    </button>
                                    <button type="button" onClick={() => setShowNewUser(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-xs font-bold">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Users List */}
                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-zinc-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Carregando...</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between px-5 py-4 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-cyan-600/30 flex items-center justify-center border border-white/10 overflow-hidden">
                                                {u.avatarUrl ? (
                                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-black text-white">{u.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{u.name}</div>
                                                <div className="text-xs text-zinc-500">{u.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {roleBadge(u.role)}
                                            {user.id !== u.id && (
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remover usuário"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;
