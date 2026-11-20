# -*- coding: utf-8 -*-
import json, os

base = r'C:\Github\Birthub-360'
src = r'C:\Users\Marks\Desktop\HANDOFFS-PENDENTES-ONDAS-20261114.html'
# reuse data: re-run the generator logic by importing is complex; instead rebuild data quickly
d = json.load(open(os.path.join(base, 'docs/orchestration/handoffs-verificacao/_pendentes36.json'), encoding='utf-8'))

# wave membership: executor -> wave, and item lists per wave (same as before)
waves_def = [
 (1, 'Bloqueadores de segurança e dados', [
   '.agents/handoffs/12-para-01-voicehub-identidade-schema-adapters.md',
   '.agents/handoffs/onda-s1/00-para-01-documentembedding-sem-policy-rls.md',
   '.agents/handoffs/onda-v4-fase2/00-para-01-estruturacao-banco-rls.md',
   '.agents/handoffs/12-para-05-outbound-api-legado-tenancy.md',
   '.agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md',
   '.agents/handoffs/onda-landing-360-auditoria/auditoria-para-02-form-lead-fake.md']),
 (2, 'Produto, voz, LGPD e dados (alto)', [
   '.agents/handoffs/onda-paralela-8/00-para-01a-tenancy-audit.md',
   '.agents/handoffs/onda-landing-360-auditoria/auditoria-para-02-verdade-no-copy.md',
   '.agents/handoffs/00-para-02-cta-hub-ia-light-invisivel.md',
   '.agents/handoffs/15-para-02-03-sonar-new-coverage.md',
   '.agents/handoffs/00-para-12-17-voicehub-reactivacao.md',
   '.agents/handoffs/onda-saneamento-20261110/00-para-12-hotspots-severos-em-componentes-de-estudio-de-voz-overview-tsx-e-usest.md',
   '.agents/handoffs/00-para-21-lgpd-portal-titular.md',
   '.agents/handoffs/onda-landing-360-auditoria/02-para-21-validacao-consentimento-lgpd.md']),
 (3, 'Backend, IA, infraestrutura e prospecção', [
   '.agents/handoffs/00-para-17-07-orquestracao-sem-demo.md',
   '.agents/handoffs/15-para-07-commercial-mission-trace-consent-prisma.md',
   '.agents/handoffs/onda-2/15-para-07-webhook-fetch-safeFetch.md',
   '.agents/handoffs/onda-paralela-8/00-para-07-duplicate-exports.md',
   '.agents/handoffs/00-para-16-warroom-sse-heartbeat.md',
   '.agents/handoffs/onda-saneamento-20261110/17-para-05-market-intelligence-start-cadence-sem-optout.md',
   '.agents/handoffs/00-para-04-crm-hotspots-refactor.md',
   '.agents/handoffs/00-para-04-10-08-relatorios-forecast.md',
   '.agents/handoffs/15-para-00-rotacao-segredos-devstack-2375.md']),
 (4, 'QA, revisão independente e decisões', [
   '.agents/handoffs/00-para-08-cobertura-testes-modulos.md',
   '.agents/handoffs/00-para-08-mesa-tratamento-e2e-jornada.md',
   '.agents/handoffs/onda-1/15-para-08-rls-coverage-ci.md',
   '.agents/handoffs/00-para-24-revisao-leva-w7.md',
   '.agents/handoffs/00-para-24-revisao-pos-homologacao.md',
   '.agents/handoffs/onda-1/15-para-24-revisao-onda1.md',
   '.agents/handoffs/00-para-10-decisao-k8s-helm-argocd.md',
   '.agents/handoffs/00-para-01-02-settings-pilares-persistentes.md']),
]
coord_paths = [
 '.agents/handoffs/08-para-00-cobertura-modulos-gaps-produto.md',
 '.agents/handoffs/onda-00/09-para-00-offline-storage-sqlite.md',
 '.agents/handoffs/onda-saneamento-20261110/00-para-00-ausencia-de-sincronizacao-automatizada-entre-a-matriz-de-propriedade-d.md',
 '.agents/handoffs/onda-saneamento-20261110/00-para-00-leitura-obrigatoria-no-prompt-de-coordenacao-referencia-documento-de-o.md',
 '.agents/handoffs/proposta-navegacao-modulos-isolados.md',
]

def block(path):
    v = d[path]
    return f"  - `{path}` (status {v['status']}, {v['prio']}) — {v['prob']}"

def make_prompt(n, nome, paths):
    items = '\n'.join(block(p) for p in paths)
    return f"""Você é o Agente 00 — Orquestrador Geral do Birthub 360°. Execute a ONDA {n} do plano de saneamento de handoffs: "{nome}".

Antes de delegar, leia AGENTS.md, docs/orchestration/PROTOCOLO.md e docs/orchestration/demands/INDEX.md. Verifique o estado do Agent Bus (node .agents/bus/agent-cli.mjs status) e a branch principal.

DELEGAÇÃO — despache cada item abaixo ao agente responsável, respeitando slots exclusivos e propriedade de arquivos. Use o bus (agent-cli.mjs send --type TASK) e/ou subagentes (run_subagent) conforme o ambiente permitir. Cada missão deve conter: agente, objetivo, handoff a ler, fora de escopo, critérios de aceite e evidência exigida.

ITENS DESTA ONDA ({len(paths)} handoffs):
{items}

REGRAS:
- Máximo de agentes simultâneos nesta onda: conforme matriz (domínios disjuntos; nunca 01 e 01A juntos).
- Handoffs de schema/migrations → somente Agente 01. LGPD/tenancy/security → exigir parecer do Agente 24 antes de declarar resolvido.
- Mensagem enviada ≠ tarefa concluída: acompanhe ACKs e evidências no bus e nos journals.
- Não declarar handoff resolvido sem seção Resolução com evidência verificável.
- Ao final da onda: consolide resultados, atualize INDEX/registros e reporte bloqueios reais com causa e responsável.

AO FINAL, emita o relatório da onda: o que foi confirmado, o que falhou, o que ficou bloqueado e o que segue para a próxima onda."""

prompts = []
for n, nome, paths in waves_def:
    prompts.append({'n': n, 'nome': nome, 'count': len(paths), 'prompt': make_prompt(n, nome, paths)})

coord_prompt = f"""Você é o Agente 00 — Orquestrador Geral. Execute a TRILHA DE COORDENAÇÃO do plano de saneamento de handoffs (itens endereçados a você — não ocupam slot de especialista).

Leia AGENTS.md e docs/orchestration/PROTOCOLO.md. Para cada item: investigue o estado real no repositório, decida (resolver/documentar/abrir handoff para o dono correto/declarar bloqueio com causa), registre decisão no journal e atualize o handoff.

ITENS ({len(coord_paths)}):
{chr(10).join(block(p) for p in coord_paths)}

Critério de sucesso: cada item com decisão registrada e rastreável — nenhum pode ser simplesmente fechado sem evidência ou justificativa."""

data = {'waves': prompts, 'coord': coord_prompt}
js = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')

page = '''<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Prompts por Onda — Agente 00 — 2026-11-14</title>
<style>
body{margin:0;background:#0f1420;color:#e8ecf5;font:14px/1.55 "Segoe UI",system-ui,sans-serif}
header{padding:22px 28px;border-bottom:1px solid #2a3550}
h1{margin:0 0 6px;font-size:20px}.sub{color:#8b96ad;font-size:13px}
main{padding:20px 28px;max-width:1100px}
section{background:#171e2e;border:1px solid #2a3550;border-radius:14px;margin-bottom:20px;padding:0;overflow:hidden}
h2{margin:0;padding:14px 18px;font-size:16px;border-bottom:1px solid #2a3550}
h2 .c{color:#8b96ad;font-size:13px;font-weight:400}
pre{margin:0;padding:16px;white-space:pre-wrap;word-break:break-word;font:12.5px/1.6 Consolas,monospace;color:#cfe0ff;max-height:560px;overflow:auto}
button{background:#1d3350;color:#4da3ff;border:1px solid #4da3ff;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;margin:12px 16px}
button:hover{background:#25406b}
.note{color:#8b96ad;font-size:12.5px;padding:0 16px 14px}
</style></head><body>
<header><h1>Prompts de Orquestração por Onda — Agente 00</h1>
<div class="sub">2026-11-14 · DEM-20261114-002 · Um prompt por onda: cole na sessão do Agente 00 para que ele delegue aos especialistas responsáveis</div></header>
<main id="app"></main>
<script>
const DATA=__DATA__;
const app=document.getElementById('app');
for(const w of DATA.waves){
 app.insertAdjacentHTML('beforeend','<section><h2>Onda '+w.n+' — '+w.nome+' <span class="c">'+w.count+' handoffs</span></h2><pre>'+w.prompt.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre><button onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">copiar prompt</button><div class="note">Delegação via Agent Bus (:4100) e/ou subagentes · registrar em docs/orchestration/ · gate antes da próxima onda</div></section>');
}
app.insertAdjacentHTML('beforeend','<section style="border-color:#4a2c14"><h2>Trilha do Orquestrador — itens endereçados ao 00 <span class="c">5 itens</span></h2><pre>'+DATA.coord.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre><button onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">copiar prompt</button><div class="note">Pode rodar em paralelo às ondas — não consome slot de especialista</div></section>');
</script></body></html>'''

out = page.replace('__DATA__', js)
dst = r'C:\Users\Marks\Desktop\PROMPTS-ONDAS-AGENTE00-20261114.html'
open(dst, 'w', encoding='utf-8').write(out)
print(dst, os.path.getsize(dst) // 1024, 'KB')
