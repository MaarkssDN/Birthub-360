# Controle de Versões — Brand System Birth Hub 360°

**Propósito:** definir o versionamento desta biblioteca documental, sua relação com as demais fontes de verdade (V2, HTMLs oficiais, tokens machine-readable) e o procedimento de atualização.

**Escopo:** versionamento semântico **da documentação** em `identidade-visual/brand-system/` — não versiona código nem a marca em si. Versão atual: **v0.1** (gênese).

**Estado da informação:** convenção **[PROPOSTO]** — não existe versionamento formal anterior desta pasta; este documento estabelece o primeiro.

**Data de referência:** 2026-11-19

**Fontes:** `identidade-visual/brand-system/_FATOS-CANONICOS.md`; `identidade-visual/README.md`; `identidade-visual/v2/FONTE-DE-VERDADE.md`; histórico Git (`36d097a17`, `c3eaefd34`).

**Documentos relacionados:** `relatorio-forense.md`, `inventario-de-fontes.md`, `../09-PLANO-DE-EVOLUCAO/plano-de-implementacao.md`.

---

## 1. Modelo de versionamento

Adota-se **versionamento semântico documental**:

- **MAJOR (X.0.0)** — mudança que altera uma decisão documentada, invalida documentos existentes ou muda a estrutura da biblioteca.
- **MINOR (x.Y.0)** — novo documento, nova seção normativa ou ampliação de escopo sem contradizer o anterior.
- **PATCH (x.y.Z)** — correções factuais, citações, clareza, sem mudança de decisão.

A versão vive neste documento e no rodapé/estado de cada arquivo quando relevante. Commits na branch seguem a convenção `agente/<nn>-<slug>` (AGENTS.md §12); tags Git `brand-system-vX.Y.Z` **[PROPOSTO]** podem ser criadas pelo 08A quando o fluxo de release se aplicar a docs.

## 2. Relação com as demais fontes de verdade

Esta biblioteca **não é** a fonte primária de decisões de marca — é a **camada documental consolidada** que as cita e as torna navegáveis. Precedência permanece a de `_FATOS-CANONICOS.md` §1:

| Camada | Papel | Autoridade |
|---|---|---|
| `DOCUMENTOS/IDENTIDADE-VISUAL/` (HTMLs oficiais: Brandbook > Manual Visual > Manual Produto > Catálogo) | Decisões de marca homologadas | **Primária** para identidade |
| `identidade-visual/v2/FONTE-DE-VERDADE.md` | Decisões pinadas 2026-11-13 | **Primária** para o recorte V2 |
| `identidade-visual/birthhub360/tokens/*` + `src/styles/*` | Implementação machine-readable | **Primária** para valores em runtime |
| `identidade-visual/brand-system/` | Consolidação documental, matrizes, governança, plano | **Secundária** — referencia, não decide |
| `identidade-visual/v2/` (fora de FONTE-DE-VERDADE) | Proposta avançada | **Não homologada** |

Regra: quando brand-system e uma fonte primária divergirem, **a fonte primária prevalece** e a divergência deve ser registrada como conflito (ver `conflitos-e-decisoes.md`) — nunca "corrigida" silenciosamente neste acervo.

## 3. Changelog inicial

### v0.1 — 2026-11-19 — Gênese

- Criação da estrutura `00-GOVERNANCA` … `09-PLANO-DE-EVOLUCAO`.
- Consolidação de `_FATOS-CANONICOS.md` como pacote de evidências interno.
- `00-GOVERNANCA/relatorio-forense.md` já existia (audit prévio) — preservado.
- Documentos de governança produzidos nesta onda: `inventario-de-fontes.md`, `matriz-de-evidencias.md`, `conflitos-e-decisoes.md`, `controle-de-versoes.md`, `roadmap-de-conformidade.md`.
- Documentos de planejamento produzidos nesta onda: `09-PLANO-DE-EVOLUCAO/{auditoria-de-inconsistencias,gap-analysis,decisoes-pendentes,backlog-priorizado,plano-de-implementacao}.md`.

## 4. Como atualizar

1. Toda atualização factual deve citar a evidência (caminho de arquivo) conforme `_FATOS-CANONICOS.md` §0.
2. Mudança de decisão documentada → bump MINOR ou MAJOR + entrada de changelog +, se afetar outros documentos, varredura de referências.
3. Correção de evidência/citação → PATCH.
4. Novos achados de conflito → registrar em `conflitos-e-decisoes.md` e `09-PLANO-DE-EVOLUCAO/auditoria-de-inconsistencias.md`.
5. Decisões humanas pendentes (§19 dos fatos) só podem ser escritas como decididas após evidência da decisão (ata, handoff, commit do usuário) — até lá permanecem **PENDENTE**.
6. Revisão periódica: recomenda-se re-auditar após (a) merge ou abandono do PR #368, (b) homologação ou rejeição do V2, (c) qualquer decisão sobre grafia oficial.

## 5. Limitações conhecidas

- Versão documental não reflete versão de implementação: o código pode divergir dos docs entre auditorias (é o objeto de `roadmap-de-conformidade.md`).
- Não há CI/lint para esta pasta; a qualidade é garantida por revisão do Agente 24 quando aplicável (AGENTS.md §40).
- `v0.1` é deliberadamente baixa: a biblioteca ainda não foi homologada por revisão independente.
