# Documentação: microsserviço Corner Bet (game compact)

Este documento descreve o trabalho realizado para extrair a coleta de dados compactos do Corner Pro Bet do Strapi CMS e operá-la como **microsserviço independente**, com repositório e implantação separados.

---

## 1. Contexto e objetivo

**Antes:** existia uma tarefa agendada no Strapi (`getGameCompactDataJob`) em `config/cron-tasks.ts` que:

- Executava `CornerBetService.getGameCompactData()` (Puppeteer + login no site Corner Pro Bet e leitura do JSON em `getCompact.php`).
- Em caso de erro, enviava o erro ao Sentry via plugin do Strapi.
- Em caso de sucesso, persistia o payload no Strapi através do serviço `api::game-compact.game-compact`.

**Objetivo:** rodar essa lógica **fora do processo do Strapi**, como processo de longa duração com cron interno, enviando os dados para uma **REST API configurável** (a ser implementada ou substituída no futuro, sem acoplamento ao Strapi).

---

## 2. O que foi implementado

### 2.1 Repositório dedicado

Foi criado um **projeto Node.js/TypeScript separado** do CMS:

| Item | Caminho |
|------|---------|
| Repositório do microsserviço | `corner-bet-service` (ex.: `/home/ronaldo/AMG/corner-bet-service`) |

O código **não** fica mais dentro de `mansao-green-cms` (a pasta `services/corner-bet` foi removida do CMS após a extração).

### 2.2 Comportamento do microsserviço

1. **Execução na subida:** ao iniciar o processo, o job roda **uma vez de imediato** e essa execução **termina antes** de o agendamento cron ser registrado (reduz risco de duas execuções ao mesmo tempo se o deploy coincidir com um horário do cron).
2. **Agendamento:** `node-cron` com a mesma regra cron usada no Strapi: `0 6,12,14,20 * * *` (execuções às 06:00, 12:00, 14:00 e 20:00 no fuso configurado).
3. **Timezone:** variável de ambiente `TZ` (padrão `UTC`), alinhado ao `TZ: 'UTC'` do `config/server.ts` do Strapi.
4. **Scraping:** classe `CornerBetService` — Puppeteer com `puppeteer-extra` e plugin stealth; login com `CORNER_BET_USERNAME` / `CORNER_BET_PASSWORD`; obtenção do JSON de `getCompact.php`.
5. **Docker/Chromium:** em container, usa Chromium do sistema (`PUPPETEER_EXECUTABLE_PATH`) e flags `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`.
6. **Erros:** integração opcional com **Sentry** via SDK oficial `@sentry/node` quando `SENTRY_DSN` está definido (substitui o envio pelo plugin Strapi).
7. **Persistência externa:** envio HTTP **POST** para `GAME_COMPACT_API_URL` com corpo JSON no formato `{ "data": { "response": <payload> } }`, compatível com o modelo anterior de `create` no Strapi. Autenticação opcional: cabeçalho `Authorization: Bearer <GAME_COMPACT_API_TOKEN>`.

### 2.3 Estrutura de pastas do projeto

```
corner-bet-service/
├── src/
│   ├── entrada/
│   │   ├── index.ts        # Entrada: inicialização Sentry, agendamento cron, orquestração do job
│   │   └── agentes.md      # Orientação para agentes nesta camada
│   ├── dominio/
│   │   ├── cornerBetService.ts # Puppeteer + login + fetch do JSON
│   │   └── agentes.md
│   ├── infra-api/
│   │   ├── apiClient.ts    # HTTP (axios) para a API configurável
│   │   └── agentes.md
│   └── infra-log/
│       ├── loggerService.ts # Logs no console com prefixo
│       └── agentes.md
├── Dockerfile              # Build multi-stage + Chromium na imagem final
├── package.json
├── tsconfig.json
├── .env.example
├── .dockerignore
├── .gitignore
└── README.md
```

### 2.4 Scripts npm

| Script | Descrição |
|--------|-----------|
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa `node dist/entrada/index.js` (processo contínuo com cron) |
| `npm run dev` | `tsc` + `node dist/entrada/index.js` (útil para testes locais após build) |

### 2.5 Variáveis de ambiente (resumo)

Consulte `.env.example` no repositório. Principais:

- `CORNER_BET_USERNAME`, `CORNER_BET_PASSWORD` — credenciais do site.
- `GAME_COMPACT_API_URL` — URL do endpoint que receberá o POST (obrigatória para gravar dados).
- `GAME_COMPACT_API_TOKEN` — opcional; Bearer token.
- `SENTRY_DSN` — opcional; se ausente, erros só vão para o log.
- `TZ` — fuso para o `node-cron` (ex.: `UTC`).
- `PUPPETEER_EXECUTABLE_PATH` — em Docker, definido automaticamente para o Chromium do sistema.

### 2.6 Docker

- **Build:** estágio `node:20-slim` compila o TypeScript.
- **Runtime:** imagem final com pacote `chromium` instalado, variáveis `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` e `PUPPETEER_EXECUTABLE_PATH`, `NODE_ENV=production`, `TZ=UTC`.
- **Comando:** `node dist/entrada/index.js`.

Exemplo:

```bash
docker build -t corner-bet-service .
docker run --env-file .env corner-bet-service
```

---

## 3. Alterações no repositório `mansao-green-cms`

Para evitar duplicação e responsabilidade no CMS:

1. **`config/cron-tasks.ts`** — removida a tarefa `getGameCompactDataJob` e o import de `CornerBetService`. Permanece apenas `getFlashScoreArticlesJob` (FlashScore).
2. **`package.json` do CMS** — removido o script `service:corner-bet` que apontava para o microsserviço embutido (que deixou de existir no monorepo).

O CMS continua com `src/service/cornerBetService.ts` e o script de teste `test:corner-bet` / `scripts/run-corner-bet-test.ts` se ainda existirem no projeto — são utilitários locais ao CMS e **não** substituem o microsserviço em produção.

---

## 4. Substituições técnicas (Strapi → standalone)

| Antes (Strapi) | Depois (microsserviço) |
|----------------|-------------------------|
| Cron integrado ao Strapi | `node-cron` no próprio processo Node |
| `strapi.plugin('sentry').service('sentry').sendError(...)` | `@sentry/node` + `Sentry.captureException` (se `SENTRY_DSN`) |
| `strapi.service('api::game-compact...').create({ data: { response } })` | `axios.post(GAME_COMPACT_API_URL, { data: { response } })` |

---

## 5. Próximos passos sugeridos (fora deste documento)

- Implementar ou apontar `GAME_COMPACT_API_URL` para a API definitiva que substituirá o Strapi nesse fluxo.
- Definir segredos e deploy (Kubernetes, ECS, VM, etc.) para o container ou processo Node.
- Opcional: versionar o repositório `corner-bet-service` em um remoto Git e configurar CI (build + teste de imagem Docker).

---

## 6. Resumo em uma frase

A coleta agendada de dados compactos do Corner Pro Bet foi **extraída do Strapi**, implementada como **microsserviço TypeScript autônomo** com cron, Puppeteer, POST HTTP configurável e Sentry opcional, empacotável com **Docker**, em **repositório separado** do CMS `mansao-green-cms`.
