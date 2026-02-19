<div align="center">

<br />

<img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />

<br /><br />

# 🎵 Vinil Suno

### *Sua plataforma pessoal de streaming de música com IA*

Uma aplicação full-stack premium para gerenciar, reproduzir e descobrir músicas produzidas com [Suno AI](https://suno.com). Interface moderna com glassmorphism, equalizer visual, letras geradas por IA e muito mais.

<br />

[✨ Features](#-features) · [🚀 Quick Start](#-quick-start) · [📦 Deploy](#-deploy-produção) · [🏗️ Arquitetura](#%EF%B8%8F-arquitetura) · [📡 API](#-api-reference)

<br />

---

</div>

<br />

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎧 Player Premium
- Reprodução completa com controles avançados
- Fila de reprodução com drag & reorder
- Modos: Shuffle, Repeat One, Repeat All
- Barra de progresso interativa com glow
- Controle de volume com tooltip visual
- **Equalizer animado** com 32 barras
- **Ondas sonoras pulsantes** na capa do álbum
- **Partículas flutuantes** e orbes de gradiente
- **Waveform SVG** em tempo real

</td>
<td width="50%">

### 🤖 Inteligência Artificial
- **Geração de letras** com Google Gemini
- Análise automática de mood (energia, valência, tempo)
- Categorização inteligente por gênero
- Moods dinâmicos com filtragem automática

</td>
</tr>
<tr>
<td width="50%">

### 📻 Rádio Online
- Stream contínuo de músicas
- Simulação de rádio FM com estética retro
- Fila automática baseada em playlist "Rádio"
- Fallback inteligente para músicas aleatórias

</td>
<td width="50%">

### 🔒 Privacidade & Segurança
- **Favoritos per-user** (cada usuário vê os seus)
- Playlists privadas (flag `isPublic`)
- Autenticação JWT com bcrypt
- Música para automaticamente ao fazer logout
- Ownership check em edições de playlist

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Design Premium
- **Glassmorphism** em todos os componentes
- Tema **Claro** e **Escuro** com transição suave
- Moods visuais dinâmicos (gradientes por gênero)
- Micro-animações em hover, scale e fade
- Layout responsivo (mobile-first)

</td>
<td width="50%">

### 📂 Gerenciamento (CMS)
- Upload de MP3 e imagens de capa
- Extração automática de metadados (ID3 tags)
- CRUD completo de músicas e playlists
- Configuração de mood metadata
- Definir playlists como públicas/privadas

</td>
</tr>
</table>

<br />

---

<br />

## 🏗️ Arquitetura

```
vinil-suno/
├── 🎨 Frontend (React + Vite + TypeScript)
│   ├── App.tsx                    # Componente raiz, roteamento, state global
│   ├── index.tsx                  # Entry point
│   ├── index.css                  # Animações visuais (equalizer, partículas)
│   ├── index.html                 # HTML base + glass styles + Tailwind CDN
│   ├── types.ts                   # Interfaces TypeScript
│   ├── constants.ts               # Mood categories e constantes
│   ├── vite.config.ts             # Configuração Vite + proxy
│   │
│   ├── components/
│   │   ├── Player.tsx             # Player expandido + bottom bar + equalizer
│   │   ├── Sidebar.tsx            # Navegação lateral com glass effect
│   │   ├── Header.tsx             # Busca, notificações, tema, perfil
│   │   ├── MusicCard.tsx          # Card de música (grid view)
│   │   ├── SongListTable.tsx      # Tabela de músicas (list view)
│   │   ├── PlaylistCard.tsx       # Card de playlist
│   │   ├── PlaylistView.tsx       # Detalhe de playlist
│   │   ├── PlaylistListTable.tsx  # Tabela de playlists
│   │   ├── QueueList.tsx          # Fila de reprodução
│   │   ├── SongContextMenu.tsx    # Menu de contexto (right-click)
│   │   ├── CMSView.tsx            # Painel admin/CMS
│   │   ├── RadioView.tsx          # Interface da rádio
│   │   ├── RetroRadio.tsx         # Animação retro da rádio
│   │   ├── ProfileView.tsx        # Perfil do usuário
│   │   ├── LoginPage.tsx          # Tela de login
│   │   ├── LandingPage.tsx        # Landing page pública
│   │   └── TermsView.tsx          # Termos de uso
│   │
│   ├── services/
│   │   └── api.ts                 # Camada de abstração HTTP
│   │
│   └── utils/
│       └── theme.ts               # Background manager + mood themes
│
├── ⚙️ Backend (Express + PostgreSQL)
│   └── backend/
│       └── src/
│           ├── index.ts           # Servidor Express + static serving
│           ├── db.ts              # Pool PostgreSQL + init tables + migrations
│           ├── seed.ts            # Dados iniciais para desenvolvimento
│           └── routes/
│               ├── songs.ts       # CRUD músicas + favoritos per-user
│               ├── playlists.ts   # CRUD playlists + ownership
│               ├── auth.ts        # Login, registro, JWT
│               ├── upload.ts      # Upload MP3 + imagens (multer)
│               ├── radio.ts       # Stream de rádio + fila
│               └── stats.ts       # Estatísticas do sistema
│
├── 🐳 Docker
│   ├── Dockerfile                 # Multi-stage: build → production
│   ├── docker-compose.yml         # PostgreSQL + App + Nginx
│   └── nginx/
│       └── default.conf           # Reverse proxy + cache
│
└── 🚀 Deploy
    └── deploy.sh                  # Script de empacotamento para VPS
```

<br />

---

<br />

## 🚀 Quick Start

### Pré-requisitos

| Ferramenta | Versão Mínima |
|:-----------|:-------------|
| Node.js    | 20+          |
| Docker     | 24+          |
| Docker Compose | 2.20+   |

### 1. Clone e Configure

```bash
git clone https://github.com/seu-user/vinil-suno.git
cd vinil-suno
```

### 2. Variáveis de Ambiente

Crie o arquivo `.env` na raiz:

```env
# ─── Database ──────────────────────────
DB_NAME=vinilsuno
DB_USER=postgres
DB_PASSWORD=sua_senha_segura

# ─── App ───────────────────────────────
APP_PORT=5043
BASE_URL=http://localhost:5043

# ─── Gemini AI (para letras) ──────────
GEMINI_API_KEY=sua_chave_gemini
```

### 3. Subir com Docker

```bash
docker compose up -d --build
```

A aplicação estará disponível em:
- 🌐 **App**: http://localhost:8088
- 📡 **API**: http://localhost:5043/api
- 💾 **Health**: http://localhost:5043/api/health

### 4. Desenvolvimento Local (sem Docker)

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
npm install
npm run dev
```

O Vite proxy encaminha `/api` → `localhost:5043` automaticamente.

<br />

---

<br />

## 📡 API Reference

### 🎵 Songs

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `GET` | `/api/songs?userId=xxx` | Listar todas (favoritos per-user) |
| `GET` | `/api/songs/:id` | Buscar por ID |
| `POST` | `/api/songs` | Criar nova música |
| `PUT` | `/api/songs/:id` | Atualizar música |
| `PATCH` | `/api/songs/:id/favorite` | Toggle favorito (`{ userId }`) |
| `DELETE` | `/api/songs/:id` | Deletar música |

### 📂 Playlists

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `GET` | `/api/playlists?userId=xxx` | Listar (públicas + do usuário) |
| `GET` | `/api/playlists/:id` | Buscar por ID |
| `POST` | `/api/playlists` | Criar playlist |
| `PUT` | `/api/playlists/:id` | Atualizar playlist |
| `DELETE` | `/api/playlists/:id` | Deletar playlist |

### 🔐 Auth

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/api/auth/register` | Registro de usuário |
| `POST` | `/api/auth/login` | Login (retorna JWT) |
| `GET` | `/api/auth/me` | Perfil do usuário logado |
| `PUT` | `/api/auth/profile` | Atualizar perfil |

### 📤 Upload

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/api/upload/audio` | Upload MP3 (multipart) |
| `POST` | `/api/upload/image` | Upload imagem de capa |

### 📻 Radio

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `GET` | `/api/radio/status` | Status da rádio |
| `GET` | `/api/radio/stream` | Stream de áudio |
| `POST` | `/api/radio/skip` | Pular música atual |

<br />

---

<br />

## 📦 Deploy (Produção)

### Deploy para VPS

```bash
# 1. Gerar pacote de deploy
bash deploy.sh

# 2. Ou enviar direto para VPS
bash deploy.sh user@ip-da-vps /opt/vinil-suno
```

### Na VPS:

```bash
cd /opt/vinil-suno
nano .env          # Configure suas variáveis
docker compose up -d --build
```

### Nginx (produção com SSL)

```nginx
server {
    listen 443 ssl;
    server_name vinilsuno.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/vinilsuno.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vinilsuno.seudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

<br />

---

<br />

## 🗄️ Banco de Dados

### Schema Principal

```sql
── users           # Autenticação e perfis
── songs           # Biblioteca musical completa
── playlists       # Coleções com owner + visibilidade
── playlist_songs  # Relação N:N (playlist ↔ songs)
── user_favorites  # Favoritos per-user (privacidade)
```

### Diagrama de Relações

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   users     │     │  user_favorites   │     │    songs    │
│─────────────│     │──────────────────│     │─────────────│
│ id (PK)     │◄────│ user_id (FK)     │     │ id (PK)     │
│ name        │     │ song_id (FK)     │────►│ title       │
│ email       │     │ created_at       │     │ artist      │
│ password    │     └──────────────────┘     │ audio_url   │
│ role        │                              │ cover_url   │
└──────┬──────┘     ┌──────────────────┐     │ duration    │
       │            │  playlist_songs   │     │ genre       │
       │            │──────────────────│     │ mood_*      │
       │            │ playlist_id (FK) │     └──────┬──────┘
       │            │ song_id (FK)     │────────────┘
       │            │ position         │
       │            └────────┬─────────┘
       │                     │
       │            ┌────────┴─────────┐
       └───────────►│    playlists     │
                    │──────────────────│
                    │ id (PK)          │
                    │ name             │
                    │ owner_id (FK)    │
                    │ is_public        │
                    └──────────────────┘
```

<br />

---

<br />

## 🎨 Efeitos Visuais

O player expandido conta com efeitos visuais dinâmicos, todos implementados com CSS puro e controlados pelo estado de reprodução:

| Efeito | Descrição |
|:-------|:----------|
| 🔊 Sound Wave Rings | 4 anéis concêntricos que pulsam a partir da capa |
| 📊 Equalizer Bars | 32 barras animadas com gradiente rosa-carmesim |
| ✨ Floating Particles | 20 partículas com trajetórias aleatórias |
| 🌈 Ambient Orbs | 3 orbes de gradiente flutuando no fundo |
| 💫 Glow Pulse | Brilho pulsante atrás da capa do álbum |
| 🌊 Waveform SVG | Linha de onda animada com scroll horizontal |
| 🎚️ Mini Equalizer | Indicador na barra inferior e thumbnail |
| ⚡ Progress Glow | Efeito luminoso no ponto de progresso |

> Todas as animações **pausam automaticamente** quando a música é pausada, e **retomam** suavemente ao dar play.

<br />

---

<br />

## 🧩 Tech Stack

<table>
<tr>
<td align="center" width="140">

**Frontend**

</td>
<td>

`React 19` · `TypeScript 5.8` · `Vite 6` · `Tailwind CSS (CDN)` · `Lucide Icons` · `Google Gemini AI`

</td>
</tr>
<tr>
<td align="center">

**Backend**

</td>
<td>

`Express 4` · `PostgreSQL 16` · `JWT` · `bcryptjs` · `Multer` · `node-pg`

</td>
</tr>
<tr>
<td align="center">

**Infra**

</td>
<td>

`Docker` · `Docker Compose` · `Nginx` · `FFmpeg (rádio)` · `Node 20 Alpine`

</td>
</tr>
</table>

<br />

---

<br />

## 📝 Scripts Disponíveis

```bash
# ── Frontend ──────────────────────
npm run dev          # Dev server (Vite, porta 3078)
npm run build        # Build production → dist/
npm run preview      # Preview do build local

# ── Backend ───────────────────────
cd backend
npm run dev          # Dev com hot-reload (tsx watch)
npm run build        # Compilar TypeScript → dist/
npm run start        # Iniciar em produção
npm run seed         # Popular banco com dados iniciais

# ── Docker ────────────────────────
docker compose up -d --build        # Build e subir tudo
docker compose down                  # Parar tudo
docker compose logs -f app           # Ver logs do app

# ── Deploy ────────────────────────
bash deploy.sh                       # Gerar pacote
bash deploy.sh user@vps             # Gerar + enviar
```

<br />

---

<br />

<div align="center">

### Feito com 🎵 por **Rodrigo's Productions**

<sub>Powered by React · Express · PostgreSQL · Docker · Gemini AI</sub>

<br /><br />

</div>
