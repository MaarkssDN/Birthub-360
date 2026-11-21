De: 24 — Revisão Independente (achado repassado pelo 00)
Para: 00 — Coordenador
Onda: review-20261119
Status: resolvido
Prioridade: alto
Bloqueador-ref: parecer 24 do PR #415 — `.agents/reviews/24-revisao-pr415-p0-security-extract.md`
Sprint destino: próxima onda de segurança

## Problema

A guarda anti-bypass design-lab adicionada em `src/bootstrap/frontend.ts` (PR #415) protege
`/design-lab/**` e aliases (`/public/design-lab`, `/@fs`, case-insensitive, encoding).
O Agente 24 identificou que **`/tools` tem exatamente o mesmo desenho de mounts autenticados
e provavelmente o mesmo bypass por alias/encoding** — mesma classe de vulnerabilidade P0.

## Arquivo(s) envolvido(s)

- `src/bootstrap/frontend.ts` (guarda existente — referência do padrão)
- mounts de `/tools` no mesmo arquivo ou `server.ts`/bootstrap correspondente

## Evidência

Parecer 24 PR #415: "`/tools` tem exatamente o mesmo desenho de mounts autenticados e
provavelmente o mesmo bypass por alias/encoding — recomendo handoff ao 00 para estender a
guarda ou confirmar que não há ativos sensíveis equivalentes."

## Alteração necessária

1. Mapear o que `/tools` monta e se expõe ativos sensíveis equivalentes ao design-lab.
2. Se sim: estender a guarda `isBlockedDesignLabPath` (ou generalizar para predicado de
   rotas internas sensíveis) cobrindo `/tools` e aliases — com teste supertest equivalente.
3. Se não houver ativo sensível: registrar justificativa e fechar.

## Teste esperado

- Requisições a aliases/encoding de `/tools` → 404 antes dos estáticos (se aplicável).
- `tests/unit/bootstrap/frontend.test.ts` estendido com os novos casos.

## Contexto adicional

- Dono provável da execução: 01 (Plataforma/Segurança) ou 15 (Segurança Aplicada);
  `src/bootstrap/**` — escalar ao 00 para designação se necessário.
- Não bloqueia o merge do #415 (achado é follow-up, não defeito do diff).

## Resolução (Agente 99 / 20 — 2026-11-20)

- Em `src/bootstrap/frontend.ts`, foi adicionada `isBlockedToolsPath(rawPath)` (mantendo `isBlockedDesignLabPath` exportada para compatibilidade) e conectada ao middleware de guarda no topo de `mountFrontend`.
- Qualquer alias/encoding não autorizado para `/tools` (`/public/tools/...`, `/@fs/.../public/tools/...`, `/tools%2F...`, `/%74ools/...`, `/foo/tools/...`, `/PUBLIC/tools/...`) recebe HTTP 404 antes dos estáticos/Vite, preservando o prefixo legítimo `/tools` (e `/tools/...`), que segue para o mount autenticado, bem como módulos de código-fonte legítimos sob `/src/` (`/src/features/intelligence/tools/**`, `/src/features/prospecting/components/prospecting-hub/tools/**`, `/src/lib/ai/tools/**`).
- `tests/unit/bootstrap/frontend.test.ts` foi estendido com suíte unitária de `isBlockedToolsPath` e testes `supertest` de `mountFrontend` validando 404 para aliases/encodings de `/tools` e 200 (pass-through) para `/tools/x` e módulos `/src/**`.
