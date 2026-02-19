---
description: Como realizar o deploy em produção do Vinil Suno
---

### 🚀 Processo de Deploy em Produção

Este fluxo automatiza ou guia o deploy da aplicação.

#### 1. Preparação Local
Valide se o build está funcionando antes de enviar.

// turbo
`docker compose build --no-cache`

#### 2. Empacotamento
Gere o pacote `.tar.gz` contendo apenas o necessário.

// turbo
`bash deploy.sh`

#### 3. Upload e Execução Remota (Automação)
Se você tem as credenciais da VPS, use o script para enviar e deployar em um comando:

`bash deploy.sh usuario@ip-da-vps /opt/vinil-suno`

#### 4. Verificação de Saúde
Após o deploy, verifique o estado dos containers.

// turbo-all
`docker compose ps`

Se houver erros, verifique os logs:
`docker compose logs -f app`

---
**Documentação completa disponível em: `DEPLOYMENT.md`**
