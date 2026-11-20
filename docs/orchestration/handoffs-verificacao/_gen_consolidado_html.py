# -*- coding: utf-8 -*-
# Consolida TODAS as fontes de trabalho designado (demandas, backlog 17 ondas,
# plano mestre 52 dívidas, handoffs pendentes, handoffs resolvidos c/ problema,
# outros planos e prompts) em UM unico HTML com checklist por onda e por agente.
import json, os, re, csv, unicodedata, html as ihtml

BASE = r'C:\Github\Birthub-360'
HV = os.path.join(BASE, 'docs', 'orchestration', 'handoffs-verificacao')
OUT_REPO = os.path.join(HV, 'CONSOLIDADO-GERAL-20261114.html')
OUT_DESK = r'C:\Users\Marks\Desktop\CONSOLIDADO-GERAL-20261114.html'
BACKLOG = r'C:\Users\Marks\Desktop\TUDO\MARCELO\BACKLOG-PLATAFORMA-ONDAS.html'

def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', s.lower()).strip()

# ---------- load matrix ----------
matrix = {}
with open(os.path.join(BASE, '.agents', 'handoffs', '_MATRIX.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        matrix[row['path']] = row

verdicts = json.load(open(os.path.join(HV, '_verdicts.json'), encoding='utf-8'))
verdict_by_base = {os.path.basename(k): v for k, v in verdicts.items()}

def handoff_status(path):
    """path como '.agents/handoffs/...' -> (status declarado, verdict ou '')"""
    row = matrix.get(path, {})
    return row.get('status', '?'), verdict_by_base.get(os.path.basename(path), '')

# ---------- 1. DEMANDS ----------
demands = [
    ('DEM-20261112-001', 'Teste do protocolo (00 ↔ 18)', '18', 'CONCLUÍDA', 'Prova de comunicação bidirecional e registro de intervenção.'),
    ('DEM-20261113-001', 'Implantação e verificação do protocolo permanente no Devin', '00', 'CONCLUÍDA', 'Regra always-on + journals dos 26 agentes + teste real 00→22→00.'),
    ('DEM-20261113-002', 'Execução do Backlog de Ondas — programa de 17 ondas / 125 itens', '00 → 15/01/21', 'EM_ANDAMENTO', 'Onda 1 mergeada (PR #275); Onda 2 mergeada (PRs #267+); ondas 3–17 pendentes.'),
    ('DEM-20261113-003', 'Implantação Permanente do Protocolo Mestre Multiagente', '00 → 22/24', 'EM_CORREÇÃO', 'REPROVADO pelo 24 por evidência de sessão independente; correções parciais mergeadas via PRs #289/#294.'),
    ('DEM-20261113-004', 'Nova Tela Inicial (Home) e Identidade dos 11 Módulos', '00 → 02/03/08/24', 'CONCLUÍDA', 'Home central + 3 propostas + identidade cromática; 24 APROVADO; mergeada (PR #294).'),
    ('DEM-20261113-004†', 'Missão Mestre de Identidade Visual (auditoria + Brandbook V2 + DS + Motion)', '00 → F01/F02/F03', 'EM_VALIDAÇÃO', 'Branch agente/00-identidade-v2 commit 07bfc7304; PR #300 aberto.'),
    ('DEM-20261114-001', 'Auditoria de Design, UX, Usabilidade e Rotas', '00 → 02/03/22', 'EM_ANDAMENTO', 'Checklist: subagentes executados? consolidação? relatório entregue? — pendente no INDEX.'),
    ('DEM-20261114-001†', 'Consolidação do Protocolo Mestre Permanente (re-emissão)', '00 → 22/24', 'CONCLUÍDA', 'PROTOCOLO_QUALIDADE_E_ACEITE mergeado (PR #289); integração auditada APROVADO pelo 24.'),
    ('DEM-20261114-002', 'Matriz de handoffs e verificação dos resolvidos', '00 + clusters', 'EM_VALIDAÇÃO', 'Onda 1 concluída: 386 CONFIRMADOS / 12 SEM-EVIDÊNCIA / 38 DÚVIDA; reconciliação aguarda autorização.'),
]

# ---------- 2. BACKLOG 125 itens / 17 ondas ----------
bhtml = open(BACKLOG, encoding='utf-8', errors='replace').read()
# split into wave blocks by '<div class="wave">' markers
positions = [mm.start() for mm in re.finditer(r'<div class="wave">', bhtml)]
backlog_waves = []
for i, pos in enumerate(positions):
    end = positions[i+1] if i+1 < len(positions) else len(bhtml)
    block = bhtml[pos:end]
    m = re.search(r'<h2>(Onda\s*\d+[^<]*)</h2>', block)
    meta_m = re.search(r'<span class="meta">(.*?)</span>', block, re.S)
    title = m.group(1).strip() if m else '?'
    meta = re.sub(r'<[^>]+>', '', meta_m.group(1)).strip() if meta_m else ''
    items = []
    marks = [mm.start() for mm in re.finditer(r'<div class="item">', block)]
    for j, ipos in enumerate(marks):
        iend = marks[j+1] if j+1 < len(marks) else len(block)
        it = block[ipos:iend]
        iid = re.search(r'<span class="id">(.*?)</span>', it)
        ag = re.search(r'<span class="agent">(.*?)</span>', it)
        h3 = re.search(r'<h3>(.*?)</h3>', it)
        p = re.search(r'<p>(.*?)</p>', it)
        badge = re.search(r'<span class="badge [^"]*">(.*?)</span>', it)
        items.append({
            'id': iid.group(1).strip() if iid else '?',
            'tipo': badge.group(1).strip() if badge else '',
            'agente': ag.group(1).strip() if ag else '?',
            'titulo': re.sub(r'<[^>]+>', '', h3.group(1)).strip() if h3 else '',
            'desc': re.sub(r'<[^>]+>', '', p.group(1)).strip() if p else '',
        })
    backlog_waves.append({'title': title, 'meta': meta, 'items': items})

WAVE_STATUS = {
    1: ('MERGEADA', 'PR #275 em 2026-11-13; checklist da DEM-002 com "Gates + relatório + revisão 24" ainda aberto'),
    2: ('MERGEADA', 'PRs #267 + integração/onda-2 conforme DEM-20261113-002'),
}
for i, w in enumerate(backlog_waves, 1):
    n = int(re.search(r'\d+', w['title']).group()) if re.search(r'\d+', w['title']) else i
    st, note = WAVE_STATUS.get(n, ('PENDENTE', ''))
    w['status'] = st
    w['note'] = note
    w['n'] = n

# ---------- 3. PLANO MESTRE — 52 dívidas ----------
div_md = open(os.path.join(BASE, 'docs', 'auditorias', 'plano-mestre-consolidado', 'BIRTHUB360_DIVIDAS_PENDENTES.md'), encoding='utf-8').read()
debts = []
for line in div_md.splitlines():
    if not line.startswith('| **BT360-DT-'):
        continue
    cells = [c.strip() for c in line.strip('|').split('|')]
    if len(cells) < 6:
        continue
    debt_id = cells[0].replace('*', '').strip()
    agente = cells[2].replace('*', '').strip()
    # layouts: A) id,ref,agente,prio,tarefa,local,resumo (§2.5, 7 col)
    #          B) id,ref,agente,tarefa,local,problema (§2.1-2.4, 6 col)
    #          C) id,ref,agente,tarefa,local,linhas,diagnostico (§2.3, 7 col)
    if 'TAREFA' in cells[3]:
        prio = ''
        tarefa = cells[3].replace('`', '').replace('*', '').strip()
        local = cells[4] if len(cells) > 4 else ''
        if len(cells) >= 7 and re.match(r'^[\d.,]+L$|^—$', cells[5].strip()):
            resumo = cells[6]
        else:
            resumo = cells[5] if len(cells) > 5 else ''
    else:
        prio = cells[3].replace('*', '').strip()
        tarefa = cells[4].replace('`', '').replace('*', '').strip()
        local = cells[5] if len(cells) > 5 else ''
        resumo = cells[6] if len(cells) > 6 else ''
    debts.append({'id': debt_id, 'agente': agente, 'prio': prio, 'tarefa': tarefa,
                  'local': local, 'resumo': resumo})

# wave mapping (from PLANO_MESTRE_SANEAMENTO.md)
DEBT_WAVE = {
    'BT360-DT-0072': 0, 'BT360-DT-0001': 0, 'BT360-DT-0048': 0,
    'BT360-DT-0008': 1, 'BT360-DT-0010': 1, 'BT360-DT-0013': 1, 'BT360-DT-0086': 1, 'BT360-DT-0087': 1, 'BT360-DT-0009': 1,
    'BT360-DT-0057': 2, 'BT360-DT-0070': 2, 'BT360-DT-0071': 2, 'BT360-DT-0073': 2, 'BT360-DT-0074': 2,
    'BT360-DT-0030': 3, 'BT360-DT-0032': 3, 'BT360-DT-0035': 3, 'BT360-DT-0036': 3, 'BT360-DT-0063': 3, 'BT360-DT-0080': 3,
    'BT360-DT-0065': 4, 'BT360-DT-0027': 4, 'BT360-DT-0028': 4, 'BT360-DT-0039': 4, 'BT360-DT-0040': 4, 'BT360-DT-0041': 4,
    'BT360-DT-0067': 4, 'BT360-DT-0068': 4, 'BT360-DT-0093': 4, 'BT360-DT-0094': 4,
    'BT360-DT-0017': 5, 'BT360-DT-0015': 5, 'BT360-DT-0014': 5, 'BT360-DT-0016': 5, 'BT360-DT-0020': 5,
    'BT360-DT-0024': 5, 'BT360-DT-0054': 5, 'BT360-DT-0060': 5, 'BT360-DT-0082': 5, 'BT360-DT-0089': 5,
    'BT360-DT-0090': 5, 'BT360-DT-0059': 5,
}

# candidate handoffs for matching: saneamento-20261110 + root-level recent
candidates = []
for path, row in matrix.items():
    if 'onda-saneamento-20261110' in path or path.startswith('.agents/handoffs/00-'):
        candidates.append(path)

def best_match(debt):
    q = norm(debt['local'] + ' ' + debt['resumo'])
    qtokens = set(q.split())
    best, bs = None, 0.0
    for path in candidates:
        fname = norm(os.path.basename(path).replace('.md', ''))
        ftokens = set(fname.split())
        if not ftokens:
            continue
        inter = len(qtokens & ftokens)
        # containment: how much of the filename is explained by the debt text
        score = inter / max(1, len(ftokens))
        if score > bs:
            bs, best = score, path
    return (best if bs >= 0.30 else None), bs

DEBT_OVERRIDE = {
    'BT360-DT-0030': '.agents/handoffs/onda-saneamento-20261110/00-para-06-tres-paineis-monoliticos-gigantescos-na-interface-de-gerenciamento-de.md',
    'BT360-DT-0065': '.agents/handoffs/onda-saneamento-20261110/00-para-13-supervisor-de-enxame-atinge-o-limite-exato-de-1000-linhas-com-acoplame.md',
    'BT360-DT-0015': '.agents/handoffs/onda-saneamento-20261110/00-para-02-hotspot-estrutural-no-componente-central-crmboard-tsx-acumulando-multi.md',
    'BT360-DT-0072': '.agents/handoffs/onda-saneamento-20261110/00-para-15-urls-de-autenticacao-com-tokens-magicos-e-links-de-redefinicao-de-senh.md',
    'BT360-DT-0017': '.agents/handoffs/onda-saneamento-20261110/00-para-03-proliferacao-de-declaracoes-important-em-folhas-de-estilo-quebrando-a.md',
    'BT360-DT-0016': '.agents/handoffs/onda-saneamento-20261110/00-para-02-acoplamento-excessivo-e-orquestracao-de-side-effects-em-src-app-tsx.md',
    'BT360-DT-0014': '.agents/handoffs/onda-saneamento-20261110/00-para-02-leitura-de-notificacao-broadcast-em-entidade-compartilhada-silencia-un.md',
}

for d in debts:
    d['wave'] = DEBT_WAVE.get(d['id'])
    ov = DEBT_OVERRIDE.get(d['id'])
    path, score = (ov, 1.0) if ov else best_match(d)
    d['handoff'] = path or ''
    d['match'] = round(score, 2)
    if path:
        st, vd = handoff_status(path)
        d['status'], d['verdict'] = st, vd
    else:
        d['status'], d['verdict'] = 'SEM-HANDOFF', ''

# ---------- 4. PENDENTES 36 (waves 1-4 + coord) ----------
pend = json.load(open(os.path.join(HV, '_pendentes36.json'), encoding='utf-8'))

def mkitem(path, executor, extra=''):
    v = pend[path]
    return {'path': path, 'de': v['de'], 'para': v['para'], 'prio': v['prio'],
            'status': v['status'], 'executor': executor, 'prob': v['prob'], 'extra': extra}

exec_waves = [
    {'n': 1, 'nome': 'Bloqueadores de segurança e dados', 'max': '4 agentes', 'items': [
        mkitem('.agents/handoffs/12-para-01-voicehub-identidade-schema-adapters.md', '01', 'BLOQUEADOR — schema + adapters'),
        mkitem('.agents/handoffs/onda-s1/00-para-01-documentembedding-sem-policy-rls.md', '01', 'BLOQUEADOR — RLS default-deny'),
        mkitem('.agents/handoffs/onda-v4-fase2/00-para-01-estruturacao-banco-rls.md', '01', 'BLOQUEADO — modelo V4 RLS'),
        mkitem('.agents/handoffs/12-para-05-outbound-api-legado-tenancy.md', '05', 'BLOQUEADOR — tenancy API legada'),
        mkitem('.agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md', '10', 'BLOQUEADOR prático — Docker TCP 2375'),
        mkitem('.agents/handoffs/onda-landing-360-auditoria/auditoria-para-02-form-lead-fake.md', '02', 'BLOQUEADOR — form de lead cenográfico'),
    ]},
    {'n': 2, 'nome': 'Produto, voz, LGPD e dados (alto)', 'max': '5 agentes', 'items': [
        mkitem('.agents/handoffs/onda-paralela-8/00-para-01a-tenancy-audit.md', '01A', 'alto técnico — auditoria tenant CRM'),
        mkitem('.agents/handoffs/onda-landing-360-auditoria/auditoria-para-02-verdade-no-copy.md', '02', 'alto — métricas/depoimentos fabricados'),
        mkitem('.agents/handoffs/00-para-02-cta-hub-ia-light-invisivel.md', '02', 'CTA invisível no tema light'),
        mkitem('.agents/handoffs/15-para-02-03-sonar-new-coverage.md', '02+03', 'alto bloqueante — new_coverage 60,6% < 80%'),
        mkitem('.agents/handoffs/00-para-12-17-voicehub-reactivacao.md', '12+17', 'alto — reativação VoiceHub/Outbound/Dialer'),
        mkitem('.agents/handoffs/onda-saneamento-20261110/00-para-12-hotspots-severos-em-componentes-de-estudio-de-voz-overview-tsx-e-usest.md', '12', 'alto — hotspots Overview.tsx/useStudioStore'),
        mkitem('.agents/handoffs/00-para-21-lgpd-portal-titular.md', '21', 'alto — portal do titular LGPD'),
        mkitem('.agents/handoffs/onda-landing-360-auditoria/02-para-21-validacao-consentimento-lgpd.md', '21', 'alto — opt-in pré-marcado inválido'),
        mkitem('.agents/handoffs/onda-8/09-para-02-downloads-blob-nao-funcionam-no-app.md', '02', 'REAGENDADO — downloads blob quebrados no app (ex-postponed freeze)'),
        mkitem('.agents/handoffs/onda-8/09-para-02-voice-command-nao-funciona-no-app.md', '02', 'REAGENDADO — comando de voz sem plugin instalado (ex-postponed freeze)'),
        mkitem('.agents/handoffs/onda-38/00-para-02-03-redesign-plataforma.md', '02+03', 'REAGENDADO — redesign plataforma em freeze; decidir retomar/fechar'),
    ]},
    {'n': 3, 'nome': 'Backend, IA, infraestrutura e prospecção', 'max': '5 agentes', 'items': [
        mkitem('.agents/handoffs/00-para-17-07-orquestracao-sem-demo.md', '17+07', 'Vendas/Playbooks consomem seed como real'),
        mkitem('.agents/handoffs/15-para-07-commercial-mission-trace-consent-prisma.md', '07', 'trace usa client injetado sem escopo tenant'),
        mkitem('.agents/handoffs/onda-2/15-para-07-webhook-fetch-safeFetch.md', '07', 'safeFetch/webhook residual'),
        mkitem('.agents/handoffs/onda-paralela-8/00-para-07-duplicate-exports.md', '07', 'exports duplicados (knip)'),
        mkitem('.agents/handoffs/00-para-16-warroom-sse-heartbeat.md', '16', 'War Room SSE/heartbeat'),
        mkitem('.agents/handoffs/onda-saneamento-20261110/17-para-05-market-intelligence-start-cadence-sem-optout.md', '05', 'ALTO LGPD — START_SDR_CADENCE sem opt-out'),
        mkitem('.agents/handoffs/00-para-04-crm-hotspots-refactor.md', '04', 'CrmBoard/PrismaCrm360Repository hotspots'),
        mkitem('.agents/handoffs/00-para-04-10-08-relatorios-forecast.md', '04+10+08', 'inventário relatórios/forecast/War Room'),
        mkitem('.agents/handoffs/15-para-00-rotacao-segredos-devstack-2375.md', '15', 'rotação de segredos pós-exposição 2375'),
    ]},
    {'n': 4, 'nome': 'QA, revisão independente e decisões', 'max': '4 agentes', 'items': [
        mkitem('.agents/handoffs/00-para-08-cobertura-testes-modulos.md', '08', 'módulos sem teste dedicado'),
        mkitem('.agents/handoffs/00-para-08-mesa-tratamento-e2e-jornada.md', '08', 'jornada E2E mesa de tratamento'),
        mkitem('.agents/handoffs/onda-1/15-para-08-rls-coverage-ci.md', '08+01+15', 'gate RLS coverage no CI'),
        mkitem('.agents/handoffs/00-para-24-revisao-leva-w7.md', '24', 'revisão leva W7'),
        mkitem('.agents/handoffs/00-para-24-revisao-pos-homologacao.md', '24', 'parecer pós-homologação'),
        mkitem('.agents/handoffs/onda-1/15-para-24-revisao-onda1.md', '24', 'revisão Onda 1 — provável stale (PR #275)'),
        mkitem('.agents/handoffs/00-para-10-decisao-k8s-helm-argocd.md', '10', 'decisão formal k8s/charts/argocd'),
        mkitem('.agents/handoffs/00-para-01-02-settings-pilares-persistentes.md', '01+02', '8 rotas settings_<pillar> sem persistência'),
    ]},
]
coord_items = [
    mkitem('.agents/handoffs/08-para-00-cobertura-modulos-gaps-produto.md', '00', '3 critérios de aceite não atendidos — consolidar com 08'),
    mkitem('.agents/handoffs/onda-00/09-para-00-offline-storage-sqlite.md', '00', 'fila offline persistia em SQLite — verificar correção'),
    mkitem('.agents/handoffs/onda-saneamento-20261110/00-para-00-ausencia-de-sincronizacao-automatizada-entre-a-matriz-de-propriedade-d.md', '00', 'BT360-DT-0004 — sync matriz propriedade x dependency-cruiser'),
    mkitem('.agents/handoffs/onda-saneamento-20261110/00-para-00-leitura-obrigatoria-no-prompt-de-coordenacao-referencia-documento-de-o.md', '00', 'BT360-DT-0001 — prompt de coordenação cita doc inexistente'),
    mkitem('.agents/handoffs/proposta-navegacao-modulos-isolados.md', '00', 'proposta navegação módulos isolados — decisão'),
]

def prompt_for(it):
    first = it['executor'].split('+')[0]
    return ("Você é o Agente " + it['executor'] + ". Leia AGENTS.md, .agents/prompts/ do seu ID e o handoff completo em `" + it['path'] + "` antes de planejar.\n"
            "Missão: resolver o handoff acima (status " + it['status'] + ", prioridade " + it['prio'] + ").\n"
            "Problema registrado: " + it['prob'] + "\n"
            "Restrições: respeitar propriedade de arquivos (AGENTS.md §15), não alterar schema/migrations se não for o 01, não alterar prompts, evidência verificável obrigatória (comando/teste/commit).\n"
            "Critério de sucesso: correção implementada + testes executados + seção Resolução preenchida no handoff com evidências; handoffs de schema/LGPD/tenancy/security exigem revisão do Agente 24 antes de declarar resolvido.\n"
            "Ao concluir: atualize o status do handoff, registre no seu journal (docs/orchestration/journal/) e notifique o Agente 00 pelo Agent Bus: node .agents/bus/agent-cli.mjs send --from " + first + " --to 00 --type ACK --subject \"" + it['path'].split('/')[-1] + "\" --message \"<resumo+evidências>\".")

for w in exec_waves:
    for it in w['items']:
        it['prompt'] = prompt_for(it)
for it in coord_items:
    it['prompt'] = prompt_for(it)

# ---------- 5. RESOLVIDOS PROBLEMÁTICOS (50) ----------
res_md = open(os.path.join(HV, 'RESULTADOS-20261114.md'), encoding='utf-8').read()
duvida_desc = {}
cluster_of = {}
cur = None
for line in res_md.splitlines():
    m = re.match(r'### Cluster ([A-F])', line)
    if m:
        cur = m.group(1)
        continue
    m = re.match(r'- `([^`]+)` — (.*)', line)
    if m and cur:
        rel = m.group(1)
        duvida_desc[rel] = m.group(2).strip()
        cluster_of[rel] = cur

sem_ev = []
in_sem = False
for line in res_md.splitlines():
    if line.startswith('## Itens SEM-EVIDENCIA'):
        in_sem = True
        continue
    if line.startswith('## ') and in_sem:
        in_sem = False
    if in_sem:
        m = re.match(r'- `([^`]+)`', line)
        if m:
            sem_ev.append(m.group(1))

problem_items = []
for rel, verdict in verdicts.items():
    full = '.agents/handoffs/' + rel
    row = matrix.get(full, {})
    desc = duvida_desc.get(rel, 'Marcado RESOLVIDO sem seção de evidência/resolução — verificar realidade.')
    problem_items.append({
        'path': rel, 'full': full, 'verdict': verdict,
        'cluster': cluster_of.get(rel, ''),
        'de': row.get('de', ''), 'para': row.get('para', ''),
        'desc': desc,
    })

# ---------- 6. OUTROS PLANOS ----------
other_plans = [
    {'doc': 'docs/plans/PLANO-IMPLEMENTACAO-IA-OPEN-SOURCE.md', 'dono': '07', 'status': 'PARCIAL',
     'nota': '10 ferramentas open source (Guardrails, Zod, Qdrant, vLLM, LlamaIndex, Coqui TTS, LangGraph...). Evidência: src/lib/ai/embeddings/qdrant.ts, gateway/providers/vllm.provider.ts, guardrails/, schemas/, structured/ existem; langgraph/coqui/llamaindex não localizados. Parecer 24 de aprovação existe (.agents/reviews/24-aprovacao-onda-motor-turbo-ia-open-source.md).'},
    {'doc': 'docs/fase-02/onda-00/08-PLANO-EXECUCAO-ONDAS.md + docs/master-v4/07-PLANO-PRELIMINAR-FASE-02.md', 'dono': '00', 'status': 'PLANEJADO/BLOQUEADO',
     'nota': 'Plano de 6 ondas RECONST (fundação/tenancy → fechamento). Status declarado: "EXECUÇÃO BLOQUEADA aguardando autorização". Sobrepõe-se em grande parte às ondas de saneamento já executadas — reconciliar antes de executar.'},
    {'doc': 'docs/audits/prontidao-producao-20261017/13-plano-acoes-remanescentes.md', 'dono': '00/08/08A/10/01/02/03', 'status': 'PENDENTE (bloqueia produção)',
     'nota': 'A-01 autorização humana p/ deploy; A-02 deploy staging; A-03 smoke test 6 jornadas. Não-bloqueantes: B-01 GitHub Pro, B-02 hotspots >800L (NewLoginScreen 1591L, Landing360 1951L), B-03 deriva índices DATA-007, B-04 sonar coverage.'},
    {'doc': 'docs/auditoria-divida-tecnica/DEP-008-plano-migracao-exceljs.md', 'dono': '05', 'status': 'EXECUTADO',
     'nota': 'Migração xlsx→exceljs já feita (commit ecc29ab3); CVEs sanadas; mantido como registro histórico.'},
    {'doc': 'docs/auditoria-divida-tecnica/10-DIAGNOSTICO-ARQUITETURA.md', 'dono': '00', 'status': 'DIAGNÓSTICO (sem tarefas)',
     'nota': 'Clean Architecture parcial: 5 módulos migrados, ~23 legados; god services listados (bitrix 856L, enrichment 840L, studio 742L, gateway 671L, apollo 622L). Base para dívidas já criadas.'},
    {'doc': 'docs/repository-intelligence/06-IMPLEMENTATION-PLAN.html', 'dono': '00', 'status': 'LEGADO',
     'nota': 'Plano de implementação de repository intelligence — verificar se absorvido por ondas posteriores.'},
    {'doc': 'docs/planejamento-onda-evolucao-enxame-ia.html', 'dono': '13/07', 'status': 'LEGADO',
     'nota': 'Planejamento da onda de evolução do enxame de IA — grande parte executada via ondas saneamento/evolucao-enxame.'},
    {'doc': 'docs/archive/ROADMAP_FINALIZACAO_PLATAFORMA.html', 'dono': '00', 'status': 'ARQUIVO',
     'nota': 'Roadmap arquivado — referência histórica.'},
]

# ---------- 7. PROMPTS (referência permanente) ----------
import glob
prompts = sorted(os.path.basename(p) for p in glob.glob(os.path.join(BASE, '.agents', 'prompts', '*.md')))

# ---------- HTML ----------
def esc(s):
    return ihtml.escape(str(s or ''), quote=True)

def status_class(st):
    s = (st or '').upper()
    if 'CONCLU' in s or 'MERGEAD' in s or 'EXECUTADO' in s or 'CONFIRMADO' in s:
        return 'ok'
    if 'ANDAMENTO' in s or 'VALIDA' in s or 'PARCIAL' in s or 'DUVIDA' in s or 'PLANEJADO' in s or 'LEGADO' in s or 'DIAGN' in s:
        return 'warn'
    if 'CORRE' in s or 'BLOQUEAD' in s or 'SEM-EVIDENCIA' in s or 'SEM-HANDOFF' in s or 'PENDENTE' in s:
        return 'bad'
    return 'mut'

CSS = '''
:root{--bg:#0d1117;--card:#161b22;--card2:#1c2330;--line:#2d3748;--txt:#e6edf3;--mut:#8b98a9;--acc:#58a6ff;--ok:#3fb950;--warn:#d29922;--bad:#f85149;--purple:#bc8cff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:14px/1.55 "Segoe UI",system-ui,sans-serif}
header{padding:24px 30px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#131a24,#0d1117)}
h1{margin:0 0 6px;font-size:22px}h2{font-size:17px}.sub{color:var(--mut);font-size:13px}
main{padding:22px 30px;max-width:1500px}
section{margin-bottom:34px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:14px 0}
.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.stat b{font-size:24px;display:block}.stat span{color:var(--mut);font-size:11.5px}
.wave{background:var(--card);border:1px solid var(--line);border-radius:12px;margin-bottom:16px;overflow:hidden}
.wave>h2{margin:0;padding:12px 18px;font-size:15px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.badge{background:#1f2d44;color:var(--acc);border-radius:20px;padding:2px 11px;font-size:11.5px;font-weight:600}
.badge.ok{background:#12351f;color:var(--ok)}.badge.warn{background:#3a2c10;color:var(--warn)}.badge.bad{background:#3d1d1d;color:var(--bad)}
.tbl{width:100%;border-collapse:collapse;font-size:12.5px}
.tbl th{position:sticky;top:0;background:var(--card2);text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.tbl td{padding:8px 10px;border-bottom:1px solid #212a38;vertical-align:top}
.tbl tr:hover td{background:#1a2230}
.pill{display:inline-block;padding:1px 9px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
.ok{background:#12351f;color:var(--ok)}.warn{background:#3a2c10;color:var(--warn)}.bad{background:#3d1d1d;color:var(--bad)}.mut{background:#26303f;color:var(--mut)}.acc{background:#1f2d44;color:var(--acc)}
code,.mono{font-family:Consolas,monospace;font-size:11px;color:#9db8d9;word-break:break-all}
.det{color:var(--mut);font-size:12px}
details{margin-top:6px}summary{cursor:pointer;color:var(--acc);font-size:12px;font-weight:600}
pre{background:#0a0f18;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:11.5px;white-space:pre-wrap;word-break:break-word;color:#cfe0ff;max-height:300px;overflow:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(460px,1fr));gap:14px;padding:16px}
.card{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:13px;display:flex;flex-direction:column;gap:7px}
.card .path{font-family:Consolas,monospace;font-size:11px;color:#9db8d9;word-break:break-all}
.meta{display:flex;gap:7px;flex-wrap:wrap;font-size:11px}
.prob{color:var(--mut);font-size:12.5px}
button.copy{background:#1f2d44;color:var(--acc);border:1px solid var(--acc);border-radius:6px;padding:2px 9px;font-size:11px;cursor:pointer;align-self:flex-start}
.note{background:#131c2b;border-left:3px solid var(--acc);padding:10px 14px;border-radius:0 8px 8px 0;color:var(--mut);font-size:12.5px;margin-bottom:14px}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mut);margin:8px 0}
'''

parts = []
parts.append(f'''<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>CONSOLIDADO GERAL — Dúvidas Técnicas, Roadmaps, Planos, Prompts e Handoffs — 2026-11-14</title>
<style>{CSS}</style></head><body>
<header><h1>Consolidado Geral de Trabalho Designado — Birth Hub 360°</h1>
<div class="sub">Gerado em 2026-11-14 · Fontes: demands/, BACKLOG-PLATAFORMA-ONDAS.html (125 itens/17 ondas), plano-mestre-consolidado (52 dívidas/6 ondas), .agents/handoffs (472 itens), handoffs-verificacao (veredictos), docs/plans + auditorias, .agents/prompts · Verificação de execução conforme evidências do repositório em 2026-11-14.</div></header>
<main>''')

# resumo
n_bk = sum(len(w['items']) for w in backlog_waves)
n_ok_bk = sum(len(w['items']) for w in backlog_waves if w['status'] == 'MERGEADA')
n_debt = len(debts)
n_debt_res = sum(1 for d in debts if d['status'] == 'RESOLVIDO')
n_debt_open = sum(1 for d in debts if d['status'] == 'ABERTO')
n_debt_sem = sum(1 for d in debts if d['status'] == 'SEM-HANDOFF')
n_prob = len(problem_items)
n_sem_ev = sum(1 for p in problem_items if p['verdict'] == 'SEM-EVIDENCIA')
n_duv = n_prob - n_sem_ev
n_pend = sum(len(w['items']) for w in exec_waves) + len(coord_items)

parts.append(f'''<div class="cards">
<div class="stat"><b>{len(demands)}</b><span>Demandas DEM</span></div>
<div class="stat"><b>{n_bk}</b><span>Itens backlog (17 ondas)</span></div>
<div class="stat"><b style="color:var(--ok)">{n_ok_bk}</b><span>Itens backlog mergeados (ondas 1-2)</span></div>
<div class="stat"><b>{n_debt}</b><span>Dívidas plano-mestre</span></div>
<div class="stat"><b style="color:var(--ok)">{n_debt_res}</b><span>Dívidas c/ handoff RESOLVIDO</span></div>
<div class="stat"><b style="color:var(--warn)">{n_debt_open}</b><span>Dívidas c/ handoff ABERTO</span></div>
<div class="stat"><b style="color:var(--bad)">{n_debt_sem}</b><span>Dívidas sem handoff localizado</span></div>
<div class="stat"><b>{n_pend}</b><span>Handoffs pendentes (ondas exec.)</span></div>
<div class="stat"><b style="color:var(--warn)">{n_prob}</b><span>Resolvidos c/ problema ({n_sem_ev} sem evid. + {n_duv} dúvida)</span></div>
<div class="stat"><b>{len(other_plans)}</b><span>Outros planos/auditorias</span></div>
<div class="stat"><b>{len(prompts)}</b><span>Prompts de agente</span></div>
</div>
<div class="legend"><span><span class="pill ok">verde</span> concluído/confirmado</span><span><span class="pill warn">âmbar</span> parcial/andamento/dúvida</span><span><span class="pill bad">vermelho</span> pendente/bloqueado/sem evidência</span><span><span class="pill acc">azul</span> referência</span></div>''')

# ===== SEÇÃO A: DEMANDS =====
parts.append('<section><h2>A · Demandas registradas (docs/orchestration/demands/)</h2><table class="tbl"><tr><th>ID</th><th>Título</th><th>Responsável</th><th>Status</th><th>Verificação / nota</th></tr>')
for did, tit, resp, st, nota in demands:
    parts.append(f'<tr><td class="mono">{esc(did)}</td><td>{esc(tit)}</td><td>{esc(resp)}</td><td><span class="pill {status_class(st)}">{esc(st)}</span></td><td class="det">{esc(nota)}</td></tr>')
parts.append('</table></section>')

# ===== SEÇÃO B: BACKLOG =====
parts.append(f'<section><h2>B · Backlog Plataforma — 17 ondas / {n_bk} itens (fonte: BACKLOG-PLATAFORMA-ONDAS.html)</h2>')
parts.append('<div class="note">Status por onda: Onda 1 mergeada via PR #275 (2026-11-13); Onda 2 mergeada via PRs #267 + integracao/onda-2 (DEM-20261113-002). Ondas 3–17 constam como pendentes — não há branches integracao/onda-3+ do backlog nem PRs correspondentes. Ressalva: na DEM-002, Onda 1 ainda tem "Gates + relatório + revisão 24" não marcado.</div>')
for w in backlog_waves:
    st = w['status']
    parts.append(f'<div class="wave"><h2>{esc(w["title"])} — {esc(w["meta"])} <span class="badge {status_class(st)}">{st}</span>' + (f'<span class="badge warn">{esc(w["note"])}</span>' if w['note'] else '') + f'<span class="badge">{len(w["items"])} itens</span></h2><table class="tbl"><tr><th>ID</th><th>Tipo</th><th>Agente</th><th>Item</th><th>Descrição</th><th>Status</th></tr>')
    for it in w['items']:
        parts.append(f'<tr><td class="mono">{esc(it["id"])}</td><td>{esc(it["tipo"])}</td><td>{esc(it["agente"])}</td><td>{esc(it["titulo"])}</td><td class="det">{esc(it["desc"])}</td><td><span class="pill {status_class(st)}">{st}</span></td></tr>')
    parts.append('</table></div>')
parts.append('</section>')

# ===== SEÇÃO C: PLANO MESTRE 52 dívidas =====
wave_names = {0: 'Onda 0 — Governança, Segurança Crítica e Preparação', 1: 'Onda 1 — Banco, RLS, Integridade e LGPD',
              2: 'Onda 2 — Infraestrutura, Runtime, Workers e Test Harness', 3: 'Onda 3 — Integrações, Bitrix24, Telefonia e Cadência',
              4: 'Onda 4 — IA, Enxames Autônomos e Controle de Custos', 5: 'Onda 5 — Frontend, Hotspots, Design System e Homologação'}
parts.append('<section><h2>C · Plano Mestre de Saneamento — 52 dívidas técnicas acionáveis (docs/auditorias/plano-mestre-consolidado/, datado 2026-11-10)</h2>')
parts.append('<div class="note">Verificação: cada dívida foi casada por similaridade com o handoff gerado na onda-saneamento-20261110 (ou raiz). "RESOLVIDO" = status declarado no handoff; veredictos da verificação DEM-20261114-002 (CONFIRMADO/SEM-EVIDENCIA/DUVIDA) aparecem quando o item consta entre os 436 auditados. Dívidas sem handoff correspondente ficam SEM-HANDOFF.</div>')
for wnum in list(range(6)) + [None]:
    items = [d for d in debts if d['wave'] == wnum]
    if not items:
        continue
    title = wave_names.get(wnum, 'Sem onda atribuída no plano mestre')
    parts.append(f'<div class="wave"><h2>{esc(title)} <span class="badge">{len(items)} dívidas</span></h2><table class="tbl"><tr><th>ID</th><th>Agente</th><th>Prio</th><th>Tarefa</th><th>Localização</th><th>Resumo</th><th>Handoff / status verificado</th></tr>')
    for d in items:
        hf = d['handoff']
        hf_short = hf.replace('.agents/handoffs/', '') if hf else '—'
        vd = d['verdict']
        vd_pill = f' <span class="pill {status_class(vd)}">{vd}</span>' if vd else ''
        st_pill = f'<span class="pill {status_class(d["status"])}">{d["status"]}</span>'
        parts.append(f'<tr><td class="mono">{esc(d["id"])}</td><td>{esc(d["agente"])}</td><td>{esc(d["prio"])}</td><td class="mono">{esc(d["tarefa"])}</td><td class="mono">{esc(d["local"])}</td><td class="det">{esc(d["resumo"])}</td><td>{st_pill}{vd_pill}<br><span class="det mono">{esc(hf_short)}{" (match "+str(d["match"])+")" if d["match"] else ""}</span></td></tr>')
    parts.append('</table></div>')
parts.append('</section>')

# ===== SEÇÃO D: HANDOFFS PENDENTES =====
parts.append('<section><h2>D · Handoffs pendentes — plano de execução em 4 ondas + trilha do 00 (DEM-20261114-002)</h2>')
parts.append('<div class="note">36 itens (35 ABERTO + 1 BLOQUEADO) extraídos de .agents/handoffs/_MATRIX.csv. Onda 1 de execução já foi iniciada em 2026-11-14 (worktrees wt-01/05/10/02 + subagentes 01, 05, 10, 02). Prompts prontos para colar na sessão de cada especialista.</div>')
for w in exec_waves:
    parts.append(f'<div class="wave"><h2>Onda {w["n"]} — {esc(w["nome"])} <span class="badge">{len(set(i["executor"] for i in w["items"]))} agentes</span><span class="badge warn">máx {esc(w["max"])}</span><span class="badge acc">{len(w["items"])} handoffs</span></h2><div class="grid">')
    for it in w['items']:
        prio = 'bad' if 'bloque' in it['prio'].lower() else ('warn' if 'alto' in it['prio'].lower() else 'acc')
        parts.append(f'<div class="card"><div class="path">{esc(it["path"])}</div><div class="meta"><span class="pill {prio}">{esc(it["prio"])}</span><span class="pill warn">{esc(it["status"])}</span><span class="pill ok">Executor: {esc(it["executor"])}</span><span class="pill mut">De: {esc(it["de"])} → {esc(it["para"])}</span></div><div class="prob">{esc(it["prob"])} {esc(it.get("extra",""))}</div><details><summary>Prompt pronto para o agente</summary><button class="copy" onclick="navigator.clipboard.writeText(this.parentElement.querySelector(\'pre\').textContent)">copiar</button><pre>{esc(it["prompt"])}</pre></details></div>')
    parts.append('</div></div>')
parts.append(f'<div class="wave"><h2>Trilha do Orquestrador (Agente 00) <span class="badge warn">{len(coord_items)} itens</span></h2><div class="grid">')
for it in coord_items:
    parts.append(f'<div class="card"><div class="path">{esc(it["path"])}</div><div class="meta"><span class="pill warn">{esc(it["prio"])}</span><span class="pill warn">{esc(it["status"])}</span><span class="pill ok">Executor: 00</span><span class="pill mut">De: {esc(it["de"])} → {esc(it["para"])}</span></div><div class="prob">{esc(it["prob"])} {esc(it.get("extra",""))}</div><details><summary>Prompt pronto</summary><button class="copy" onclick="navigator.clipboard.writeText(this.parentElement.querySelector(\'pre\').textContent)">copiar</button><pre>{esc(it["prompt"])}</pre></details></div>')
parts.append('</div></div></section>')

# ===== SEÇÃO E: RESOLVIDOS PROBLEMÁTICOS =====
parts.append('<section><h2>E · Handoffs marcados RESOLVIDO com veredicto problemático ({}) — reabertura/reconciliação pendente</h2>'.format(n_prob))
parts.append('<div class="note">Resultado da verificação DEM-20261114-002 onda 1 (6 verificadores read-only). SEM-EVIDENCIA = resolvido sem resolução documentada; DUVIDA = evidência incompleta/divergente/adiado. Alertas: "resolvido=postponed" infla contador; resoluções-redirecionamento podem ter deixado trabalho real pendente; código citado diverge do atual em regressões pontuais.</div>'.format(n_prob))
parts.append('<table class="tbl"><tr><th>Veredicto</th><th>Handoff</th><th>De → Para</th><th>Problema registrado</th></tr>')
order = {'SEM-EVIDENCIA': 0, 'DUVIDA': 1}
for p in sorted(problem_items, key=lambda x: (order.get(x['verdict'], 9), x['path'])):
    parts.append(f'<tr><td><span class="pill {status_class(p["verdict"])}">{p["verdict"]}</span></td><td class="mono">{esc(p["path"])}</td><td class="det">{esc(p["de"])} → {esc(p["para"])}</td><td class="det">{esc(p["desc"])}</td></tr>')
parts.append('</table></section>')

# ===== SEÇÃO F: OUTROS PLANOS =====
parts.append('<section><h2>F · Outros planos, roadmaps e auditorias com ações designadas</h2><table class="tbl"><tr><th>Documento</th><th>Dono</th><th>Status verificado</th><th>Nota</th></tr>')
for op in other_plans:
    parts.append(f'<tr><td class="mono">{esc(op["doc"])}</td><td>{esc(op["dono"])}</td><td><span class="pill {status_class(op["status"])}">{esc(op["status"])}</span></td><td class="det">{esc(op["nota"])}</td></tr>')
parts.append('</table></section>')

# ===== SEÇÃO G: PROMPTS =====
parts.append('<section><h2>G · Prompts de agente (.agents/prompts/) — instruções permanentes de papel</h2>')
parts.append('<div class="note">Não são tarefas pontuais: definem o papel permanente de cada agente. Listados para completude do inventário "tudo que designa alguém". Mudanças de prompt são decisão humana (AGENTS.md §5).</div>')
parts.append('<table class="tbl"><tr><th>Prompt</th></tr>' + ''.join(f'<tr><td class="mono">{esc(p)}</td></tr>' for p in prompts) + '</table></section>')

parts.append('</main></body></html>')

html_out = '\n'.join(parts)
for dst in (OUT_REPO, OUT_DESK):
    open(dst, 'w', encoding='utf-8').write(html_out)
    print(dst, len(html_out)//1024, 'KB')

# diagnostics
print('backlog waves:', [(w['title'], len(w['items']), w['status']) for w in backlog_waves])
print('debts:', n_debt, 'res:', n_debt_res, 'open:', n_debt_open, 'sem-handoff:', n_debt_sem)
for d in debts:
    if not d['handoff'] or d['match'] < 0.45:
        print('  weak/none:', d['id'], d['agente'], d['local'][:60], '->', d['handoff'], d['match'], d['status'])
