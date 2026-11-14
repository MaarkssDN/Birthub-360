# Parecer 24 — Conclusão da Identidade Visual V2.1 (Birthub 360°)

- Missão: Conclusão da Identidade Visual V2.1 (documentos, brandbook, design system, motion system, biblioteca, conformidade, referência N1, decisões humanas, aceite).
- Autor: Agente 00 (com 4 subagentes: auditoria, brandbook, design system, motion).
- Auditor: Agente 24 — Revisão Independente (não autor; nenhum arquivo auditado foi editado).
- Base: HEAD do repositório, branch claude/dazzling-allen-yqlyow. Entrega não versionada (`?? public/design-lab/identidade-v2/`).
- Revisão auditada: `public/design-lab/identidade-v2/MANIFEST.sha256`, SHA-256 do manifesto = `37b6d39c57835eaee83a4a54c6b43ffa927fa7321cc22137d7665435b2134a46` (148 arquivos).
- Fora do manifesto por desenho: `index.html` da raiz e `10-aceite/index.html` (verificados por navegador; o conteúdo vem de `10-aceite/matriz-requisitos.json`, que está no manifesto) e `_baseline-v2.0/`.
- Escopo da aprovação: documentos, protótipos e pacote de evidências estáticos em `public/design-lab/identidade-v2/`. Não aprova aplicação à plataforma, merge, push nem deploy. Parecer sobre documento não aprova o trabalho descrito por ele.

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `sha256sum MANIFEST.sha256` | 37b6d39c…4a46 (confere), exit 0 |
| `sha256sum -c MANIFEST.sha256` | 148/148 OK, exit 0 |
| `_baseline-v2.0`: extração do `v2.0-entregue.tar.gz` em tmp + `sha256sum -c` do MANIFEST interno (53 entradas) | 0 divergências. O manifesto interno referencia os arquivos extraídos do tarball, não a pasta de forma direta; a preservação está íntegra. |
| `git status --porcelain` | só `?? public/design-lab/identidade-v2/` (antes de gravar este parecer) |
| `git diff --stat` | vazio: nenhum arquivo rastreado alterado |
| `node 06-conformidade/gerar.mjs` em cópia (scratchpad, repo git fictício com identidade-visual e public/brand, cwd = identidade-v2), exit 0 | 25/26. A única falha é `LIMITES`, artefato da cópia (o diretório novo ficou não rastreado no repo fictício). `C06-LOGO` e `C09` passam. Diff contra o `resultado.json` entregue: só `geradoEm`, `aprovadas` e o `LIMITES`. Resultado reproduzível. Rodar de dentro de uma cópia sem a raiz do repo dá 24/26, é limitação de ambiente do script e não da entrega. |
| Playwright/Chromium: 11 páginas (raiz + 01 a 10) × dark/light × 1440/390 = 44 combinações, servidas com raiz em `public/` (os caminhos absolutos `/fonts/` e `/brand/characters/` exigem isso) | 0 erros de console, 0 requisições falhas ou HTTP ≥ 400, 0 overflow horizontal, 0 imagens quebradas, 0 âncoras `#` quebradas, 0 links relativos mortos. Fundos computados #0D0D0D (dark) e #F4F7FB (light). |
| Inspeção visual (Read) de capturas: brandbook 1440 dark, design system 1440 dark, motion 390 light, N1 1440 dark | Legíveis, selo de rascunho visível, sem sobreposição. Também gerei capturas da raiz e de 10-aceite, mas só vi as quatro acima. |
| Errata N1 contra o clone `/home/user/maarkssdn/land-page` (HEAD = `0d08b31`) | Confere: 0 ocorrências de `background-clip` no `mission-06` (só uma menção em `build_m06.py`, não em CSS/HTML entregue); `cubic-bezier(0.16, 1, 0.3, 1)` presente; `prefers-reduced-motion` presente em CSS e JS; cores #C8D0EE, #F2F5FF, #33406A, #19234A, #0D1222 presentes; "Birth Hub 360°" 4× em `n1-final/index.html`; 3 logos byte-idênticos aos de `identidade-visual/birthhub360/logos/`. Página publicada: `curl` sem resposta (código 000), impedimento confirmado. |
| `impeccable detect` nas frentes 01 a 09 + shared, exit 2 | 7 avisos "advisory" (em-dash, grid decorativo no motion, easing com overshoot `cubic-bezier(.34,1.56,.64,1)` em motion.css, hierarquia plana na 09, contrastes 4.4:1 de rosa sobre superfície de documentação). Coerente com a matriz, que os classifica como residuais justificados. Nenhum é erro bloqueante. |
| Amostragem brandbook: 20 de 121 regras de `regras.json` | 20/20 presentes nas páginas. |
| Amostragem tokens: 15 de 252 em `tokens.contract.json` | 13/15 com a variável definida em tokens.css/motion.css. As 2 restantes (`--ink-muted`, `--iris`) estão definidas em `shared/core.css` ou no escopo `[data-theme]`. Falso negativo da checagem, não defeito. |
| Reconciliação | Paleta e semânticas (#00D4FF #FF2D9B #FFC107 #8B7DFF #0D0D0D #F4F7FB; #22C55E #EF4444 #3B82F6) presentes. Escalas tipográficas `scale` (Operacional) e `scale-commercial` presentes e distintas. Colisão de nomes entre tokens.css e motion.css: 0. Sobreposição com `shared/core.css`: 0. |
| Segredos e PII nos arquivos do manifesto (regex de chaves, `BEGIN`, tokens) | 0 achados. Único e-mail: `nome@empresa.com.br` (placeholder). O e-mail do usuário não aparece. |

## Critérios da missão

1. Frentes consistentes entre si: ATENDIDO. As 3 reconciliações verificadas (semânticas, escalas, nomes de motion). O `resultado.json` reproduz.
2. FONTE-DE-VERDADE atualizada: ATENDIDO. A errata V2.1 aparece e os itens antigos estão marcados SUPERADOS. Há resíduo de grafia "V2.0" (achado A-1).
3. N1 analisado: ATENDIDO. O clone foi relido e as afirmações da errata conferem. Impedimento da página publicada comprovado e declarado como tal (não houve verificação da página publicada).
4. Identidade preservada: ATENDIDO. Logos byte-idênticos, 29 personagens (`C09` passa no meu rerun), paleta e fontes presentes.
5. Problemas corrigíveis tratados: ATENDIDO COM RESSALVAS, classificação honesta (6 pares de contraste e achados Impeccable mantidos e justificados).
6. Links, recursos e interações: ATENDIDO (verificado por mim em 44 combinações). Interações internas (modal, tabela, formulário, motion) vêm dos subagentes e não foram reexecutadas em profundidade por mim.
7. Evidências incluídas: ATENDIDO (`evidencias/` por frente, `qa-00.json`, `08-referencia-n1/evidencias/`).
8. Decisões humanas separadas: ATENDIDO. H-01 a H-14 (14 distintas) em 09-decisoes-humanas, apresentadas como escolhas do proprietário e não como defeitos.
Limites: ATENDIDO (nada fora de `identidade-v2/` alterado, nenhum commit, merge, push ou deploy).

## Julgamento da matriz de requisitos (`10-aceite/matriz-requisitos.json`, 17 itens)

- As classificações são honestas. "ATENDIDO COM RESSALVAS" onde há contrastes e achados residuais e axe-core não executado. "NÃO VERIFICADO" para Safari, Firefox, Android/Capacitor, leitor de tela, zoom 200% e dispositivo real, declarado de forma explícita. "VER PARECER" para a revisão independente.
- "NÃO APLICÁVEL" para os gates de código do AGENTS.md §28: ACEITO. Nenhum arquivo de código funcional (src, server, prisma, package.json) mudou (git diff vazio). Os gates tsc, lint, build e testes não têm o que validar. A aplicabilidade é decisão minha e a justifico pela ausência de diff em código funcional. Falhas pré-existentes dos gates, caso existam, não foram avaliadas e não são anunciadas como verdes.
- Nenhuma frase encontrada declara algo como homologado ou aprovado sem evidência. Os textos dizem "RASCUNHO, não homologado" e "Nada está homologado".

## Achados (por gravidade)

Nenhum achado bloqueador ou crítico.

- A-1 (baixa, autor 00): rótulos, selos e títulos de várias páginas e do FONTE-DE-VERDADE linha 40 ainda dizem "V2.0" ("Brandbook V2.0", "Design System V2.0", "Motion System V2.0", selo "RASCUNHO V2.0") enquanto a entrega é V2.1; só a N1 e o título do FONTE usam V2.1. Pode ser intencional (versão do documento), mas não está documentado. Correção sugerida: registrar a convenção ou alinhar os rótulos. Teste: grep por "V2.0" nas páginas.
- A-2 (baixa, informativo): `06-conformidade/gerar.mjs` só funciona com cwd = `identidade-v2/` dentro do repo (usa `../../..`). Rodado fora do repo dá 24/26 ou falha. Já documentado no cabeçalho do script. Sem ação necessária.
- A-3 (baixa, pré-existente de desenho): páginas usam caminhos absolutos `/fonts/` e `/brand/characters/`. Abertas por `file://` ou servidas fora da raiz `public/` quebram (404 e imagens). Em Vite/produção funciona. Vale um aviso no índice.
- A-4 (informativa): avisos Impeccable residuais (easing com overshoot em motion.css linha 28, em-dash em excesso, grid decorativo no motion, par rosa/#252530 a 4.4:1). Justificados e classificados na matriz. Nenhum impede a conclusão.
- A-5 (informativa): a checagem `LIMITES` do `gerar.mjs` depende do estado do git e ficará vermelha se alguém criar arquivo fora de `identidade-v2/` depois, inclusive este parecer. É esperado e documentado na matriz.

## Pendências e não verificado

- Safari, Firefox, Android/Capacitor, leitor de tela, zoom 200%, desempenho em dispositivo real, axe-core, CLS e LCP: não executados (declarados pelo próprio autor; não os executei).
- Interações profundas de componentes (121 checagens do subagente de brandbook, testes de motion e do design system): confiei nos registros e só amostrei regras e tokens; não reexecutei todos.
- Capturas visuais inspecionadas por mim: 4 de 6 geradas. Não revi a captura da raiz nem a de 10-aceite.
- Decisões H-01 a H-14 continuam pendentes do proprietário (reservadas, não são defeito).
- Página publicada do N1: inacessível, sem verificação.
- Qualquer alteração em arquivo do manifesto invalida esta aprovação e exige novo parecer. Classificação da missão: CONCLUÍDA no escopo de documentação, com decisões humanas H-01 a H-14 ainda abertas (AGUARDANDO DECISÃO HUMANA quanto à homologação/aplicação, que não faz parte desta aprovação).

## Riscos

Baixos. O pacote é estático e isolado. O principal é alguém tratar o material como homologado: os rótulos de rascunho cobrem isso.

Decisão original (manifesto 37b6d39c…4a46): aprovado. Essa aprovação foi invalidada por mudança no conteúdo auditado; a linha de decisão vigente está no fim da seção "Reauditoria de delta (2026-11-14)".

---

## Reauditoria de delta (2026-11-14)

O parecer acima fica preservado. Única alteração nele: a linha de decisão original virou uma frase descritiva, para que a linha de decisão vigente do documento seja única (no fim desta seção).

- Motivo: a aprovação do manifesto 37b6d39c…4a46 foi invalidada por 2 mudanças em arquivos do manifesto, feitas para corrigir 3 alertas HIGH do CodeQL no PR #290.
- Revisão auditada: head `d758a0da` + working tree não commitado; `MANIFEST.sha256` novo, SHA-256 = `f0a94343837a32c0b02aa4370570d2d7c0883786e0716f1a0a2a9f4942522124` (mesmos 148 caminhos).
- Arquivos do delta: `02-brandbook/_src/montar.mjs` (a646e205…), `03-design-system/tokens/build.mjs` (301d638f…), `MANIFEST.sha256`. Lidos também, fora do manifesto: `scripts-verificacao/{qa,n1,sw}.cjs`.
- Escopo da aprovação: documentação e protótipos estáticos do pacote identificado pelo manifesto. Este parecer NÃO atesta que o CI do PR está verde e NÃO autoriza merge com CI vermelho, push nem deploy.

### Comandos e resultados

| Comando | Resultado |
|---|---|
| `git rev-parse --short HEAD` / `git status --porcelain` | `d758a0da`; só os 3 arquivos acima modificados, exit 0 |
| `sha256sum MANIFEST.sha256` e `sha256sum -c` | f0a94343…2124; 148/148 OK, exit 0 |
| `diff /tmp/MANIFEST.old MANIFEST.sha256` | só as 2 linhas de `montar.mjs` e `build.mjs` |
| `git diff` dos 2 scripts | lido por inteiro; mudanças restritas a `strip` e ao bloco de leitura do `index.html` |
| Em CÓPIA (scratchpad): `node _src/montar.mjs` (exit 0) e `node tokens/build.mjs` (exit 0), depois `diff -rq` da cópia inteira contra o original | IDÊNTICO: nenhum gerado mudou (index.html, regras.json, tokens.css, tokens.json, tokens.contract.json byte a byte); `sha256sum -c` na cópia: 148 OK. O build ainda relata os mesmos 6 pares de contraste já documentados. |
| Teste adversário da `strip` nova (9 entradas, função copiada do diff) | `<scr<b>ipt>alert(1)</scr</b>ipt>` → `ipt>alert(1)ipt>`; `<<script>script>x` → `script>x`; `<scr<script>ipt>a` → `ipt>a`; `<scr<b>ipt src=x` → `ipt src=x`; `<<a>script<a>>y` → `script>y`. Nenhuma remontagem de `<script`. `&amp;lt;script&amp;gt;` → `&lt;script&gt;` e `a &amp;amp; b` → `a &amp; b`: sem duplo unescape. |
| Leitura de `scripts-verificacao/*.cjs` (49 linhas) + grep de segredo/e-mail/URL | sem segredo, token, e-mail ou chamada de rede; só Playwright local |
| `git ls-files` contra o manifesto | 84 dos 148 arquivos do manifesto NÃO estão no git (todos em `*/evidencias/`); nenhum `href` das páginas aponta para arquivo ausente do git |

### Julgamento das correções

- `strip` (multi-character sanitization e double unescaping): correção real, não cosmética. O laço até ponto fixo elimina a remontagem de tag por aninhamento e a ordem `&lt;`, `&gt;`, `&amp;` faz uma única passada de decodificação. Observação: `&lt;script&gt;` vira `<script>` no texto, o que é a decodificação pretendida de entidade; a saída é texto de `regras.json`, não HTML. A entrada é conteúdo do próprio autor, então o risco real já era baixo.
- `build.mjs` (race condition): correção real. A leitura direta com tratamento de `ENOENT` remove a janela entre checar e usar; outros erros continuam visíveis (relançados). Comportamento igual ao anterior quando o arquivo existe ou falta.
- Não reexecutei o CodeQL. Que os 3 alertas fechem no PR é expectativa, não evidência.

### Achados

- D-1 (média, autor 00, exige ação antes do merge): 84 arquivos do manifesto não estão versionados, e não achei nota sobre isso no pacote. Não são só capturas pesadas: há JSON e TXT pequenos de evidência (ex.: `verificacao.json`, `reconciliacao-testes.json`, saídas do Impeccable). Num checkout do git, `sha256sum -c` falha em 84 linhas. Correção: nota explícita (no PR e em arquivo fora do manifesto, ou no índice) dizendo que o manifesto descreve o pacote em disco/zip e listando o que ficou fora do git e por quê; de preferência versionar as evidências de texto, que pesam pouco. Teste: `sha256sum -c` em checkout limpo com resultado explicado pela nota.
- D-2 (média, autor 00): `06-conformidade/gerar.mjs` lê `08-referencia-n1/evidencias/n1-verificacao.json`, que não está no git. Num checkout limpo o gerador da matriz de conformidade quebra. Correção: versionar esse JSON. Teste: rodar o gerador em checkout limpo.
- D-3 (baixa, autor 00): `_baseline-v2.0/v2.0-entregue.tar.gz` não está no git (o `.gitignore` tem `*.tar.gz`), mas o `MANIFEST.sha256` dele está. No git a baseline é só uma lista de hashes sem conteúdo. Registrar na mesma nota ou versionar por exceção.
- D-4 (baixa): `scripts-verificacao/*.cjs` têm caminhos absolutos de `/home/user/...` e do clone externo. Não são sensíveis (nome de usuário genérico, sem segredo nem dado pessoal), mas os scripts não rodam em outra máquina e `qa.cjs`/`n1.cjs` sobrescrevem evidências e `qa-00.json` ao rodar. Estão fora do manifesto; se forem mantidos, declarar isso e, idealmente, trocar por caminhos relativos.
- D-5 (informativa): `qa.cjs` abre as páginas por `file://`; a minha verificação original usou HTTP com raiz em `public/`. Os dois métodos deram 0 problemas, mas não são a mesma medição.

### Não verificado

- CI do PR: não é verde. CodeQL agregado em falha no head `d758a0da` (as correções ainda não estão commitadas). Application gate, build, SonarQube e Visual Regression falharam no run anterior, sem causa raiz determinada; não sei se são pré-existentes ou causados pela entrega ou pelo merge do main. Nada disso foi investigado por mim.
- O merge do main (head `d758a0da`) em si: não auditado além de confirmar que o manifesto continua batendo.
- Não repeti a rodada de navegador nem as capturas: os arquivos gerados e servidos são byte-idênticos aos da revisão anterior.
- Demais itens "não verificado" do parecer original continuam valendo.

### Decisão do delta

Aprovado no escopo documental: as 2 correções são corretas, não alteram nenhum artefato gerado e o manifesto novo confere. D-1 e D-2 devem ser resolvidos antes do merge; resolvê-los com arquivos fora do manifesto (ou só versionando arquivos já listados, sem mudar conteúdo) não invalida esta aprovação. Qualquer mudança de conteúdo em arquivo do manifesto invalida. O merge depende ainda do CI verde e da autorização do proprietário, que este parecer não substitui.

Decisão: APROVADO
