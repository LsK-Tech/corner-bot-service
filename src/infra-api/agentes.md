# Agentes — Camada de infraestrutura (cliente HTTP)

**Módulo desta pasta:** `apiClient.ts`

## Papel desta camada

- Enviar o payload compacto para o endpoint configurado em `GAME_COMPACT_API_URL`.
- Corpo da requisição: `{ data: { response: <payload> } }`, espelhando o formato usado anteriormente no Strapi para facilitar migração.
- Autenticação opcional: cabeçalho `Authorization: Bearer <GAME_COMPACT_API_TOKEN>` quando o token estiver definido.
- Usar `axios` com timeout de 120 segundos e `validateStatus` restrito a 2xx.

## O que agentes de código devem respeitar

- A implementação atual usa **PUT** para a URL configurada; ao alinhar com documentação ou consumidores, verificar se o verbo HTTP deve permanecer PUT ou ser trocado — qualquer mudança exige atualização coordenada do consumidor da API e da documentação em `docs/DOCUMENTACAO.md` se ainda mencionar apenas POST.
- Falta de `GAME_COMPACT_API_URL` deve continuar resultando em erro explícito antes da rede.
- Não acoplar esta função a Puppeteer, cron ou Sentry; apenas HTTP + env.

## Variáveis de ambiente relevantes

- `GAME_COMPACT_API_URL` — obrigatória para envio bem-sucedido.
- `GAME_COMPACT_API_TOKEN` — opcional.
