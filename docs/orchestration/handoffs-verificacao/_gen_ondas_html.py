# -*- coding: utf-8 -*-
import json, os

base = r'C:\Github\Birthub-360'
d = json.load(open(os.path.join(base, 'docs/orchestration/handoffs-verificacao/_pendentes36.json'), encoding='utf-8'))

def item(path, executor, extra=''):
    v = d[path]
    return {'path': path, 'de': v['de'], 'para': v['para'], 'prio': v['prio'], 'status': v['status'],
            'executor': executor, 'prob': v['prob'], 'extra': extra}

waves = [
 {'n': 1, 'nome': 'Bloqueadores de segurança e dados', 'max': '4 agentes', 'items': [
   item('.agents/handoffs/12-para-01-voicehub-identidade-schema-adapters.md', '01', 'BLOQUEADOR — schema + adapters'),
   item('.agents/handoffs/onda-s1/00-para-01-documentembedding-sem-policy-rls.md', '01', 'BLOQUEADOR — RLS default-deny'),
   item('.agents/handoffs/onda-v4-fase2/00-para-01-estruturacao-banco-rls.md', '01', 'BLOQUEADO — modelo V4 RLS'),
   item('.agents/handoffs/12-para-05-outbound-api-legado-tenancy.md', '05', 'BLOQUEADOR — tenancy API legada'),
   item('.agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md', '10', 'BLOQUEADOR prático — Docker TCP 2375'),
   item('.agents/handoffs/onda-landing-360-auditoria/auditoria-para-02-form-lead-fake.md', '02', 'BLOQUEADOR — form de lead cenográfico'),
 ]},
 {'n': 2, 'nome': 'Produto, voz, LGPD e dados (alto)', 'max': '5 agentes', 'items': [
   item('.agents/handoffs/onda-paralela-8/00-para-01a-tenancy-audit.md', '01A', 'alto técnico — auditoria tenant CRM'),
   item('.agents/handoffs/onda-landing-360-auditoria/auditoria-para-02-verdade-no-copy.md', '02', 'alto — métricas/depoimentos fabricados'),
   item('.agents/handoffs/00-para-02-cta-hub-ia-light-invisivel.md', '02', 'CTA invisível no tema light'),
   item('.agents/handoffs/15-para-02-03-sonar-new-coverage.md', '02+03', 'alto bloqueante — new_coverage 60,6% < 80%'),
   item('.agents/handoffs/00-para-12-17-voicehub-reactivacao.md', '12+17', 'alto — reativação VoiceHub/Outbound/Dialer'),
   item('.agents/handoffs/onda-saneamento-20261110/00-para-12-hotspots-severos-em-componentes-de-estudio-de-voz-overview-tsx-e-usest.md', '12', 'alto — hotspots Overview.tsx/useStudioStore'),
   item('.agents/handoffs/00-para-21-lgpd-portal-titular.md', '21', 'alto — portal do titular LGPD'),
   item('.agents/handoffs/onda-landing-360-auditoria/02-para-21-validacao-consentimento-lgpd.md', '21', 'alto — opt-in pré-marcado inválido'),
   item('.agents/handoffs/onda-8/09-para-02-downloads-blob-nao-funcionam-no-app.md', '02', 'REAGENDADO — downloads blob quebrados no app (ex-postponed freeze)'),
   item('.agents/handoffs/onda-8/09-para-02-voice-command-nao-funciona-no-app.md', '02', 'REAGENDADO — comando de voz sem plugin instalado (ex-postponed freeze)'),
   item('.agents/handoffs/onda-38/00-para-02-03-redesign-plataforma.md', '02+03', 'REAGENDADO — redesign plataforma em freeze; decidir retomar/fechar'),
 ]},
 {'n': 3, 'nome': 'Backend, IA, infraestrutura e prospecção', 'max': '5 agentes', 'items': [
   item('.agents/handoffs/00-para-17-07-orquestracao-sem-demo.md', '17+07', 'Vendas/Playbooks consomem seed como real'),
   item('.agents/handoffs/15-para-07-commercial-mission-trace-consent-prisma.md', '07', 'trace usa client injetado sem escopo tenant'),
   item('.agents/handoffs/onda-2/15-para-07-webhook-fetch-safeFetch.md', '07', 'safeFetch/webhook residual'),
   item('.agents/handoffs/onda-paralela-8/00-para-07-duplicate-exports.md', '07', 'exports duplicados (knip)'),
   item('.agents/handoffs/00-para-16-warroom-sse-heartbeat.md', '16', 'War Room SSE/heartbeat'),
   item('.agents/handoffs/onda-saneamento-20261110/17-para-05-market-intelligence-start-cadence-sem-optout.md', '05', 'ALTO LGPD — START_SDR_CADENCE sem opt-out'),
   item('.agents/handoffs/00-para-04-crm-hotspots-refactor.md', '04', 'CrmBoard/PrismaCrm360Repository hotspots'),
   item('.agents/handoffs/00-para-04-10-08-relatorios-forecast.md', '04+10+08', 'inventário relatórios/forecast/War Room'),
   item('.agents/handoffs/15-para-00-rotacao-segredos-devstack-2375.md', '15', 'rotação de segredos pós-exposição 2375'),
 ]},
 {'n': 4, 'nome': 'QA, revisão independente e decisões', 'max': '4 agentes', 'items': [
   item('.agents/handoffs/00-para-08-cobertura-testes-modulos.md', '08', 'módulos sem teste dedicado'),
   item('.agents/handoffs/00-para-08-mesa-tratamento-e2e-jornada.md', '08', 'jornada E2E mesa de tratamento'),
   item('.agents/handoffs/onda-1/15-para-08-rls-coverage-ci.md', '08+01+15', 'gate RLS coverage no CI'),
   item('.agents/handoffs/00-para-24-revisao-leva-w7.md', '24', 'revisão leva W7'),
   item('.agents/handoffs/00-para-24-revisao-pos-homologacao.md', '24', 'parecer pós-homologação'),
   item('.agents/handoffs/onda-1/15-para-24-revisao-onda1.md', '24', 'revisão Onda 1 — provável stale (PR #275)'),
   item('.agents/handoffs/00-para-10-decisao-k8s-helm-argocd.md', '10', 'decisão formal k8s/charts/argocd'),
   item('.agents/handoffs/00-para-01-02-settings-pilares-persistentes.md', '01+02', '8 rotas settings_<pillar> sem persistência'),
 ]},
]
coord = [
 item('.agents/handoffs/08-para-00-cobertura-modulos-gaps-produto.md', '00', '3 critérios de aceite não atendidos — consolidar com 08'),
 item('.agents/handoffs/onda-00/09-para-00-offline-storage-sqlite.md', '00', 'fila offline persistia em SQLite — verificar correção'),
 item('.agents/handoffs/onda-saneamento-20261110/00-para-00-ausencia-de-sincronizacao-automatizada-entre-a-matriz-de-propriedade-d.md', '00', 'BT360-DT-0004 — sync matriz propriedade x dependency-cruiser'),
 item('.agents/handoffs/onda-saneamento-20261110/00-para-00-leitura-obrigatoria-no-prompt-de-coordenacao-referencia-documento-de-o.md', '00', 'BT360-DT-0001 — prompt de coordenação cita doc inexistente'),
 item('.agents/handoffs/proposta-navegacao-modulos-isolados.md', '00', 'proposta navegação módulos isolados — decisão'),
]

def prompt(it):
    first = it['executor'].split('+')[0]
    return ("Você é o Agente " + it['executor'] + ". Leia AGENTS.md, .agents/prompts/ do seu ID e o handoff completo em `" + it['path'] + "` antes de planejar.\n"
            "Missão: resolver o handoff acima (status " + it['status'] + ", prioridade " + it['prio'] + ").\n"
            "Problema registrado: " + it['prob'] + "\n"
            "Restrições: respeitar propriedade de arquivos (AGENTS.md §15), não alterar schema/migrations se não for o 01, não alterar prompts, evidência verificável obrigatória (comando/teste/commit).\n"
            "Critério de sucesso: correção implementada + testes executados + seção Resolução preenchida no handoff com evidências; handoffs de schema/LGPD/tenancy/security exigem revisão do Agente 24 antes de declarar resolvido.\n"
            "Ao concluir: atualize o status do handoff, registre no seu journal (docs/orchestration/journal/) e notifique o Agente 00 pelo Agent Bus: node .agents/bus/agent-cli.mjs send --from " + first + " --to 00 --type ACK --subject \"" + it['path'].split('/')[-1] + "\" --message \"<resumo+evidências>\".")

data = {'waves': [], 'coord': []}
for w in waves:
    data['waves'].append({'n': w['n'], 'nome': w['nome'], 'max': w['max'],
        'items': [{k: it[k] for k in ('path', 'de', 'para', 'prio', 'status', 'executor', 'prob')} | {'prompt': prompt(it)} for it in w['items']]})
for it in coord:
    data['coord'].append({k: it[k] for k in ('path', 'de', 'para', 'prio', 'status', 'executor', 'prob')} | {'prompt': prompt(it)})

js = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')

head = r'''<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Handoffs Pendentes — Ondas de Execução — 2026-11-14</title>
<style>
:root{--bg:#0f1420;--card:#171e2e;--line:#2a3550;--txt:#e8ecf5;--mut:#8b96ad;--acc:#4da3ff;--ok:#3ddc97;--warn:#ffb454;--bad:#ff6b6b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:14px/1.5 "Segoe UI",system-ui,sans-serif}
header{padding:22px 28px;border-bottom:1px solid var(--line)}
h1{margin:0 0 6px;font-size:21px}.sub{color:var(--mut);font-size:13px}
main{padding:20px 28px;max-width:1400px}
.wave{background:var(--card);border:1px solid var(--line);border-radius:14px;margin-bottom:22px;overflow:hidden}
.wave>h2{margin:0;padding:14px 18px;font-size:16px;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.badge{background:#1d3350;color:var(--acc);border-radius:20px;padding:2px 12px;font-size:12px;font-weight:600}
.badge.max{background:#2a2140;color:#c9a7ff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(430px,1fr));gap:14px;padding:16px}
.card{background:#101828;border:1px solid var(--line);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px}
.card .path{font-family:Consolas,monospace;font-size:11.5px;color:#a9c4ff;word-break:break-all}
.meta{display:flex;gap:8px;flex-wrap:wrap;font-size:11.5px}
.pill{display:inline-block;padding:1px 9px;border-radius:20px;font-size:11px;font-weight:600}
.p-aberto{background:#4a2c14;color:var(--warn)}.p-bloqueado{background:#4a1d1d;color:var(--bad)}
.prio-bloqueador{background:#4a1d1d;color:var(--bad)}.prio-alto{background:#4a2c14;color:var(--warn)}.prio-normal{background:#1d3350;color:var(--acc)}
.ex{background:#143a2d;color:var(--ok)}
.prob{color:var(--mut);font-size:12.5px}
details{margin-top:4px}
summary{cursor:pointer;color:var(--acc);font-size:12.5px;font-weight:600}
pre{background:#0b1120;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:11.5px;white-space:pre-wrap;word-break:break-word;color:#cfe0ff;max-height:340px;overflow:auto}
.coord h2{color:var(--warn)}
.note{background:#1a2338;border-left:3px solid var(--acc);padding:10px 14px;border-radius:0 8px 8px 0;color:var(--mut);font-size:12.5px;margin:0 28px 20px}
button.copy{background:#1d3350;color:var(--acc);border:1px solid var(--acc);border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;align-self:flex-start}
button.copy:hover{background:#25406b}
</style></head><body>
<header><h1>Handoffs Pendentes — Plano de Ondas de Execução</h1>
<div class="sub">2026-11-14 · DEM-20261114-002 · 36 itens (35 abertos + 1 bloqueado) · máximo 5 agentes/onda, domínios disjuntos, slots exclusivos respeitados (01↔01A, 16↔06/07 em src/lib/queue)</div></header>
<div class="note"><b>Regras das ondas:</b> cada agente trabalha em branch/worktree próprios; prompts são para colar na sessão do especialista; handoffs de schema/LGPD/tenancy/security exigem parecer do Agente 24 antes de fechar; itens marcados "decisão" dependem de validação humana. Ondas são sequenciais — inicie a próxima só após gate da anterior.</div>
<main id="app"></main>
<script>
const DATA=__DATA__;
const app=document.getElementById('app');
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function card(it){
 const prio=it.prio.toLowerCase().includes('bloque')?'prio-bloqueador':it.prio.toLowerCase().includes('alto')?'prio-alto':'prio-normal';
 return '<div class="card">'
  +'<div class="path">'+esc(it.path)+'</div>'
  +'<div class="meta"><span class="pill '+prio+'">'+esc(it.prio)+'</span><span class="pill p-'+it.status.toLowerCase().replace(/[^a-z-]/g,'-')+'">'+esc(it.status)+'</span><span class="pill ex">Executor: '+esc(it.executor)+'</span><span class="pill" style="background:#1d2740;color:var(--mut)">De: '+esc(it.de)+' → Para: '+esc(it.para)+'</span></div>'
  +'<div class="prob">'+esc(it.prob)+'</div>'
  +'<details><summary>Prompt pronto para o agente</summary><button class="copy" onclick="navigator.clipboard.writeText(this.parentElement.querySelector(\'pre\').textContent)">copiar</button><pre>'+esc(it.prompt)+'</pre></details>'
  +'</div>';
}
for(const w of DATA.waves){
 app.insertAdjacentHTML('beforeend','<section class="wave"><h2>Onda '+w.n+' — '+esc(w.nome)+' <span class="badge">'+new Set(w.items.map(i=>i.executor)).size+' agentes</span><span class="badge max">máx '+esc(w.max)+'</span><span class="badge" style="background:#143a2d;color:var(--ok)">'+w.items.length+' handoffs</span></h2><div class="grid">'+w.items.map(card).join('')+'</div></section>');
}
app.insertAdjacentHTML('beforeend','<section class="wave coord"><h2>Trilha do Orquestrador (Agente 00) — sem slot de execução <span class="badge" style="background:#4a2c14;color:var(--warn)">'+DATA.coord.length+' itens</span></h2><div class="grid">'+DATA.coord.map(card).join('')+'</div></section>');
</script></body></html>'''

out = head.replace('__DATA__', js)
dst = r'C:\Users\Marks\Desktop\HANDOFFS-PENDENTES-ONDAS-20261114.html'
open(dst, 'w', encoding='utf-8').write(out)
print(dst, os.path.getsize(dst) // 1024, 'KB')
print('waves:', [(w['n'], len(w['items'])) for w in data['waves']], 'coord:', len(data['coord']))
print('total:', sum(len(w['items']) for w in data['waves']) + len(data['coord']))
