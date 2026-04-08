# corner-bet-service

Microsserviço standalone que agenda a coleta de dados compactos do Corner Pro Bet (Puppeteer) e envia o resultado para uma REST API configurável.

## Requisitos

- Node.js 18–22
- Variáveis em `.env` (copie de `.env.example`)

## Uso local

```bash
npm install
npm run build
npm start
```

## Docker

```bash
docker build -t corner-bet-service .
docker run --env-file .env corner-bet-service
```

Cron padrão: `0 6,12,14,20 * * *` (timezone via `TZ`, padrão `UTC`).

Documentação completa (contexto, migração a partir do Strapi e alterações no CMS): [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md).
