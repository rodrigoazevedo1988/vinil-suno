# 🚀 Vinil Suno — Plano de Migração para VPS

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────┐
│                    NGINX (80/443)                │
│              Reverse Proxy + SSL                 │
├──────────────────┬──────────────────────────────┤
│   Frontend       │        Backend API            │
│   (Vite Build)   │    (Node.js/Express)          │
│   Static Files   │    porta interna: 3001        │
│   /              │    /api/*                      │
├──────────────────┴──────────────────────────────┤
│              PostgreSQL (5432)                    │
│              + uploads/ em disco                  │
└─────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos Criados

```
vinil-suno/
├── backend/                     # API Node.js/Express
│   ├── package.json
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   ├── db.ts                # Pool de conexão PostgreSQL
│   │   ├── routes/
│   │   │   ├── songs.ts         # CRUD /api/songs
│   │   │   ├── playlists.ts     # CRUD /api/playlists
│   │   │   └── upload.ts        # Upload de arquivos
│   │   └── seed.ts              # Seed inicial do banco
│   ├── Dockerfile
│   └── tsconfig.json
├── docker-compose.yml           # VPS: Postgres + API + Nginx
├── nginx/
│   └── default.conf             # Config de proxy reverso
├── deploy.sh                    # Script de deploy na VPS
├── .env.production              # Variáveis de ambiente para VPS
└── (frontend existente)         # Adaptado para usar /api/*
```

---

## Fases do Plano

### ✅ Fase 1: Backend API (Express + PostgreSQL)
- CRUD completo de songs e playlists
- Upload de MP3 e imagens para disco (`/uploads/`)
- Servir arquivos estáticos de upload
- **Roda localmente na porta 5043**

### ✅ Fase 2: Frontend Adaptado
- Substituir `localStorage` por chamadas `fetch` à API
- Substituir `MOCK_USER` por dados simples (sem auth por enquanto)
- Player usa URLs reais vindas do backend

### ✅ Fase 3: Docker + Deploy VPS
- `docker-compose.yml` com Postgres + API + Nginx
- Frontend buildado e servido pelo Nginx
- Script `deploy.sh` para enviar e subir na VPS

### 🔲 Fase 4 (Futuro): Autenticação JWT
- Implementar quando necessário

---

## Como Rodar Localmente (Porta 5043)

### Pré-requisitos
- Node.js 18+
- PostgreSQL instalado e rodando
- Criar banco `vinilsuno` no seu Postgres local

### Passos

```bash
# 1. Criar o banco de dados
psql -U postgres -c "CREATE DATABASE vinilsuno;"

# 2. Instalar dependências do backend
cd backend
npm install

# 3. Configurar .env (já criado)
# Edite backend/.env se necessário (porta do Postgres, senha, etc.)

# 4. Rodar o backend (porta 5043)
npm run dev

# 5. Em outro terminal, rodar o frontend (porta 3000)
cd ..
npm run dev
```

O frontend vai fazer proxy das chamadas `/api/*` para `localhost:5043`.

---

## Como Fazer Deploy na VPS

```bash
# 1. Gerar o pacote de deploy
./deploy.sh

# 2. Enviar para a VPS
scp vinil-suno-deploy.tar.gz user@sua-vps:/opt/

# 3. Na VPS, extrair e subir
ssh user@sua-vps
cd /opt
tar -xzf vinil-suno-deploy.tar.gz
cd vinil-suno-deploy
docker compose up -d
```

---
*Gerado para o projeto Vinil Suno — Migração Full-Stack*
