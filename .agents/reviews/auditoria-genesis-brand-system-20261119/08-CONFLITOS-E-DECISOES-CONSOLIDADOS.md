# 08 — Conflitos e Decisões Consolidados
## AUDITORIA TÉCNICA INDEPENDENTE — OPERAÇÃO GENESIS BRAND SYSTEM
### Repositório: Birthub 360 | Data: 19/11/2026 | Auditor: Google Antigravity

---

## 1. Princípio Fundamental de Governança

Em estrita consonância com o `AGENTS.md` e as diretrizes desta missão:
**NENHUMA DECISÃO PENDENTE PODE SER TOMADA POR UM AGENTE DE IA EM NOME DO USUÁRIO.**
O papel da auditoria independente é catalogar as divergências, mapear seus impactos técnicos, confrontar com as implementações reais e apresentar opções objetivas para a deliberação exclusiva do **Orquestrador Humano**.

---

## 2. Tabela de Correspondência Canônica Unificada

Esta tabela consolida com rastreabilidade total:
- Os 15 Conflitos de `00-GOVERNANCA/conflitos-e-decisoes.md` (C1 a C15).
- As 12 Decisões de `09-PLANO-DE-EVOLUCAO/decisoes-pendentes.md` (D1 a D12).
- Os itens de pendência registrados em `_FATOS-CANONICOS.md` (§10).
- Os itens do Roadmap e Backlog de Conformidade.

| ID Conflito | ID Decisão | Tema do Conflito / Decisão | Implementação Atual no Repositório | Alternativas em Análise | Recomendação Técnica (Proposta) | Status | Requer Decisão Humana? |
|---|---|---|---|---|---|---|---|
| **C1** | **D1** | Grafia oficial do nome | Divergência entre "Birth Hub 360°" (manuais), "Birthub 360" (código) e "360º" (masculino ordinal) | A: "Birth Hub 360°"<br>B: "Birthub 360"<br>C: "BirthHub 360°" | Adotar **"Birth Hub 360°"** com símbolo de grau `°` institucional; preservar `birthub-360` em IDs de código | **PENDENTE** | **SIM** (Marca) |
| **C2 / C12** | **D6** | Paleta oficial e destino do PR #368 | Neon vigente em runtime (`globals.css`); PR #368 aberto com 5 gates vermelhos tentando migrar 2039 hex | A: Integrar #368 após conserto<br>B: Rejeitar e fatiar por feature<br>C: Manter status quo | **Rejeitar / Fatiar PR #368** em ondas menores (blast radius reduzido) após testes visuais | **PENDENTE** | **SIM** (Release/Merge) |
| **C3** | **D2** | Contagem oficial de personagens vs agentes | 29 SVGs em `birthhub360/characters/`; código divide em 9 pilares + 20 agentes = 29 personagens | A: 29 personagens visuais<br>B: Separar personagens visuais de agentes de IA | Ratificar **29 personagens visuais** como ativos de marca; manter contagem de agentes de IA como conceito de produto | **PENDENTE** | **SIM** (Copy institucional) |
| **C4** | **D10** | Área de proteção e dimensões mínimas do logotipo | MANUAL-MESTRE exige 30% e 140x24px; `BrandConstitution.md` exige 1/4 do raio e 96x32px | A: Norma do MANUAL-MESTRE (30%)<br>B: Norma da BrandConstitution (1/4 raio) | Adotar temporariamente a mais restritiva (30%) e unificar em um único documento | **PENDENTE** | **SIM** (Design System) |
| **C5** | **D7** | Light canvas `#F4F7FB` vs `#F8FAFC` | PWA manifest e `globals.css` usam `#F4F7FB`; `DESIGN.md` menciona `#F8FAFC` | A: Ratificar `#F4F7FB`<br>B: Mudar para `#F8FAFC` | Ratificar **`#F4F7FB`** (já implementado em runtime e PWA) e corrigir `DESIGN.md` | **PENDENTE** | **SIM** (Design System) |
| **C6** | **D11** | Motion em dois níveis (Comercial vs Operacional) | Proposta em `05-MOTION/`; código usa os mesmos tokens em todas as telas | A: Aprovar modelo em 2 níveis<br>B: Manter modelo unificado | **Aprovar modelo em 2 níveis**: garante rapidez no CRM e impacto visual nas landings | **PENDENTE** | **SIM** (UX/Brand) |
| **C7** | **D3** | Mapeamento módulo→accent (`data-module`→`--module-accent`) | `official-identity.css:320-365` tem a infraestrutura CSS pronta, mas o layout não seta os atributos | A: Ativar `data-module` no AppLayout<br>B: Remover regras CSS | Ativar injeção de `data-module` no `AppLayout.tsx` para dar identidade cromática aos módulos | **PENDENTE** | **SIM** (Frontend/UX) |
| **C8** | **D4** | Contraste do CTA gradiente em light mode | Gradiente cyan/sky com texto branco tem taxa ~3:1 no light mode (abaixo de 4.5:1 WCAG AA) | A: Ajustar gradiente para tons mais escuros<br>B: Usar texto escuro no light | Ajustar a rampa do light para atingir 4.5:1 sem descaracterizar a identidade Neon | **PENDENTE** | **SIM** (Acessibilidade) |
| **C9** | **D5** | Destino de CSS morto e documentos legados navy/gold | Arquivos órfãos: `elegance.css`, `luxury-tokens.css`, `landing/`, docs navy/gold | A: Exclusão imediata<br>B: Quarentena e depreciação formal | Quarentena em branch de arquivamento e exclusão em lote sob autorização do Agente 00 | **PENDENTE** | **SIM** (Limpeza técnica) |
| **C10** | **D8** | `BirthHubLogo.tsx` variante orbit5 vs Neon | Componente aceita prop legada `orbit5` que renderiza paleta antiga de 5 cores | A: Depreciar prop `orbit5`<br>B: Manter para compatibilidade | Marcar `@deprecated` com aviso em dev e migrar usos para a variante canônica Neon | **PENDENTE** | **SIM** (Componentes) |
| **C11** | **D9** | Homologação do Sistema V2 (`identidade-visual/v2/`) | Proposta avançada e completa criada em 13/11/2026, mas sem homologação formal | A: Homologar formalmente como nova referência<br>B: Manter como proposta<br>C: Rejeitar | Avaliar incorporação dos tokens DTCG e brandbook HTML da V2 na identidade oficial | **PENDENTE** | **SIM** (Arquitetura) |
| **C13** | **D12** | Arquivo `.env` na pasta externa `05_TOKENS_E_TEMAS/` | Arquivo não aberto por precaução de segurança | A: Agente 15 inspeciona e sanitiza<br>B: Excluir se for redundante | Handoff formal para o **Agente 15 (Segurança)** auditar e rotacionar se houver credenciais reais | **PENDENTE** | **SIM** (Segurança P0) |
| **C14** | — | Governança: skills apontando para documento obsoleto | Skills em `.agents/skills/birthhub-*` citam `BIRTHHUB-360-DESIGN-LANGUAGE.md` (obsoleto) | Correção técnica de referências nas skills | Atualizar as skills para apontarem para `identidade-visual/brand-system/` | **CONFLITO ATIVO** | Não (Correção técnica) |
| **C15** | — | i18n parcial vs monolíngue | Apenas ~60 strings em `src/i18n/`; resto pt-BR hardcoded | Definir se a plataforma será puramente pt-BR ou multi-idioma | Documentar formalmente como monolíngue pt-BR nesta fase | **PENDENTE** | **SIM** (Produto) |

---

## 3. Diretriz para o Orquestrador Humano

Todas as 12 decisões acima foram estruturadas no relatório final com perguntas de múltipla escolha diretas para que o Orquestrador possa deliberar com agilidade e total clareza de impacto.
