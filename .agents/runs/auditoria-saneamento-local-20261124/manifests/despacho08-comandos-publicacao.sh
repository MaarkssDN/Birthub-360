# despacho08 — COMANDOS DE PUBLICACAO (Agente 94 — Tess)
# Gerado 2026-11-24. NADA executado. Gates obrigatorios no relatorio despacho08-agente-94-publicacao.md
# Regras: somente fast-forward, SEM --force/--force-with-lease. Dry-run primeiro (Fase 1).
set -euo pipefail
C="/c/Github/Birthub-360"
D="/d/Github/Birthub-360"

# === FASE 0 — Verificacoes pre-push (read-only) ===
git -C "$C" fetch origin --prune
git -C "$D" fetch origin --prune
git -C "$C" ls-remote origin "refs/heads/integracao/*dem2026112*" "refs/heads/integracao/squad-*" "refs/heads/integracao/pos4*" "refs/heads/integracao/consolidacao-dem*" "refs/heads/preserve/*"
# esperado: nenhuma saida (nenhuma das branches existe no remoto)

# === FASE 1 — Dry-run (obrigatorio) ===
git -C "$C" push --dry-run origin integracao/consolidacao-dem20261123-candidato:integracao/consolidacao-dem20261123-candidato
git -C "$C" push --dry-run origin integracao/onda-1-dem20261123:integracao/onda-1-dem20261123
git -C "$C" push --dry-run origin integracao/onda-2-dem20261123:integracao/onda-2-dem20261123
git -C "$C" push --dry-run origin integracao/onda-3-dem20261123:integracao/onda-3-dem20261123
git -C "$C" push --dry-run origin integracao/onda-4-dem20261123:integracao/onda-4-dem20261123
git -C "$C" push --dry-run origin integracao/squad-00:integracao/squad-00
git -C "$C" push --dry-run origin integracao/squad-30:integracao/squad-30
git -C "$C" push --dry-run origin integracao/squad-40:integracao/squad-40
git -C "$C" push --dry-run origin integracao/squad-50:integracao/squad-50
git -C "$C" push --dry-run origin integracao/squad-60:integracao/squad-60
git -C "$C" push --dry-run origin integracao/squad-70:integracao/squad-70
git -C "$C" push --dry-run origin integracao/squad-90:integracao/squad-90
git -C "$C" push --dry-run origin agente/00-fix-format-biome-main:agente/00-fix-format-biome-main
git -C "$C" push --dry-run origin agente/00-integracao-p0-local:agente/00-integracao-p0-local
git -C "$C" push --dry-run origin agente/02-env-harness-s00:agente/02-env-harness-s00
git -C "$C" push --dry-run origin agente/02-harness-onda2-dem20261123:agente/02-harness-onda2-dem20261123
git -C "$C" push --dry-run origin agente/03-p0-06-falhas-unitarias:agente/03-p0-06-falhas-unitarias
git -C "$C" push --dry-run origin agente/03-unitarios-dem20261123:agente/03-unitarios-dem20261123
git -C "$C" push --dry-run origin agente/04-env-isolado-s00:agente/04-env-isolado-s00
git -C "$C" push --dry-run origin agente/04-integracao-dem20261123:agente/04-integracao-dem20261123
git -C "$C" push --dry-run origin agente/04-integracao-onda2-dem20261123:agente/04-integracao-onda2-dem20261123
git -C "$C" push --dry-run origin agente/05-e2e-visual-dem20261123:agente/05-e2e-visual-dem20261123
git -C "$C" push --dry-run origin agente/06-dailyplan-verify-s00:agente/06-dailyplan-verify-s00
git -C "$C" push --dry-run origin agente/08-lgpd-onda2-dem20261123:agente/08-lgpd-onda2-dem20261123
git -C "$C" push --dry-run origin agente/09-audit-onda3:agente/09-audit-onda3
git -C "$C" push --dry-run origin agente/09-review-dem20261123:agente/09-review-dem20261123
git -C "$C" push --dry-run origin agente/09-review-onda2-dem20261123:agente/09-review-onda2-dem20261123
git -C "$C" push --dry-run origin agente/09-review-onda2-final-dem20261123:agente/09-review-onda2-final-dem20261123
git -C "$C" push --dry-run origin agente/10-data-interceptors-onda3:agente/10-data-interceptors-onda3
git -C "$C" push --dry-run origin agente/11-deletedby-schema-s10:agente/11-deletedby-schema-s10
git -C "$C" push --dry-run origin agente/12-deletedby-migration-s10:agente/12-deletedby-migration-s10
git -C "$C" push --dry-run origin agente/13-rls-dem20261123:agente/13-rls-dem20261123
git -C "$C" push --dry-run origin agente/14-fixtures-dem20261123:agente/14-fixtures-dem20261123
git -C "$C" push --dry-run origin agente/20-core-backend-onda3:agente/20-core-backend-onda3
git -C "$C" push --dry-run origin agente/21-api-contracts-onda3:agente/21-api-contracts-onda3
git -C "$C" push --dry-run origin agente/22-controllers-onda3:agente/22-controllers-onda3
git -C "$C" push --dry-run origin agente/23-queue-onda3:agente/23-queue-onda3
git -C "$C" push --dry-run origin agente/31-app-shell-onda3:agente/31-app-shell-onda3
git -C "$C" push --dry-run origin agente/34-accessibility-onda3:agente/34-accessibility-onda3
git -C "$C" push --dry-run origin agente/40-crm-components-onda3:agente/40-crm-components-onda3
git -C "$C" push --dry-run origin agente/41-activities-onda3:agente/41-activities-onda3
git -C "$C" push --dry-run origin agente/42-crm-kanban-onda3:agente/42-crm-kanban-onda3
git -C "$C" push --dry-run origin agente/42-stage-transitions-s40:agente/42-stage-transitions-s40
git -C "$C" push --dry-run origin agente/43-prospecting-authz-onda3:agente/43-prospecting-authz-onda3
git -C "$C" push --dry-run origin agente/44-cadence-contracts-s40:agente/44-cadence-contracts-s40
git -C "$C" push --dry-run origin agente/44-cadence-onda3:agente/44-cadence-onda3
git -C "$C" push --dry-run origin agente/45-crm-agenda-onda3:agente/45-crm-agenda-onda3
git -C "$C" push --dry-run origin agente/46-forecast-s40-v2:agente/46-forecast-s40-v2
git -C "$C" push --dry-run origin agente/47-routing-s40:agente/47-routing-s40
git -C "$C" push --dry-run origin agente/50-bitrix-authz-onda3:agente/50-bitrix-authz-onda3
git -C "$C" push --dry-run origin agente/50-dailyplan-idor-s50:agente/50-dailyplan-idor-s50
git -C "$C" push --dry-run origin agente/60-voice-hub-inventory-s60:agente/60-voice-hub-inventory-s60
git -C "$C" push --dry-run origin agente/65-voice-hub-onda3:agente/65-voice-hub-onda3
git -C "$C" push --dry-run origin agente/72-tool-calling-b08-s70:agente/72-tool-calling-b08-s70
git -C "$C" push --dry-run origin agente/77-guardrails-onda3-r3:agente/77-guardrails-onda3-r3
git -C "$C" push --dry-run origin agente/90-nginx-p007-onda2-dem20261123:agente/90-nginx-p007-onda2-dem20261123
git -C "$C" push --dry-run origin agente/93-docker-onda2-dem20261123:agente/93-docker-onda2-dem20261123
git -C "$C" push --dry-run origin agente/93-docker-p007-dem20261123:agente/93-docker-p007-dem20261123
git -C "$C" push --dry-run origin agente/94-ci-dem20261123:agente/94-ci-dem20261123
git -C "$C" push --dry-run origin agente/94-ci-onda2-dem20261123:agente/94-ci-onda2-dem20261123
git -C "$C" push --dry-run origin agente/94-ci-onda3-r3:agente/94-ci-onda3-r3
git -C "$C" push --dry-run origin agente/94-p0-01-format-depcruise:agente/94-p0-01-format-depcruise
git -C "$C" push --dry-run origin agente/96-auth-onda3:agente/96-auth-onda3
git -C "$C" push --dry-run origin agente/96-sessions-cookies-s90:agente/96-sessions-cookies-s90
git -C "$C" push --dry-run origin agente/97-rbac-onda3:agente/97-rbac-onda3
git -C "$C" push --dry-run origin agente/99-appsec-onda2-dem20261123:agente/99-appsec-onda2-dem20261123
git -C "$C" push --dry-run origin agente/99-appsec-onda3:agente/99-appsec-onda3
git -C "$C" push --dry-run origin agente/99-p0-02-semgrep-sync:agente/99-p0-02-semgrep-sync
git -C "$C" push --dry-run origin agente/99-p0-07-bypass-estaticos:agente/99-p0-07-bypass-estaticos
git -C "$C" push --dry-run origin agente/99-trivy-waivers-s90:agente/99-trivy-waivers-s90
git -C "$C" push --dry-run origin base/dem-20261123-c286185c:base/dem-20261123-c286185c
git -C "$C" push --dry-run origin consolidacao_backlog_birthub360:consolidacao_backlog_birthub360
git -C "$C" push --dry-run origin coord/squad-10:coord/squad-10
git -C "$C" push --dry-run origin coord/squad-20:coord/squad-20
git -C "$C" push --dry-run origin coord/squad-30-v2:coord/squad-30-v2
git -C "$C" push --dry-run origin coord/squad-40:coord/squad-40
git -C "$C" push --dry-run origin coord/squad-50:coord/squad-50
git -C "$C" push --dry-run origin coord/squad-60:coord/squad-60
git -C "$C" push --dry-run origin coord/squad-70:coord/squad-70
git -C "$C" push --dry-run origin coord/squad-80:coord/squad-80
git -C "$C" push --dry-run origin coord/squad-90:coord/squad-90
git -C "$C" push --dry-run origin docs/matriz-reconciliacao-20261124:docs/matriz-reconciliacao-20261124
git -C "$D" push --dry-run origin integracao/pos4-dem20261124:integracao/pos4-dem20261124
git -C "$D" push --dry-run origin agente/06-idor-whatsapp-pos4:agente/06-idor-whatsapp-pos4
git -C "$D" push --dry-run origin agente/09-review-onda4:agente/09-review-onda4
git -C "$D" push --dry-run origin agente/17-cadence-tz-pos4:agente/17-cadence-tz-pos4
git -C "$D" push --dry-run origin agente/22-api-idem-pos4:agente/22-api-idem-pos4
git -C "$D" push --dry-run origin agente/44-cadences-onda4:agente/44-cadences-onda4
git -C "$D" push --dry-run origin agente/46-forecast-s40:agente/46-forecast-s40
git -C "$D" push --dry-run origin agente/51-bitrix-auth-onda4:agente/51-bitrix-auth-onda4
git -C "$D" push --dry-run origin agente/56-whatsapp-onda4:agente/56-whatsapp-onda4
git -C "$D" push --dry-run origin agente/63-stt-pos4:agente/63-stt-pos4
git -C "$D" push --dry-run origin agente/64-stt-cmd-pos4:agente/64-stt-cmd-pos4
git -C "$D" push --dry-run origin agente/64-voice-commands-onda4:agente/64-voice-commands-onda4
git -C "$D" push --dry-run origin agente/69-optout-onda4:agente/69-optout-onda4
git -C "$D" push --dry-run origin agente/69-optout-pos4:agente/69-optout-pos4
git -C "$D" push --dry-run origin agente/72-tool-engine-onda4:agente/72-tool-engine-onda4
git -C "$D" push --dry-run origin agente/85-mobile-idem-pos4:agente/85-mobile-idem-pos4
git -C "$D" push --dry-run origin agente/85-mobile-offline-onda4:agente/85-mobile-offline-onda4
git -C "$D" push --dry-run origin agente/99-sec-triage-pos4:agente/99-sec-triage-pos4
git -C "$D" push --dry-run origin coord/squad-30:coord/squad-30

# === FASE 2 — Push real clone C: — ordem: consolidacao > ondas > squads > agente > demais ===
git -C "$C" push origin integracao/consolidacao-dem20261123-candidato:integracao/consolidacao-dem20261123-candidato
git -C "$C" push origin integracao/onda-1-dem20261123:integracao/onda-1-dem20261123
git -C "$C" push origin integracao/onda-2-dem20261123:integracao/onda-2-dem20261123
git -C "$C" push origin integracao/onda-3-dem20261123:integracao/onda-3-dem20261123
git -C "$C" push origin integracao/onda-4-dem20261123:integracao/onda-4-dem20261123
git -C "$C" push origin integracao/squad-00:integracao/squad-00
git -C "$C" push origin integracao/squad-30:integracao/squad-30
git -C "$C" push origin integracao/squad-40:integracao/squad-40
git -C "$C" push origin integracao/squad-50:integracao/squad-50
git -C "$C" push origin integracao/squad-60:integracao/squad-60
git -C "$C" push origin integracao/squad-70:integracao/squad-70
git -C "$C" push origin integracao/squad-90:integracao/squad-90
git -C "$C" push origin agente/00-fix-format-biome-main:agente/00-fix-format-biome-main
git -C "$C" push origin agente/00-integracao-p0-local:agente/00-integracao-p0-local
git -C "$C" push origin agente/02-env-harness-s00:agente/02-env-harness-s00
git -C "$C" push origin agente/02-harness-onda2-dem20261123:agente/02-harness-onda2-dem20261123
git -C "$C" push origin agente/03-p0-06-falhas-unitarias:agente/03-p0-06-falhas-unitarias
git -C "$C" push origin agente/03-unitarios-dem20261123:agente/03-unitarios-dem20261123
git -C "$C" push origin agente/04-env-isolado-s00:agente/04-env-isolado-s00
git -C "$C" push origin agente/04-integracao-dem20261123:agente/04-integracao-dem20261123
git -C "$C" push origin agente/04-integracao-onda2-dem20261123:agente/04-integracao-onda2-dem20261123
git -C "$C" push origin agente/05-e2e-visual-dem20261123:agente/05-e2e-visual-dem20261123
git -C "$C" push origin agente/06-dailyplan-verify-s00:agente/06-dailyplan-verify-s00
git -C "$C" push origin agente/08-lgpd-onda2-dem20261123:agente/08-lgpd-onda2-dem20261123
git -C "$C" push origin agente/09-audit-onda3:agente/09-audit-onda3
git -C "$C" push origin agente/09-review-dem20261123:agente/09-review-dem20261123
git -C "$C" push origin agente/09-review-onda2-dem20261123:agente/09-review-onda2-dem20261123
git -C "$C" push origin agente/09-review-onda2-final-dem20261123:agente/09-review-onda2-final-dem20261123
git -C "$C" push origin agente/10-data-interceptors-onda3:agente/10-data-interceptors-onda3
git -C "$C" push origin agente/11-deletedby-schema-s10:agente/11-deletedby-schema-s10
git -C "$C" push origin agente/12-deletedby-migration-s10:agente/12-deletedby-migration-s10
git -C "$C" push origin agente/13-rls-dem20261123:agente/13-rls-dem20261123
git -C "$C" push origin agente/14-fixtures-dem20261123:agente/14-fixtures-dem20261123
git -C "$C" push origin agente/20-core-backend-onda3:agente/20-core-backend-onda3
git -C "$C" push origin agente/21-api-contracts-onda3:agente/21-api-contracts-onda3
git -C "$C" push origin agente/22-controllers-onda3:agente/22-controllers-onda3
git -C "$C" push origin agente/23-queue-onda3:agente/23-queue-onda3
git -C "$C" push origin agente/31-app-shell-onda3:agente/31-app-shell-onda3
git -C "$C" push origin agente/34-accessibility-onda3:agente/34-accessibility-onda3
git -C "$C" push origin agente/40-crm-components-onda3:agente/40-crm-components-onda3
git -C "$C" push origin agente/41-activities-onda3:agente/41-activities-onda3
git -C "$C" push origin agente/42-crm-kanban-onda3:agente/42-crm-kanban-onda3
git -C "$C" push origin agente/42-stage-transitions-s40:agente/42-stage-transitions-s40
git -C "$C" push origin agente/43-prospecting-authz-onda3:agente/43-prospecting-authz-onda3
git -C "$C" push origin agente/44-cadence-contracts-s40:agente/44-cadence-contracts-s40
git -C "$C" push origin agente/44-cadence-onda3:agente/44-cadence-onda3
git -C "$C" push origin agente/45-crm-agenda-onda3:agente/45-crm-agenda-onda3
git -C "$C" push origin agente/46-forecast-s40-v2:agente/46-forecast-s40-v2
git -C "$C" push origin agente/47-routing-s40:agente/47-routing-s40
git -C "$C" push origin agente/50-bitrix-authz-onda3:agente/50-bitrix-authz-onda3
git -C "$C" push origin agente/50-dailyplan-idor-s50:agente/50-dailyplan-idor-s50
git -C "$C" push origin agente/60-voice-hub-inventory-s60:agente/60-voice-hub-inventory-s60
git -C "$C" push origin agente/65-voice-hub-onda3:agente/65-voice-hub-onda3
git -C "$C" push origin agente/72-tool-calling-b08-s70:agente/72-tool-calling-b08-s70
git -C "$C" push origin agente/77-guardrails-onda3-r3:agente/77-guardrails-onda3-r3
git -C "$C" push origin agente/90-nginx-p007-onda2-dem20261123:agente/90-nginx-p007-onda2-dem20261123
git -C "$C" push origin agente/93-docker-onda2-dem20261123:agente/93-docker-onda2-dem20261123
git -C "$C" push origin agente/93-docker-p007-dem20261123:agente/93-docker-p007-dem20261123
git -C "$C" push origin agente/94-ci-dem20261123:agente/94-ci-dem20261123
git -C "$C" push origin agente/94-ci-onda2-dem20261123:agente/94-ci-onda2-dem20261123
git -C "$C" push origin agente/94-ci-onda3-r3:agente/94-ci-onda3-r3
git -C "$C" push origin agente/94-p0-01-format-depcruise:agente/94-p0-01-format-depcruise
git -C "$C" push origin agente/96-auth-onda3:agente/96-auth-onda3
git -C "$C" push origin agente/96-sessions-cookies-s90:agente/96-sessions-cookies-s90
git -C "$C" push origin agente/97-rbac-onda3:agente/97-rbac-onda3
git -C "$C" push origin agente/99-appsec-onda2-dem20261123:agente/99-appsec-onda2-dem20261123
git -C "$C" push origin agente/99-appsec-onda3:agente/99-appsec-onda3
git -C "$C" push origin agente/99-p0-02-semgrep-sync:agente/99-p0-02-semgrep-sync
git -C "$C" push origin agente/99-p0-07-bypass-estaticos:agente/99-p0-07-bypass-estaticos
git -C "$C" push origin agente/99-trivy-waivers-s90:agente/99-trivy-waivers-s90
git -C "$C" push origin base/dem-20261123-c286185c:base/dem-20261123-c286185c
git -C "$C" push origin consolidacao_backlog_birthub360:consolidacao_backlog_birthub360
git -C "$C" push origin coord/squad-10:coord/squad-10
git -C "$C" push origin coord/squad-20:coord/squad-20
git -C "$C" push origin coord/squad-30-v2:coord/squad-30-v2
git -C "$C" push origin coord/squad-40:coord/squad-40
git -C "$C" push origin coord/squad-50:coord/squad-50
git -C "$C" push origin coord/squad-60:coord/squad-60
git -C "$C" push origin coord/squad-70:coord/squad-70
git -C "$C" push origin coord/squad-80:coord/squad-80
git -C "$C" push origin coord/squad-90:coord/squad-90
git -C "$C" push origin docs/matriz-reconciliacao-20261124:docs/matriz-reconciliacao-20261124

# === FASE 3 — Push real clone D: — 19 branches exclusivas do D: ===
git -C "$D" push origin integracao/pos4-dem20261124:integracao/pos4-dem20261124
git -C "$D" push origin agente/06-idor-whatsapp-pos4:agente/06-idor-whatsapp-pos4
git -C "$D" push origin agente/09-review-onda4:agente/09-review-onda4
git -C "$D" push origin agente/17-cadence-tz-pos4:agente/17-cadence-tz-pos4
git -C "$D" push origin agente/22-api-idem-pos4:agente/22-api-idem-pos4
git -C "$D" push origin agente/44-cadences-onda4:agente/44-cadences-onda4
git -C "$D" push origin agente/46-forecast-s40:agente/46-forecast-s40
git -C "$D" push origin agente/51-bitrix-auth-onda4:agente/51-bitrix-auth-onda4
git -C "$D" push origin agente/56-whatsapp-onda4:agente/56-whatsapp-onda4
git -C "$D" push origin agente/63-stt-pos4:agente/63-stt-pos4
git -C "$D" push origin agente/64-stt-cmd-pos4:agente/64-stt-cmd-pos4
git -C "$D" push origin agente/64-voice-commands-onda4:agente/64-voice-commands-onda4
git -C "$D" push origin agente/69-optout-onda4:agente/69-optout-onda4
git -C "$D" push origin agente/69-optout-pos4:agente/69-optout-pos4
git -C "$D" push origin agente/72-tool-engine-onda4:agente/72-tool-engine-onda4
git -C "$D" push origin agente/85-mobile-idem-pos4:agente/85-mobile-idem-pos4
git -C "$D" push origin agente/85-mobile-offline-onda4:agente/85-mobile-offline-onda4
git -C "$D" push origin agente/99-sec-triage-pos4:agente/99-sec-triage-pos4
git -C "$D" push origin coord/squad-30:coord/squad-30

# NOTA pos4: integracao/pos4-dem20261124 = 9d4089f8f961d77e0789436f1f09840acaf73b82 (so no clone D:).
# Alternativa p/ centralizar no C:: git -C "$C" fetch "$D" integracao/pos4-dem20261124 && git -C "$C" branch -f integracao/pos4-dem20261124 FETCH_HEAD

# === FASE 4 — Verificacao pos-publicacao ===
git -C "$C" ls-remote origin > /tmp/ls-remote-after.txt
grep -F -f <(cut -f1 despacho08-inventario-branches.tsv | tail -n +2) /tmp/ls-remote-after.txt | wc -l   # esperado: 101
# conferir SHA de cada branch contra despacho08-inventario-branches.tsv

# === FASE 5 — PRs (somente apos gates; ver secao de bloqueadores do relatorio) ===
# BLOQUEADOR: enforce-governance.yml so aceita head ^agente/[0-9]{2}-.+ ou ^integracao/onda-[0-9]+$.
# integracao/*-dem2026112*, integracao/squad-*, preserve/*, coord/*, base/*, docs/*, consolidacao_backlog* FALHAM.
# gh pr create --base main --head <branch> ...  # APOS renomear ou ajustar workflow (decisao humana)
