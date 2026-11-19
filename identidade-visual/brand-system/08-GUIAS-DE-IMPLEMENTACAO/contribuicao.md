# Guia de Implementação — Contribuição e Evolução da Identidade — Birth Hub 360°

**Propósito:** definir o processo formal para propor, aprovar, implementar e descontinuar mudanças na identidade visual do Birth Hub 360°.

**Escopo:** mudanças em tokens, paleta, tipografia, logos, personagens, componentes de marca, motion de marca e documentos oficiais de identidade. Não se aplica a bugs de UI fora da identidade (esses seguem o fluxo normal de handoff/gates).

**Estado:** processo derivado da governança vigente (`AGENTS.md`, decisões históricas de 2026-10-11 e 2026-11-13) em 2026-11-19.

**Data:** 2026-11-19 · **Fontes:** `AGENTS.md` (§15 propriedade, §18 handoffs, §28 gates, §40 revisão independente), `identidade-visual/brand-system/_FATOS-CANONICOS.md` §17-§19, `identidade-visual/README.md`, `.agents/handoffs/` (precedentes), git log (`36d097a17`, `c3eaefd34`).

**Documentos relacionados:** `frontend.md`, `designers.md`, `marketing.md`, `agentes-de-ia.md`, `checklist-de-qualidade.md`, `../07-ATIVOS/rastreabilidade.md`.

---

## 1. Princípio

A identidade é **decisão humana homologada**, não resultado de implementação. Precedentes: paleta Neon homologada em 2026-10-11 (merge `36d097a17`, parecer 24 APROVADO, handoff `00-para-11-decisao-paleta-oficial.md`); BrandConstitution→tokens neon (`c3eaefd34`); decisões V2 pinadas pelo usuário em 2026-11-13 (`v2/FONTE-DE-VERDADE.md`, ainda não homologadas como sistema).

Nenhum agente — incluindo o 11 — altera tokens oficiais, HTMLs canônicos ou ativos de marca sem missão explícita e aprovação humana.

## 2. Fluxo de proposta (evidência → decisão → implementação)

```
1. EVIDÊNCIA      → reproduzir o problema/oportunidade com caminhos, screenshots,
                    tokens afetados e impacto (quais telas/módulos/materiais).
2. PROPOSTA       → documento ou handoff descrevendo: o que muda, por quê,
                    alternativas consideradas, impacto em dark/light, contraste AA,
                    migração/dívida associada. Marcar [PROPOSTO].
3. HANDOFF        → .agents/handoffs/onda-<n>/<de>-para-00-<slug>.md para o
                    Coordenador (decisões de marca sobem ao 00 + humano).
4. APROVAÇÃO      → decisão humana explícita (mesmo rito da paleta Neon).
                    Registro da decisão em FONTE-DE-VERDADE/handbook conforme tipo.
5. PARECER 24     → Agente 24 revisa diff/escopo/propriedade/evidências antes
                    de integrar (AGENTS.md §40).
6. IMPLEMENTAÇÃO  → dono do arquivo executa:
                    • tokens/estilos/ui  → Agente 03 (src/styles/**, src/components/ui/**)
                    • identidade-visual, public/brand, documentacao-aplicacao → Agente 11
                    • navegação/App.tsx/Sidebar → Agente 02
                    • rotas/features visuais → dono da feature (ver AGENTS.md locais)
7. VERIFICAÇÃO    → gates (tsc/lint/testes/build) + evidência visual + checklist
                    de qualidade (checklist-de-qualidade.md) + atualização dos
                    documentos de identidade afetados.
```

## 3. Formato de handoff de proposta de identidade

```
De: <agente>
Para: 00 — Coordenador (cópia ao dono do arquivo)
Onda: <n>
Status: aberto
Prioridade: normal|alto|bloqueador

## Problema / oportunidade
## Evidência            ← caminhos, comandos, screenshots, valores de token atuais vs propostos
## Alteração necessária ← arquivos exatos e dono de cada um
## Impacto              ← temas, contraste, migração de hex, docs a atualizar
## Teste esperado       ← como verificar (checklist + gates)
## Contexto adicional   ← decisões relacionadas, pendências §19 afetadas
```

## 4. Versionamento

| Artefato | Regra proposta/vigente |
|---|---|
| `birthhub360.json` | Campo `version` atual `"2026.1"` — incrementar por safra de mudanças homologadas (padrão data.N já praticado) |
| `characters.json` | `version: "1.0.0"` — semver manual |
| Tokens CSS | Sem versão própria; seguem o JSON |
| Documentos oficiais (HTMLs/brandbook) | Sem versionamento interno; precedência fixa pelo README — mudanças criam nova revisão do documento, nunca edição silenciosa |
| Pacote V2 | `MANIFEST.sha256` + `_baseline-v2.0/` — só após homologação vira oficial |
| Git | Sem tag específica de identidade hoje; tags existentes `v1.0.0`, `v2.0.0-recovery`. **[PROPOSTO]** criar tag `identidade-vAAAA.N` a cada release de marca aprovado |

**[PROPOSTO]** Adotar changelog curto em `identidade-visual/brand-system/00-GOVERNANCA/` registrando cada mudança homologada (data, decisão, arquivos, parecer 24).

## 5. Descontinuação e deprecação

1. **Token/componente:** marcar `@deprecated` no CSS/TS (precedente: aliases em `birthhub360.css:101-116`) → período de migração → remover. Nunca remover sem handoff ao Agente 03/02 conforme o caso.
2. **Ativo de marca:** mover para seção "legado/divergente" no catálogo (`07-ATIVOS/catalogo-de-assets.md`) com data e motivo; não apagar histórico — git preserva.
3. **Documento oficial:** substituir por nova versão e registrar supersessão no topo do antigo ("SUBSTITUÍDO POR … em AAAA-MM-DD") — precedente: docs navy/gold já marcados obsoletos em `inventario-de-fontes.md` §5.
4. **CSS morto** (`index.css`, `elegance.css`, `luxury-tokens.css`) e **sub-apps divergentes** (`landing/`, `prospecting/outbound/`): destino é pendência humana §19.5 — não remover por iniciativa própria.
5. **Qualquer descontinuação** exige evidência de não-uso (grep + rotas) e parecer 24 antes do merge.

## 6. O que exige aprovação humana explícita (não delegável)

- Mudança de paleta, tipografia, logo, nome/grafia, posicionamento, voz.
- Homologação do sistema V2 (`identidade-visual/v2/`) ou de qualquer subconjunto dele.
- Resolução das 12 pendências do `_FATOS-CANONICOS.md` §19.
- Toque em `landing/` e telas de login (superfícies protegidas — `src/features/landing/AGENTS.md`).
- `server.ts`, `package.json`, lockfile (aprovação do 00).

## 7. Checklist de contribuição

- [ ] Problema/opção tem evidência verificável (não é gosto)
- [ ] Proposta respeita P1–P4 (simples, cirúrgica, orientada a objetivo)
- [ ] Impacto em tenancy/LGPD/segurança avaliado e comunicado quando houver
- [ ] Handoff aberto no formato §18 antes de implementar
- [ ] Gates locais verdes + evidência visual + parecer 24
- [ ] Documentos de identidade e `catalogo-de-assets.md`/`rastreabilidade.md` atualizados quando o ativo/token mudar
- [ ] Aprendizado reutilizável registrado (causa raiz, decisão, limitação) — `AGENTS.md` §7
