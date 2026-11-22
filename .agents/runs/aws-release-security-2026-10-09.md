# Correção de complexidade no reconhecimento de opt-out

Agente / Onda / Branch: 01 (serviço compartilhado), fase 08 serial (testes autorizados pelo 00) / AWS release / `codex/aws-release-security-fix`.

Base: `e019a5417a7af518f32bb14746705c48f974d98f`.

Objetivo: corrigir o achado HIGH de CodeQL no normalizador de palavras de opt-out sem alterar seu contrato ou a supressão por tenant/canal.

## Suposições e propriedade

O conjunto de caracteres de pontuação e a ordem trim → lowercase → remoção nas bordas → trim são contratos existentes e devem permanecer iguais. O serviço canônico está em `src/shared/services/optOutCheck.service.ts`; o caminho legado LGPD somente reexporta. Não há mudança de banco, autenticação, API ou dados pessoais armazenados. O 00 autorizou a fase serial de testes existentes; nenhum outro proprietário foi editado. Relatório criado no destino solicitado pelo 00.

Fora de escopo: schema/migrações, pipeline, governança, prompts, waivers, publicação e deploy. Não houve commit ou push.

## Descoberta e causa raiz

Foram lidos AGENTS global, prompt 01, regras shared, Prisma, auth e testes, o handoff `onda-15/17-para-21-validacao-optout-multicanal.md` e a suíte existente de opt-out. Não existe implementação equivalente necessária: a correção reutiliza a função atual.

A alternativa de sufixo `[!?.#\-_*]+$` da regex não tem âncora inicial. Em `sair` + `!` repetido + `a`, ela tenta sucessivamente cada início da sequência de pontuação e retrocede após não alcançar o fim, causando custo quadrático. A repetição de 2k/4k/8k/16k/32k caracteres levou 7,6/30/124/567/2269 ms na reprodução inicial.

## Plano executado

1. Reproduzir o custo → benchmark crescente confirmou complexidade quadrática.
2. Corrigir a causa → duas varreduras por índice removem somente pontuação nas bordas; cada borda é percorrida uma vez, sem regex, limite artificial de texto ou alteração dos termos.
3. Verificar equivalência e regressão → 2.541 combinações determinísticas de todos os termos, entradas negativas, espaços e bordas produziram o mesmo resultado que o legado. Foram adicionados 12 casos de pontuação/espaços e um teste com 50 mil caracteres adversariais.
4. Gate local → tipos, lint, testes relevantes, build e formatação aprovados. Revisão 24 e CodeQL remoto ainda necessários para avançar.

## Arquivos alterados e hashes SHA256

- `src/shared/services/optOutCheck.service.ts`: `9912bf8189f20d71dbde34dff3d96cde752b6e3035fc05ba55df0c5ae08ffff2`.
- `src/features/lgpd/services/__tests__/optOutCheck.service.test.ts`: `41b1ee5627cec3a5dd1e29c6f4f796818cbbe5f778c1a03a7f3b4750bf064e02`.
- Este relatório.

## Comandos e resultados reais

- `npx vitest run -c vitest.unit.config.ts src/features/lgpd/services/__tests__/optOutCheck.service.test.ts src/features/cadence/__tests__/optOut.test.ts` → exit 0, 2 arquivos, 49/49 testes PASS. Mantém casos de tenant cruzado e supressão multicanal existentes.
- `npx tsc --noEmit` → exit 0.
- `npm run lint` → exit 0; 343 warnings e 1 info pré-existentes, sem erro. Nenhum warning adjacente foi alterado.
- `npm run build` → exit 0; 6.295 módulos, frontend/backend gerados e precache 159 entradas verificado. Warnings de chunks grandes, anotações de dependência e glob ico sem correspondência permanecem pré-existentes.
- `npx prettier --check` dos dois arquivos → inicialmente apontou estilo/terminação de linha; `--write` limitado aos dois arquivos; novo `--check` exit 0. Diff continua cirúrgico: 35 adições e 5 remoções, sem reformatação adjacente.
- `git diff --check` → sem erro de whitespace.
- Benchmark/diferencial via Node + TypeScript transpile do trecho canônico real → 2.541 equivalências PASS. Para 50k caracteres, legado 5.859 ms versus correção 0,056 ms no caso de sufixo inválido; o teste também percorre bordas de 50k válidas e texto somente de pontuação dentro de orçamento folgado de 1 segundo.

## Evidências e limites

IMPLEMENTADO e TESTADO localmente. A regra CodeQL não foi relaxada e a regex vulnerável foi removida do caminho de dados externos. Revisão manual do diff não encontrou segredo, PII real ou alteração de política de opt-out. Varredura oficial de segredos e novo CodeQL devem ser executados no CI sobre o SHA publicado após aprovação do 24.

Suíte unitária completa, integração, E2E e auditoria de dependências NÃO EXECUTADOS nesta missão limitada: permanecem gates da release no CI. Banco e ambiente de produção não foram acessados ou modificados por esta missão.

## Problemas fora do escopo / handoffs / pendências / riscos

Não foi identificado novo problema fora do escopo. Nenhum handoff novo necessário: o coordenador acompanha os gates já existentes. Pendências: parecer 24 da revisão exata, commit/publicação autorizados pelo 08A e gates remotos. Esta correção isoladamente não aprova release/deploy.

Aprendizado reutilizável: remover pontuação de sufixo com regex não ancorada pode causar tentativas em todos os offsets; varredura explícita das bordas mantém a semântica e limita o trabalho a O(n).

Estado final da missão: EM REVISÃO; autor não aprova a própria entrega.
