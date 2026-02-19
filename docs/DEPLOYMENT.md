# 🎵 Vinil Suno — Guia de Deploy (Produção)

Este documento descreve os procedimentos necessários para realizar o deploy da aplicação em ambiente de produção (VPS) utilizando Docker.

## 📋 Pré-requisitos
- Docker e Docker Compose instalados na VPS.
- Acesso SSH ao servidor.
- Domínio configurado apontando para o IP da VPS (opcional, mas recomendado).

## 🚀 Passo a Passo do Deploy

### 1. Gerar o Pacote de Deploy
O projeto utiliza um script (`deploy.sh`) que automatiza a coleta de arquivos necessários, ignorando arquivos de desenvolvimento e `node_modules`.

**Executar localmente:**
```bash
bash deploy.sh
```
Isso gerará o arquivo `vinil-suno-deploy.tar.gz` na raiz do projeto.

### 2. Enviar para a VPS
Você pode enviar o arquivo manualmente via SCP ou usar a automação do script.

**Opção Automática:**
```bash
# bash deploy.sh <user@ip> <diretorio_destino>
bash deploy.sh root@123.456.78.90 /opt/vinil-suno
```

**Opção Manual:**
```bash
scp vinil-suno-deploy.tar.gz root@123.456.78.90:/tmp/
```

### 3. Configuração no Servidor
Após o envio, conecte-se à VPS e siga:

```bash
# Vá para o diretório de destino
cd /opt/vinil-suno

# Se enviou manualmente, extraia o arquivo:
# tar -xzf /tmp/vinil-suno-deploy.tar.gz --strip-components=1

# Configure as variáveis de ambiente (use o .env.example como base)
cp .env.example .env
nano .env # Altere BASE_URL e chaves secretas
```

### 4. Inicialização dos Containers
Execute o comando abaixo para buildar as imagens e subir os serviços:

```bash
docker compose up -d --build
```

---

## 🛠️ Comandos de Manutenção

| Objetivo | Comando |
| :--- | :--- |
| **Verificar Status** | `docker compose ps` |
| **Ver Logs da App** | `docker compose logs -f app` |
| **Reiniciar Tudo** | `docker compose restart` |
| **Atualizar Imagens** | `docker compose pull && docker compose up -d` |
| **Limpar Recursos** | `docker system prune -f` |

## ⚠️ Observações para IAs e Desenvolvedores
- **Frontend Build**: O build do React (Vite) ocorre dentro do container Docker durante a fase de build da imagem `app`.
- **Backend Build**: O backend (TypeScript) também é compilado dentro do container.
- **Nginx**: Atua como proxy reverso gerenciando a porta 80 do container para a porta pública configurada.
- **Persistência**: O banco de dados Postgres utiliza volumes (`pgdata`) para garantir que os dados não sejam perdidos ao reiniciar os containers.
- **Uploads**: Arquivos de áudio e imagem são salvos no volume `uploads`.

---
*Atualizado em: 19 de Fevereiro de 2026*
