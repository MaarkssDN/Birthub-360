# Entrega — checklist dos handoffs e agentes de aprovação/publicação

Agente / Onda / Branch: 00 — Coordenador / auditoria-2026-10-09 / main local. Base: ccde9851c5d4b00560900a0fd27f9b34ab06353d. Auditor 24 executado em worktree isolado; não houve commit, push, PR, merge ou deploy.

## Suposições e autorização
- O pedido humano autoriza criar os prompts 24 e 08A e tornar 24 obrigatório na governança. Não concede autorização permanente para mudar regras/prompts nem publica produção.
- Reutilizar 24, já previsto no roster, e criar 08A como especialista de 08 evita duplicar papéis. Infraestrutura permanece com 10.
- Os 196 documentos são todos os Markdown de `.agents/handoffs/` exceto README, incluindo plano e relatórios. Preservar documentos históricos e seus status.
- O HTML é um artefato offline de revisão, com controles nativos e tokens de superfície/contraste. Não integra o CRM nem altera autenticação/backend. Por isso utiliza HTML/CSS nativos em vez de componentes React do produto.

## Plano executado e critérios
1. Descobrir fontes e governança → confirmar 196 fontes e papéis existentes → VALIDADO.
2. Gerar checklist → correspondência 1:1, hashes, fontes, filtros, marcação pessoal e exportação → TESTADO, 196 hashes vinculados ao parecer.
3. Formalizar 24/08A → obrigação de acionamento e autorização por missão → IMPLEMENTADO; revisão independente em `../reviews/entrega-checklist-agentes-2026-10-09-24.md`.
4. Auditar históricos → 196 itens únicos, sem converter status em sucesso funcional → auditoria documental realizada pelo 24: 13 REPROVADO, 183 BLOQUEADO; validação funcional dos 196 NÃO EXECUTADA.
5. Verificar HTML e gates locais → resultados abaixo; release/deploy fora desta missão.

## Arquivos da entrega
- `AGENTS.md`: auditor obrigatório, revisão vinculada ao conteúdo, roster de 08A.
- `.agents/prompts/00-coordenador.md`, `24-revisao-independente.md`, `08A-git-deploy-aws.md`: instruções de orquestração, auditoria e publicação autorizada.
- `.agents/README.md`, `.agents/COMO-CHAMAR-OS-AGENTES.md`: descoberta dos papéis e instruções para acioná-los.
- `scripts/generate-handoffs-checklist.cjs`, `scripts/verify-handoffs-checklist.cjs`: geração e validação do artefato.
- `.agents/reviews/checklist-handoffs.html`, `handoffs-2026-10-09-auditoria.json`, `handoffs-2026-10-09-24.md`: checklist, decisões por documento e parecer histórico.
- `.agents/reviews/evidence-handoffs/desktop.png`, `mobile.png`: evidência visual sem conteúdo pessoal dos corpos.
- Este relatório e parecer separado de revisão da entrega.

## Comandos, testes e resultados
- `node --check scripts/generate-handoffs-checklist.cjs` e `node --check scripts/verify-handoffs-checklist.cjs` → exit 0.
- `node scripts/generate-handoffs-checklist.cjs` → exit 0, 196 documentos, 196 hashes vinculados ao JSON do auditor.
- `node scripts/verify-handoffs-checklist.cjs` → exit 0: cobertura/hashes, busca, filtros por grupo/status/parecer, marcação e reload, exportação JSON, invalidação por hash antigo, teclado, detalhes, mobile sem overflow, axe WCAG AA sem violações detectadas, storage indisponível, fallback sem JavaScript e console sem erros.
- `npx tsc --noEmit` (NODE_OPTIONS=--max-old-space-size=8192) → exit 0.
- `npm run lint` → exit 0; 343 warnings e 1 info em src pré-existentes, não editados nesta missão.
- `npm run build` → exit 0; precache PWA validado. Avisos de chunks grandes, comentários PURE de dependência e glob ico sem correspondência; não tratados fora do escopo.
- Primeira tentativa do teste do HTML → NÃO EXECUTADA por ausência do Chromium headless do Playwright. Correção: usar canal Chrome já instalado; verificações seguintes passaram.
- Screenshots desktop 1440×960 e mobile 390×844 → VERIFICADO VISUALMENTE.
- `git diff --check` → exit 0. Varredura dirigida de 12 arquivos textuais da entrega por padrões de chave AWS, chave privada, token GitHub/OpenAI e telefone brasileiro → exit 0, nenhum achado. Essa busca dirigida não certifica ausência universal de segredos no repositório.
- Unit/integration/e2e do CRM, npm audit e produção → NÃO EXECUTADOS: missão altera governança e HTML standalone, não comportamento do CRM nem release. Testes pertinentes do artefato foram executados.

## Evidências e riscos
O parecer histórico do 24 documenta leitura integral automatizada com revisão semântica dirigida, não revisão manual integral de cada linha. As 13 reprovações são contradições documentais confirmadas; os 183 bloqueios são insuficiência de evidência atual, não diagnóstico de funcionalidades quebradas. Hashes foram recalculados após copiar bytes originais ao worktree, corrigindo diferença CRLF em 25 arquivos.

As marcações pessoais são locais ao navegador e a exportação é identificada como revisão pessoal. Não há botão de autoaprovação. Pareceres só se aplicam aos hashes auditados. O HTML é snapshot: regenerar após mudanças dos documentos. Não incorporar corpos que possam conter PII/segredos.

Os prompts implementam regra de acionamento pelo Coordenador; não constituem daemon, agendamento ou bloqueio técnico inviolável de todas as ferramentas. GitHub/AWS reais continuam exigindo missão e ambiente autorizados. O workflow AWS existente pode terminar verde com deploy ignorado; o 08A exige confirmar digest/versão, migrações e destino antes de anunciar publicação.

## Problemas fora do escopo e encaminhamentos
Contradições históricas e ações por proprietário estão no parecer do 24; não alterar retroativamente os 196 documentos nem corrigir produto nesta entrega. Parecer de revisão é o artefato rastreável de encaminhamento, sem criar novos arquivos dentro do corpus histórico de 196. Sem handoffs novos nesta missão.

## Aprendizados reutilizáveis e pendências
Status resolvido, decisão de adiamento e deploy simulado precisam de tratamento distinto. Aprovação deve identificar revisão e evidência. Mudança de conteúdo invalida aprovação anterior; marcação pessoal não comprova execução.

Pendências históricas permanecem explícitas no checklist. Commit/PR/merge/push/deploy: NÃO EXECUTADOS. Auditor independente deve aprovar esta entrega separadamente dos trabalhos históricos.
