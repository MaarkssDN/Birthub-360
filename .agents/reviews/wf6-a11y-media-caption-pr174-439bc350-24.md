# Parecer Agente 24 — PR #174 (agente/wf6-a11y-media-caption) — head 439bc350

- **SHA revisado:** `439bc350832f28fa46f421b1acf3d00a687b71c7` (confirmado com `gh` no início e antes de escrever, 02/11/2026 ~08:45 BRT)
- **Base:** `main` `16dd960f310a1ab4b3c8bb5e9091a6f05c7b6a69` (atual; 0 atrás / 1 à frente)
- **Veredito:** **REPROVADO**
- Vale só para este SHA.

## Escopo do diff
São 4 arquivos: `docs/quality/biome-warnings-backlog.md` (+13), `FieldMeetingRecorder.tsx` (+1), `voice-hub/pages/Telephony.tsx` (+1) e `voice-hub/pages/Dashboard/Telephony.tsx` (+1). Só comentários `biome-ignore` e documentação. Não há mudança de comportamento, de package nem de lockfile. **Não há sobreposição com o #168**, que toca `Organization.tsx` e outros arquivos de voice-hub, mas nenhum dos 3 deste PR. OK.

## (a) Justificativa das supressões: não se sustenta
### P2 — `src/features/mobile/components/FieldMeetingRecorder.tsx:438-442`
- O `<audio controls src={URL.createObjectURL(recordingResult.blob)}>` **não está mutado** e tem `controls`. É a reprodução de uma **gravação de reunião de campo** (o próprio componente se descreve, na l.249, como "Gravação offline-first com transcrição automática no Copiloto IA"). Ou seja, é **mídia com fala que o usuário reproduz**.
- "Prévia local do próprio usuário" é verdade, mas o conteúdo é a fala dos participantes da reunião. Pelo critério desta revisão, mídia com fala reproduzida pelo usuário não pode ser suprimida.
- Já existe um caminho real de transcrição (Copiloto IA). Alternativas: associar ou indicar a transcrição (por exemplo, um texto/link do tipo "transcrição disponível após sincronizar" ligado via `aria-describedby`), ou mostrar a transcrição quando ela existir. Se a decisão for manter a exceção, ela precisa de aceite humano explícito, registrado como exceção de acessibilidade, e não como "não há fala".

### P2 — `src/features/voice-hub/pages/Telephony.tsx:129` e `pages/Dashboard/Telephony.tsx:129` (arquivos idênticos)
- `generatedMusicUrl` vem de `POST /api/generate-music` (l.18-33). O backend (`src/lib/voice-hub/controllers/ai.controller.ts:81-88`) envia o **prompt livre do usuário** (`textarea`, l.93-94) direto ao modelo `lyria-3-clip-preview`, **sem restringir a saída a instrumental**.
- O padrão é "música de elevador... bossa nova" (l.5-7), mas o usuário pode pedir letra ou vocais. Então a afirmação "sem fala; nada a legendar" **não é garantida pelo código**.
- Correção sugerida (escolher uma): forçar instrumental no backend (por exemplo, prefixar o prompt com uma instrução "instrumental, sem vocais/letra") e só então manter o `biome-ignore` com esse motivo verificável; ou oferecer descrição/transcrição. O doc do backlog (`biome-warnings-backlog.md`, tabela "Decisões registradas") deve refletir o motivo real.

## (b) Propriedade
- AGENTS.md não atribui `src/features/mobile/**` nem `src/features/voice-hub/**` ao WF6. Pelo domínio, voice-hub/telefonia é do **Agente 12 (Voz e Telefonia)** e mobile do **Agente 09**. A decisão do 00 dá ao WF6 só trivy e qualidade-ci.
- O doc cita "decisão do owner" sem identificar quem decidiu. **P3:** registrar o aceite dos donos (09/12), ou a delegação do 00, para estas alterações.

## (c)/(d) CI no head 439bc350 (snapshot de ~08:45 BRT)
| Run | Workflow | Estado |
|---|---|---|
| 41434963913 | Central Birth Hub 360 Release | **in_progress** |
| 41434963814 | SonarQube Analysis | **in_progress** |
| 41434963816 | Visual Regression Tests | success |
| 41434963958 | Frontend Bundle Budget | success |
| 41434963848 | Security - Trivy | success |
| 41434963884 | Security - CodeQL | success |
| 41434963841 | Security - Dependency Review | success |

- Baseline da main `16dd960f`: Release 41433136212 **success**. Até agora não há falha nova nem herdada.
- Não esperei o Release/Sonar concluírem: o REPROVADO vem de **mérito** (justificativas incorretas) e não depende da CI. Uma nova revisão exigirá Release verde no novo SHA, com Unit, Integration, Build, Smoke e E2E executados (AGENTS.md §40, l.909).

## O que corrige
1. FieldMeetingRecorder: remover a supressão e dar uma alternativa textual/transcrição, ou registrar a exceção com aceite humano explícito, sem alegar "sem fala".
2. Telephony (as 2 cópias): forçar geração instrumental no backend antes de suprimir, ou não suprimir.
3. Atualizar `docs/quality/biome-warnings-backlog.md` com os motivos reais e o dono que decidiu.
4. Atualizar o branch com merge da main, se necessário (sem rebase/force-push), e pedir nova revisão no novo SHA.

Nenhum workflow foi disparado. Nenhum comentário foi feito no PR.
