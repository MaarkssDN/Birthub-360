# Estado de todos os agentes — 2026-11-12 01:30 (BRT)

Registro de continuidade do Agente 00 (Coordenador). Main atual: 94f95097 (#227).

**TRABALHOS ENCERRADOS em 2026-11-12 01:35 (BRT) por ordem do Marcelo.** Nenhum agente tem tarefa em execução. A fila abaixo é o ponto de retomada; nada foi mesclado depois do #227.

## Regras fixas
- Nunca commit/push na main, nunca force push. Merge squash com `--match-head-commit`, sem `--auto`; `--admin` só com OK do Marcelo.
- Conflito: merge commit da main, nunca rebase. Sem merge sem APROVADO do 24 no SHA exato.
- Sem allowlist no Gitleaks. Sonar 80% new code nunca baixa, sem exclusões: cobrir com testes.
- Não subir tolerância de VR, não aumentar timeout, não pular specs.
- OK do Marcelo obrigatório: deploy/produção, settings/secrets/branch protection, comentários públicos, migrations de produção, rotação de chaves, textos legais.
- Regra provisória (Marcelo, 11/11, confirmada no chat do 24): 24 aprova e 25 mescla PRs com VR vermelha desde que não piore vs main e o resto esteja OK. Vale até a VR da main zerar.

## Mesclados em 11/11
#220 c9e3b0d0, #221 7762b607, #222 549dad47, #225 358cdd71, #226 31603311, #227 94f95097.

## Ordem de merge (25)
1. #237 (01, fix E2E: navigateViaSidebar + sticky bar z-40) — destrava o gate (E2E travava 2h).
2. #238 (26, estabilidade VR + 8 baselines) @ 2cc35aa7 — VR 2x, 0 flaky; aguardando 24.
3. Sonar: #228 (vulns CSPRNG), #229 (5 bugs), #230 (cobertura landing), #231 (commercialMissionTrace 100%), #232 (settings).
4. Lotes VR: #233, #234; depois #224, #235, #236 após o 26 atualizar com a main pós-#238.

## PRs abertos e situação
- #214 BLOQUEADO (Login VR 8 depende dele).
- #215 doc LGPD, APROVADO como proposta.
- #216 BLOQUEADO; 01 vai substituir por PR em branch limpa (migration exige OK do Marcelo).
- #217 CONDICIONADO; precisa merge da main (Prettier/Sonar).
- #218 CONDICIONADO (Sonar). #219 em re-revisão (Landing360 3133 linhas). #223 docs, CONDICIONADO.
- #228–#236 CONDICIONADO no gate da main; com a regra provisória nenhum piora a VR.

## VR
88 falhas na main (baselines de 01/11). Com tudo mesclado: 72/88 resolvidas. Restam 16: Login 8 (#214) e Hub de IA/Inteligência light 8 (CTA "Acessar Célula Comercial", handoff ao 02).

## Por agente
- 01 Plataforma: #237; PR substituto do #216 (aguarda Marcelo); merge da main no #217.
- 02 Produto/UX: dividir PillarSettingsPlaceholder.tsx até 30/11 (exceção de hotspot temporária); bug CTA light; resto de cobertura (BirthHubOrbit360).
- 15 Segurança: fix loadConsentTrace (usar db injetado) até 20/11 em PR próprio após #231 (executa pelo 07).
- 21 LGPD: retenção 90 dias, IP com hash, WhatsApp opcional (não é texto legal final).
- 24 Revisão: revisar #237, #238 e refazer pareceres sob a regra provisória.
- 25 Merge: seguir a ordem acima e reportar SHAs.
- 26 VR: após #238, atualizar #224/#235/#236 com a main e pedir novo parecer.

## Agentes em espera (sem demanda aberta neste ciclo)
- 00 Coordenador: retomar a fila, conferir gate e Sonar QG da main após cada merge, pedir aval para as ondas 2–4, PR de docs com status dos handoffs já resolvidos.
- 03 Design e Acessibilidade: redesign Impeccable estilo Vancouver+, light e dark.
- 04 CRM e BI; 05 Prospecção; 06 Integrações e Bitrix; 12 Voz e Telefonia; 16 Runtime Workers; 17 Cadência e Receita; GHA (GitHub Actions): sem demanda nova.
- 07 IA e Automações: sem bot ativo; o 15 executa por ele.
- 08/08A QA, Release e Git: conferir CI da main quando acionado.
- Cartógrafo de Produto: sem demanda nova.
- WF1 Release Gate, WF2 Bundle Budget, WF3 SonarQube, WF4 E2E/Testes, WF5 Deploy/Rotação de segredos (só aprovação direta do Marcelo), WF6 Qualidade/a11y: reativar se gate, bundle, Sonar, testes ou a11y voltarem a falhar.

## Pendências do Marcelo
Migration `20261111040000_public_lead_consent_and_rls`; secrets `LANDING_LEAD_ORGANIZATION_ID` e `PUBLIC_LEAD_IP_HASH_SECRET`; texto legal final, /privacy, slug /book; Docker 2375 no host 192.168.0.116; settings do GitHub; rate limit EC2; aval para ondas 2–4.
