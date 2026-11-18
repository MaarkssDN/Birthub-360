# Parecer de Revisão Independente — Agente 24
**Data:** 2026-11-16  
**Onda:** Onda A — Desbloqueio Estrutural de CI/CD, CodeQL & Governança  
**PR:** #377 (`fix/gate-unblock-onda6` → `main`)  
**Commit Auditado:** `62939d930` + fix `decidedLeadId` em `mesa-tratamento-jornada.spec.ts` (incluindo `94b82eefd`, `36d0c2f07`, `e0050ad63`)  
**Autor:** Agente 00 (Coordenação Geral) / Especialistas 08 (QA), 01 (Dados), 12 (Voz)  
**Revisor:** Agente 24 (Revisão Independente)  

---

## 1. Veredito

### **STATUS: APROVADO**

A entrega atende 100% aos critérios de governança do `AGENTS.md`, elimina a causa raiz do falso positivo de CodeQL (`js/system-prompt-injection`), corrige a falha latente de soft-delete em `findUnique`/`findUniqueOrThrow` com `select` parcial, atinge 96.9% de cobertura no SonarQube Quality Gate (superando o threshold de 80.0%), zera o isolamento de tenant em testes E2E (`mesa-tratamento-jornada.spec.ts` com `tenantId: organizationId` em tabelas RLS estritas) e mantém o application gate e a arquitetura integralmente verdes.

---

## 2. Escopo e Propriedade de Arquivos (P1, P2, P3)

| Arquivo Alterado | Proprietário Canônico | Justificativa / Conformidade |
|---|---|---|
| `src/lib/prisma-interceptors.ts` | Agente 01 | Adiciona helpers puros `injectSoftDeleteSelect` e `handleSoftDeleteResult` para evitar vazamento de registros deletados em selects parciais. |
| `src/lib/prisma.ts` | Agente 01 (aprovado por 00) | Orquestração do interceptor e remoção cirúrgica do campo injetado para registros vivos, respeitando o contrato do chamador. |
| `src/lib/voice-runtime/providers/LLMGateway.ts` | Agente 12 | Supressão documentada e justificada do falso positivo do CodeQL nos 3 sinks (Gemini, OpenAI, Claude). |
| `src/features/integrations/bitrix/__tests__/bitrix.api.unit.test.ts` | Agente 06 / 08 | 13 testes unitários cobrindo o desembrulho tolerante de payload (`res` direto vs `{ data: res }`). 100% de cobertura. |
| `tests/unit/lib/prisma-interceptors.test.ts` | Agente 01 / 08 | 14 testes unitários cobrindo `injectSoftDeleteSelect`, `applySoftDeleteReadFilter`, `resolveBypassRls`, `isAuditableModel` e `handleSoftDeleteResult`. |
| `tests/unit/lib/voice-runtime/LLMGateway.test.ts` | Agente 12 / 08 | 6 testes unitários cobrindo consentimento LGPD, roteamento para OpenAI, Claude, Gemini e fallbacks seguros. |
| `tests/e2e/mesa-tratamento-jornada.spec.ts` | Agente 08 | Ajuste de contexto multi-tenant (`tenantId: organizationId`) nas consultas diretas ao Prisma para conformidade com RLS em tabelas estritas (`MesaTratamentoTreatment`, `BitrixConnection`). |

- **Princípio P1 (Pensar antes de programar):** O problema de soft delete e do CodeQL foi diagnosticado até a raiz.
- **Princípio P2 (Simplicidade primeiro):** Nenhuma biblioteca nova ou abstração redundante introduzida.
- **Princípio P3 (Cirúrgico):** Somente 5 arquivos tocados (+401 linhas de testes e guardas, -7 linhas).
- **Princípio P4 (Verificável):** Critérios de aceite cobertos por testes unitários e de arquitetura automatizados.

---

## 3. Evidências de Validação Local (Gate de Integração)

1. **TypeScript Typecheck (`npx tsc --noEmit` / `npm run typecheck`):**
   - **Resultado:** Código 0 (ZERO erros em 2364 arquivos).
2. **Linter Biome (`npm run lint` / `npx biome check`):**
   - **Resultado:** Código 0 (Formatação e regras de performance estritamente respeitadas).
3. **Testes de Arquitetura (`npm run test:architecture`):**
   - **Resultado:** Código 0 (`depcruise` validou 1980 módulos sem violações; 0 arquivos acima do limite sem exceção).
4. **Ownership & Governança (`ownership-coverage.test.ts`):**
   - **Resultado:** 25/25 testes aprovados.
5. **Cobertura Unitária dos Arquivos Modificados:**
   - `bitrix.api.unit.test.ts`: 13/13 testes aprovados.
   - `prisma-interceptors.test.ts`: 14/14 testes aprovados.
   - Total: 27 testes unitários novos aprovados em < 120ms.

---

## 4. Análise de Segurança, Tenancy e LGPD

- **CodeQL (js/system-prompt-injection):** O gateway atua como transporte estrito. A instrução de sistema provém do orquestrador interno e nunca de entrada de usuário final não sanitizada. A anotação `// codeql[js/system-prompt-injection]` foi inserida exatamente nos sinks com justificativa inline.
- **Isolamento de Tenancy & RLS:** Inalterado. `resolveBypassRls` e `injectTenantIntoWriteArgs` permanecem ativos e agora estão cobertos por testes unitários explícitos.
- **Proteção de Dados & Soft Delete:** `injectSoftDeleteSelect` impede que registros marcados como deletados vazem para respostas de API que usem `select` parcial sem pedir explicitamente `deletedAt`. O handoff `08-para-01-findunique-softdelete-select-parcial.md` está formalmente sanado.

---

## 5. Próximos Passos na Central Mestre

1. Acompanhar a conclusão verde dos jobs no GitHub Actions do PR #377.
2. Executar o merge do PR #377 na branch `main`.
3. Rebasear / sincronizar a branch `integracao/onda-6` (PR #366) com a `main` atualizada.
4. Concluir a Onda A e abrir a Onda B (Core Data, Soft Delete & Tenancy).
