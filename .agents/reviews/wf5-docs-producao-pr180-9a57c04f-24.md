# Parecer — PR #180 (WF5, docs de produção) @ 9a57c04f

- **Missão:** WF5 — documentar o estado real de produção (EC2 manual, sem AWS configurada, sem R2, sem backup automático)
- **Autor:** agente WF5 (PR #180)
- **Auditor:** Agente 24 — Revisão Independente
- **Base:** merge-base b7f42d0c; main atual 645cb6cb (1 commit à frente, #163). Merge com main: limpo.
- **SHA revisado:** 9a57c04fc277a15da5401468b34a6687f64588de (head reconfirmado antes de emitir)
- **Escopo:** só docs, 3 arquivos (+38/−10): docs/deploy/producao.md, docs/deploy/README.md, docs/operations/PRODUCTION_ARCHITECTURE.md

## Critérios
1. Só docs. 2. As afirmações batem com o repo. 3. Sem segredos nem PII. 4. Dependências de ordem. 5. Conflitos (#178, #155, #181, main). 6. CI verde com Release completo.

## Comandos
`git diff --stat`, `git grep`, `git merge-tree --write-tree p180g {p181,p155,p178,origin/main}`, `gh run list -c 9a57c04f`, `gh api .../actions/workflows/*/runs` (total_count).

## Evidências
- EC2 3.143.251.44 e container `birthhub-app`: scripts/deploy-ec2.sh:8, :24-27, :32, :45; deploy-ec2.ps1:3; deploy-aws.ps1:5, :21.
- Nenhum workflow de deploy: production.yaml:20 só tem workflow_dispatch, com push:false em :129; cd-homolog.yml:14 só tem workflow_dispatch; deploy-aws.yml.disabled está desativado; esses workflows têm 0 runs.
- Backup: backup-production.yml:12 só tem workflow_dispatch e usa secrets R2 (:27-30). Tem 0 runs, o que confirma "nunca rodou". A remoção acontece no #181 (OPEN).
- render.yaml.disabled está arquivado; vercel.json tem `git.deploymentEnabled:false`.
- Conflitos: merge-tree limpo com #181, #155, #178 (cb5d52cf) e origin/main.
- Segredos/PII: nenhum. O IP público já aparece nos scripts do repo.

## CI @ 9a57c04f (estado em 02/11/2026 10:45 BRT)
- Security - Dependency Review 41452752159: **success**
- SonarQube 41452752246 e Visual Regression 41452752179: in_progress
- **Central Birth Hub 360 Release 41452752196: queued (não rodou)**
- CodeQL 41452752319 e Trivy 41452752678: queued

## Achados
- **P1:** nenhum.
- **P2:** nenhum de conteúdo.
- **P3:**
  - (a) README.md ainda diz que o "único ambiente ativo" é Local-First, e PRODUCTION_ARCHITECTURE.md §1 diz que os provedores em nuvem estão desativados. As duas frases contradizem o banner novo sobre a EC2.
  - (b) Continua a linha "MinIO backup a nível de disco".
  - (c) Enquanto o #178 não entra, "GitHub Pages não são usados" só é aproximadamente verdade (deploy-pages.yml existe, com 0 runs).
  - (d) O IP público fica exposto na documentação (já estava nos scripts).

## Dependência de ordem
O #180 descreve um estado que só vale **depois do merge do #181** (remove backup-production.yml) **e do #155** (cria docs/ops/wf5-prontidao-deploy.md, que hoje é um link quebrado na main). O ideal é que o #178 também entre antes. Mergear o #180 primeiro deixaria a doc afirmando algo falso.

## Pendências
- O Release (Lint, Type Check, Unit, Golden, Integration, Build, Smoke, E2E) precisa rodar e passar no 9a57c04f.
- CodeQL, Trivy, Sonar e VR precisam terminar.
- O #181 e o #155 precisam entrar antes.

## Decisão
**BLOQUEADO.** O conteúdo está correto e aprovável: é só docs, sem P1/P2, e reflete as decisões do Marcelo. Mas, pelo AGENTS.md, teste obrigatório não executado não conta como aprovação, e o Release ainda está na fila. O bloqueio vem só de CI pendente e da ordem de merge; não há defeito no conteúdo.
