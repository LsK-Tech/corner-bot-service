# Agentes — Camada de domínio (scraping Corner Pro Bet)

**Módulo desta pasta:** `cornerBetService.ts`

## Papel desta camada

- Abstrair a coleta de dados compactos no site Corner Pro Bet via Puppeteer (`puppeteer-extra` + plugin stealth).
- Lançar/configurar Chromium com opções adequadas a container (`--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`) e `PUPPETEER_EXECUTABLE_PATH` quando definido.
- Fluxo: viewport → verificação/login → `getCompact.php` → parse JSON da resposta HTTP.
- Em erro: screenshot em `/tmp/corner_bet_screenshot.png`, retorno com `exception` no tipo `GameCompactData` (não propagar throw obrigatório para o chamador além do contrato atual).

## O que agentes de código devem respeitar

- Seletores CSS do login estão acoplados ao markup atual do site; qualquer mudança no Corner Pro Bet exige revisão aqui, não na camada de entrada.
- URLs hardcoded (`cornerprobet.com/pt/login`, `.../getCompact.php`) são parte do domínio deste serviço — documentar mudanças na documentação geral se alteradas.
- Não importar `apiClient` ou lógica de cron nesta classe; manter responsabilidade única de “obter o JSON + metadados de falha”.
- Usar `LoggerService` com prefixo `CornerBetService` para consistência nos logs.

## Tipos e contrato

- `GameCompactData`: `screenshotPath`, opcionalmente `data` (payload JSON) ou `exception`.
- `getGameCompactData()` é o ponto de extensão principal para novos passos de automação (desde que não misture envio HTTP).

## Variáveis de ambiente relevantes

- `CORNER_BET_USERNAME`, `CORNER_BET_PASSWORD`
- `PUPPETEER_EXECUTABLE_PATH`
