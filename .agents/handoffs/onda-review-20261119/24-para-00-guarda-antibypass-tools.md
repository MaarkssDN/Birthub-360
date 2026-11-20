De: 24 — Revisão Independente (achado repassado pelo 00)
Para: 00 — Coordenador
Onda: review-20261119
Status: aberto
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
