# Handoff 00 → Agentes 04 + 21 — OPP-01: criação manual de lead/oportunidade na UI

**Data:** 2026-11-21 · **Onda:** 4 (jornada crítica) · **Backlog:** OPP-01
**ADR:** ADR-013 · **Status:** ESCOPO APROVADO — implementação condicionada a
parecer Silas (§40) + aprovação deste handoff

## 1. Problema
Não existe caminho na UI para criar manualmente um lead/oportunidade, embora o
backend já tenha `createLead` e o motor weighted round-robin (C.2) — hoje
ociosos. Operadores que recebem indicação (telefone, evento, indicação direta)
não conseguem registrar o contato sem contornos.

## 2. Evidência
- Backend pronto: `createLead` (ver `LeadUseCases.ts` / camada de aplicação) +
  round-robin implementado.
- UI: nenhum ponto de entrada de criação manual; o intent "Nova oportunidade" da
  Command Palette foi removido por ser dead-code (`CrmBoard` não consumia).
- Auditoria: `11-UX-OPPORTUNITIES.md` (OPP-01), `12-PRIORITIZED-BACKLOG.md`.

## 3. Responsável / ownership
- UI/CRM: Agente 04 (`src/features/crm/**`).
- Contrato/validação API: Agente 21 (Zod/OpenAPI) — confirmar que o contrato de
  `createLead` cobre os campos do formulário.
- Coordenação 04 ↔ 21 obrigatória.

## 4. Causa raiz
Funcionalidade de backend implementada sem superfície de UI correspondente —
feature "invisível" (ver skill `functional-completeness`).

## 5. Solução mínima proposta
- Formulário de criação manual reutilizando **o contrato existente** de
  `createLead` — **nenhum endpoint novo** sem justificativa documentada.
- Ponto de entrada coerente com a navegação do CRM (ex.: botão "Novo lead" no
  board/lista + intent na Command Palette **agora com handler real**).
- Respeitar: autenticação, permissões por papel (mesmas regras do CRM),
  validação de dados, **tratamento de duplicidade** (erro do backend → sugerir
  fusão/edição do existente), loading, erro de rede, toast de sucesso.
- Owner/atribuição: seguir round-robin existente; não permitir bypass manual que
  viole a regra (salvo se backend já suportar e produto confirmar).
- Usar primitivos de `ui/` (Input, Select, Dialog, toast) — não controles nativos.
- A11y: labels, `aria-invalid`/`aria-describedby`, teclado, foco gerenciado.

## 6. Arquivos que poderão ser modificados
- `src/features/crm/**` (formulário + ponto de entrada).
- `src/components/ui/CommandPalette.tsx` — reintroduzir intent "Novo lead" **com
  handler** (agora funcional).
- Possivelmente `src/features/crm/components/` para o diálogo de criação.
- Testes correspondentes.

## 7. Dependências e riscos
- **Contrato:** confirmar com Agente 21 que `createLead` aceita os campos do
  formulário e retorna erro de duplicidade de forma tratável.
- **Permissões:** criação manual pode exigir papel específico — se sim, decisão
  de UX explícita (botão visível mas desabilitado com tooltip vs oculto).
- **Round-robin:** criação não pode contornar distribuição — alinhar com Agente
  04/dono do roteamento.
- **Cache/board:** após criar, invalidar queries para o lead aparecer no
  pipeline/board.
- Risco moderado: novo fluxo de escrita no CRM — exige testes de autorização.

## 8. Critérios de aceite
- Usuário autorizado cria lead manualmente pela UI e ele aparece no pipeline.
- Duplicidade tratada com mensagem orientada (não erro cru).
- Permissão negada → feedback claro, sem chamada indevida.
- Loading/erro/sucesso visíveis; toast de confirmação.
- Intent da Command Palette funciona (sem dead-code).
- axe limpo no formulário/diálogo.

## 9. Testes obrigatórios
- Unit: validação do formulário, mapeamento para `createLead`.
- Integração: contrato createLead + duplicata + permissão por papel.
- E2E: jornada criar → aparece no board/pipeline.
- axe na rota/diálogo.
- Gate local completo.

## 10. Estratégia de rollback
Revert do commit; feature nova e isolada — sem migração de dados. Se o ponto de
entrada na Command Palette causar problema, remover só o intent (volta ao
estado atual documentado).
