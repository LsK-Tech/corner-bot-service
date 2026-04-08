# Agentes — Camada de entrada e orquestração

**Módulo desta pasta:** `index.ts`

## Papel desta camada

- Carregar variáveis de ambiente (`dotenv`).
- Inicializar observabilidade de erros (Sentry) quando `SENTRY_DSN` estiver definido.
- Na subida do processo, **aguardar uma execução completa** do job (`await runGetGameCompactDataJob`); só depois registrar o `node-cron` (evita sobreposição com um tick do cron no mesmo instante).
- Agendar repetições com `node-cron` (`CRON_RULE`: `0 6,12,14,20 * * *`, timezone `TZ`, padrão `UTC`).
- Orquestrar o fluxo: validar credenciais → `CornerBetService.getGameCompactData()` → `postGameCompact()` em caso de sucesso.
- Centralizar envio de exceções ao Sentry via `captureException`.

## O que agentes de código devem respeitar

- Não duplicar regras de negócio de scraping aqui; delegar sempre ao `CornerBetService`.
- Manter o contrato com a API externa apenas através de `postGameCompact` (camada `infra-api`).
- Alterações na expressão cron ou no fuso devem permanecer alinhadas ao comportamento documentado em `docs/DOCUMENTACAO.md` e `README.md`.
- Jobs agendados devem usar `void runGetGameCompactDataJob()` (ou equivalente) para não deixar promises rejeitadas sem tratamento no callback do cron.

## Dependências diretas

- `../infra-api/apiClient` — envio do payload.
- `../dominio/cornerBetService` — obtenção dos dados.
- `../infra-log/loggerService` — logs com prefixo `corner-bet-service`.

## Variáveis de ambiente relevantes

- `CORNER_BET_USERNAME`, `CORNER_BET_PASSWORD` — obrigatórias para executar o job.
- `SENTRY_DSN`, `NODE_ENV` — Sentry.
- `TZ` — timezone do cron.
