import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vinil-suno-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

function generateToken(user: { id: string; name: string; email: string; role: string; avatar_url: string }) {
    return jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatar_url },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// POST /api/auth/login — Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email e senha são obrigatórios' });
            return;
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Email ou senha incorretos' });
            return;
        }

        const user = result.rows[0];

        // Check if user has a password set
        if (!user.password_hash) {
            res.status(403).json({ error: 'Conta sem senha definida. Contate o administrador.' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Email ou senha incorretos' });
            return;
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatar_url,
            },
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/auth/register — Registro (somente admin pode criar usuários)
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        // Determine role and validate permissions
        let finalRole = 'user';

        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const decoded = jwt.verify(token, JWT_SECRET) as any;

                // If authenticated as admin, allow setting any role (including admin)
                if (decoded.role === 'admin') {
                    finalRole = role || 'user';
                }
            } catch {
                // Invalid token, treat as public registration
            }
        } else {
            // Public registration (bootstrap check removed to allow signups)
            // Always force role to 'user' for public signups
            finalRole = 'user';
        }

        if (!name || !email || !password) {
            res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
            return;
        }

        // Check if email already exists
        const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'Este email já está cadastrado' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const id = crypto.randomUUID().slice(0, 12);

        await pool.query(
            `INSERT INTO users (id, name, email, password_hash, role, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, name, email, passwordHash, role || 'user', '']
        );

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatar_url,
            },
        });
    } catch (err) {
        console.error('Erro no registro:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/auth/profile — Atualizar perfil (nome, avatar)
router.put('/profile', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const { name, avatarUrl } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        await pool.query(
            'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), updated_at = NOW() WHERE id = $3',
            [name, avatarUrl, decoded.id]
        );

        const updatedResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        const user = updatedResult.rows[0];
        const newToken = generateToken(user);

        res.json({
            token: newToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatar_url,
            },
        });
    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        res.status(401).json({ error: 'Token inválido ou erro no servidor' });
    }
});

// GET /api/auth/me — Dados do usuário logado
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatar_url,
            hasPassword: !!user.password_hash,
            lastLogin: user.last_login,
        });
    } catch (err) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
});

// PUT /api/auth/password — Alterar senha
router.put('/password', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 4) {
            res.status(400).json({ error: 'Nova senha deve ter pelo menos 4 caracteres' });
            return;
        }

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        const user = result.rows[0];

        // If user already has a password, require current password
        if (user.password_hash && currentPassword) {
            const isValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValid) {
                res.status(401).json({ error: 'Senha atual incorreta' });
                return;
            }
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await pool.query(
            'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1',
            [decoded.id, newHash]
        );

        res.json({ success: true, message: 'Senha atualizada com sucesso' });
    } catch (err) {
        console.error('Erro ao alterar senha:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/auth/users/:id — Atualizar usuário (somente admin)
router.put('/users/:id', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== 'admin') {
            res.status(403).json({ error: 'Acesso não autorizado' });
            return;
        }

        const { id } = req.params;
        const { name, role, email } = req.body;

        await pool.query(
            'UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), email = COALESCE($3, email), updated_at = NOW() WHERE id = $4',
            [name, role, email, id]
        );

        res.json({ success: true, message: 'Usuário atualizado com sucesso' });
    } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// DELETE /api/auth/users/:id — Deletar usuário (somente admin)
router.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== 'admin') {
            res.status(403).json({ error: 'Acesso não autorizado' });
            return;
        }

        const { id } = req.params;
        if (id === decoded.id) {
            res.status(400).json({ error: 'Você não pode deletar a si mesmo' });
            return;
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true, message: 'Usuário removido com sucesso' });
    } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// GET /api/auth/users — Listar usuários (somente admin)
router.get('/users', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== 'admin') {
            res.status(403).json({ error: 'Acesso não autorizado' });
            return;
        }

        const result = await pool.query(
            'SELECT id, name, email, role, avatar_url, last_login, created_at FROM users ORDER BY created_at ASC'
        );

        res.json(result.rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatarUrl: u.avatar_url,
            lastLogin: u.last_login,
            createdAt: u.created_at,
        })));
    } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

export default router;
