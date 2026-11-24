De: 11 — Marca e Ativos Institucionais
Para: 00 — Coordenador
Onda: genesis-brand-system
Status: aberto
Prioridade: alto
Bloqueador-ref: identidade-visual/brand-system/09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md
Sprint destino: próxima

## Problema

A Operação Genesis concluiu a consolidação documental (`identidade-visual/brand-system/`,
73 arquivos) e levantou **12 decisões pendentes que só o Orquestrador Humano pode tomar**.
Sem essas decisões, o backlog P0/P1 do plano de evolução não pode ser executado sem
risco de retrabalho ou contradição com a identidade oficial.

## Arquivo(s) envolvido(s)

- `identidade-visual/brand-system/09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md` (D1–D12)
- `identidade-visual/brand-system/09-PLANO-DE-EVOLUCAO/backlog-priorizado.md` (30 itens P0–P3)
- `identidade-visual/brand-system/09-PLANO-DE-EVOLUCAO/plano-de-implementacao.md` (fases)
- `identidade-visual/brand-system/00-GOVERNANCA/conflitos-e-decisoes.md`

## Evidência

Decisões mais críticas (resumo — detalhe no arquivo):

- **D1** Grafia oficial: "Birthub" vs "Birth Hub 360°"; `°` vs `º`.
- **D3/D4** Destino do PR #368 (paleta oficial, 5 gates vermelhos) e relação com #310.
- **D5** Homologar ou rejeitar o sistema V2 (`identidade-visual/v2/`, decisões pinadas
  pelo usuário em 2026-11-13 mas marcadas como não homologadas).
- **D6** Destino do CSS morto (`elegance.css`, `luxury-tokens.css`, `index.css`) e dos
  docs/skills que declaram autoridades obsoletas (navy/gold "Strategic Command Center").
- **D7** Light canvas `#F4F7FB` vs `#F8FAFC`.
- **D8** Área de proteção e tamanhos mínimos do logo (fontes divergem).
- **D9** Mapeamento módulo→accent e motion em 2 níveis (Comercial V2 vs Operacional ativo).

## Alteração necessária

1. Submeter `decisoes-pendentes.md` ao Orquestrador Humano para deliberação.
2. Publicar matriz de propriedade para os itens P0/P1 do backlog antes de abrir onda
   de implementação (protocolo §13 — mais de 3 especialistas exige matriz).
3. Registrar decisões no repositório (FONTE-DE-VERDADE ou ADR) antes de qualquer
   alteração de código.

## Teste esperado

- Decisões D1–D12 respondidas ou explicitamente adiadas com justificativa.
- Nenhum item P0 do backlog iniciado antes da decisão correspondente.

## Contexto adicional

A biblioteca marca explicitamente o que é CONFIRMADO (implementação real), PROPOSTA
(recomendações) e PENDENTE (decisão humana). O Agente 24 foi acionado em paralelo para
revisão independente da qualidade documental desta entrega.
