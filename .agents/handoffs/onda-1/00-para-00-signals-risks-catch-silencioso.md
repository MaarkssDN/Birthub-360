# Handoff 00 → Agente 00 (dono a designar) — SignalsAndRisksHub: `catch` silencioso

**Data:** 2026-11-21 · **Onda:** 1 · **Status:** PREPARADO — implementação
bloqueada até parecer do Agente 09 (Silas).

## 1. Problema e backlog
`SignalsAndRisksHub` usa `catch {}` vazio no carregamento — falha é engolida e o
usuário vê estado vazio/normal como se não houvesse dados, sem erro nem retry.
O mesmo arquivo usa `alert()` (linha 133) para erro de ação — feedback
inconsistente.
Backlog: UX-007 (P1) · `docs/audits/experience-360/03-UX-JOURNEYS.md`.

## 2. Evidência técnica
`src/features/signals-risks/components/SignalsAndRisksHub.tsx`:
- linha ~66: `} catch {` (vazio);
- linha ~133: `alert(err?.response?.data?.error || ...)` para erro de ação.

## 3. Agente responsável e ownership
`src/features/signals-risks/**` **não possui AGENTS.md local** → escalar ao
Agente 00 para designar dono (provável módulo de inteligência/CRM — confirmar
qual agente é dono do feature).

## 4. Causa raiz
Catch vazio para "não quebrar" a tela, removendo qualquer sinal de falha —
viola o princípio de que erros relevantes devem ser observáveis (AGENTS §30).

## 5. Solução mínima proposta
- Substituir o catch vazio por **estado de erro explícito** (mesmo padrão dos
  demais hubs: `loadError`/estado de erro + mensagem + retry), espelhando o que
  já foi corrigido em `GamificationView` (precedente no repo).
- Não mudar a lógica de dados — apenas a superfície de erro.
- Avaliar se o `alert()` da linha 133 deve virar toast (alinhar com COMP-008 /
  padrão do DS) — incluir no mesmo handoff se o dono concordar, senão registrar.
- **Se a falha for esperada/degradável por design**, documentar a decisão em vez
  de mostrar erro — confirmar com o dono do módulo.

## 6. Arquivos que poderão ser modificados
- `src/features/signals-risks/components/SignalsAndRisksHub.tsx`

## 7. Dependências e riscos
- Risco baixo; a mudança faz o erro aparecer — comportamento desejado.
- Depende de designar o dono do feature (sem AGENTS.md local).

## 8. Critérios de aceite
- Falha de carregamento exibe estado de erro claro com opção de retry.
- Nenhum `catch {}` vazio restante no arquivo.
- Estado vazio legítimo (sem dados) continua distinto de erro.

## 9. Testes obrigatórios
- Teste do componente: falha do fetch → erro visível; sucesso vazio → empty
  state.
- `npx tsc --noEmit`, `npm run lint`, teste de domínio, `npm run build`.

## 10. Estratégia de rollback
Revert do commit; sem contrato ou dado envolvido.
