# Agentes — Camada de infraestrutura (logging)

**Módulo desta pasta:** `loggerService.ts`

## Papel desta camada

- Padronizar saída no console com prefixo por contexto (`[prefixo] mensagem`).
- Oferecer `log` (stdout) e `error` (stderr), com assinatura opcional de `Error` no segundo argumento de `error`.

## O que agentes de código devem respeitar

- Instanciar com prefixo estável e descritivo por módulo (ex.: `corner-bet-service`, `CornerBetService`) para filtrar logs em ambientes agregados.
- Evitar lógica de negócio ou side effects além de `console.log` / `console.error`.
- Se no futuro houver integração com sistemas de log estruturado, preferir estender esta classe ou introduzir um adaptador mantendo a mesma interface usada pelo restante do projeto.

## Dependências

- Nenhuma importação de outras camadas do microsserviço — esta é uma folha na árvore de dependências.
