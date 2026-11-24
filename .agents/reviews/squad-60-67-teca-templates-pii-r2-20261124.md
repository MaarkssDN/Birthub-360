Auditor (Agente 09): Silas (Agente 09 — Auditor Independente e Gate Final)
Runtime da Auditoria (Devin/Claude/etc): Devin (Cognition) — subagente independente do autor
Agente Avaliado (ID): 67 — Teca (Templates e Sanitização de Mensagens, Squad 60)
Runtime do Avaliado: não informado no run doc; commit author `MaarkssDN <marcelinhomarkss@gmail.com>`
Onda/Branch: DEM-20261123-001 / estrutura de Squads — `agente/67-templates-pii-s60` (worktree `squads/squad-60/wt-67`, base `integracao/onda-3-dem20261123` = `5422d99c3e`)
Hash/Commit Auditado: `047de6f4cae431c2f0f992be6d6184f19b080bf6` (código) — HEAD da branch `0fd493d93fbfbabe21095aba217e8c6e1a460f5c` (run doc r2). **Qualquer alteração pós estes hashes invalida o review.**
Revisão anterior: `.agents/reviews/squad-60-67-teca-templates-pii-20261124.md` — REPROVADO em `adae9741f1` (ACH-01, ACH-02).
Worktree de auditoria: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-09-audit-onda3` — branch `agente/09-audit-onda3`

## Verificações de Gate
- [x] P1-P4 (Escopo e Simplicidade) respeitados? — Sim. `git diff adae9741f1..047de6f4ca` toca somente `sanitizer.ts` e seu teste dedicado; `0fd493d93f` adiciona apenas run doc. Diff total vs base `5422d99c3e`: 1 source, 1 teste, run doc, lease e handoffs. Ownership mantida (`67 → src/features/notifications/templates/**`, MATRIZ_PROPRIEDADE).
- [x] Propriedade de ficheiros respeitada? — Sim; sem colisão nova.
- [x] Regras de Segurança, LGPD (B-13) e Tenancy (B-10)? — Parcialmente: ACH-01/ACH-02 sanados para marcação real; resta bypass por **entidades HTML** no modo `stripHtml=false` (ACH-03 abaixo) — bloqueia adoção em canal HTML, não em texto puro.
- [x] Evidências de sucesso/testes? — Reexecutadas: `npx vitest run tests/unit/features/notifications/templates/sanitizer.test.ts` → **18/18**; `tests/unit/features/voice-hub/onda3VoiceSquad60.test.ts` → **5/5** (total 23/23, confere com o claim); `npx tsc --noEmit` → exit 0; `npx biome lint src/features/notifications/templates/sanitizer.ts` → limpo.

## Reprodução das provas originais (todas agora falham como bypass)
Executadas via `npx tsx` contra `047de6f4ca`, sem alterar arquivos de produção:

ACH-01 (tags fragmentando PII):
- `sanitizeFreeTextVariable('CPF 123.<b>456</b>.789-01')` → `cleanValue: 'CPF [CPF_REDACTED]'`, `wasRedacted: true`, `['cpf']` ✅
- `sanitizeOutboundMessageBody('CPF 123.<b>456</b>.789-01')` → `'CPF [CPF_REDACTED]'`, `['cpf']` ✅
- `sanitizeWhatsAppTemplatePayload` (templateBody literal) → `renderedText: 'CPF [CPF_REDACTED]'`, `['cpf']` ✅
- Telefone `11 <b>99999</b>-8888` → `[PHONE_REDACTED]` `['phone']`; e-mail `maria<b>@</b>empresa.com` → `[EMAIL_REDACTED]` `['email']` ✅
- `detectPiiCategories('CPF 123.<b>456</b>.789-01')` → `['cpf']` ✅

ACH-02 (+55 como cartão):
- `'+55 11 99999-8888'` → `[PHONE_REDACTED]`, `['phone']` ✅
- `'+5511999998888'` → `[PHONE_REDACTED]`, `['phone']` ✅
- `detectPiiCategories('+55 11 99999-8888')` → `['phone']` (sem `credit_card`) ✅
- `'4111 1111 1111 1111'` → `[CARD_REDACTED]`, `['credit_card']` ✅

## Variantes adversariais testadas pelo auditor (além das provas originais)
Cobertura confirmada em `sanitizeFreeTextVariable`/`sanitizeOutboundMessageBody`/`detectPiiCategories`:
- Tags aninhadas `123.<b><i>456</i></b>.789-01`, tag com atributo `class="x"`, comentário `<!--x-->`, tag custom `<foo>`, quebra `<br>` → todas redigidas como `cpf` ✅
- `stripHtml=false` com PII fragmentado (`CPF 123.<b>456</b>.789-01 <p>olá</p>`) → devolve versão normalizada `'CPF [CPF_REDACTED] olá'`, fail-closed vence preservação de HTML ✅
- `stripHtml=false` sem PII (`<p>Oi <b>maria</b></p>`) → HTML preservado intacto ✅
- `stripHtml=false` com PII direto (`<p>CPF 123.456.789-01</p>`) → `<p>CPF [CPF_REDACTED]</p>` (HTML preservado, PII mascarada) ✅
- PII fragmentado dentro de variável de template → redigida e `redactedVariables` preenchido ✅
- Telefone dentro de atributo (`<a href="tel:11999998888">`) → removido junto com a tag ✅
- Luhn: Visa 16 dígitos e Amex 15 dígitos válidos → `credit_card`; `4111...1112` (Luhn inválido) → não mascara (trade-off anti-falso-positivo, aceitável — cartões reais passam Luhn); `ref 1234567890123` (13 dígitos, Luhn falha) → preservado ✅

## Achado residual (não bloqueia canais de texto; CONDIÇÃO para canal HTML)

### ACH-03 — Entidades HTML não são decodificadas antes da varredura (bypass residual no modo `stripHtml=false`)
`stripMarkup` (`sanitizer.ts:38-40`) remove apenas `<[^>]*>` e `{{ }}`; entidades (`&lt;`, `&#64;`, `&#49;`) permanecem literais e nunca são decodificadas. Provas executadas:
- `sanitizeOutboundMessageBody('<p>CPF 123.&lt;b&gt;456&lt;/b&gt;.789-01</p>', { stripHtml: false })` → retorna `<p>CPF 123.&lt;b&gt;456&lt;/b&gt;.789-01</p>` **sem nenhuma categoria** — qualquer renderer HTML a jusante decodifica as entidades, as "tags" reaparecem e o CPF `123.456.789-01` se recompõe em claro no e-mail entregue.
- `'<p>contato maria&#64;empresa.com</p>'` (stripHtml=false) → preservado sem `email`.
- `sanitizeFreeTextVariable('CPF &#49;&#50;&#51;...')` (CPF 100% em entidades numéricas) → `wasRedacted: false`.
- `detectPiiCategories('maria&#64;empresa.com')` → `[]`.

Impacto: em canais de **texto puro** (WhatsApp/SMS — destino atual do módulo), entidades nunca são decodificadas, então o artefato entregue exibe `&lt;b&gt;` literal e o PII **não** se recompõe — risco baixo. Em canal **HTML** (o próprio `stripHtml=false` existe para "caminho e-mail HTML futuro", teste `sanitizer.test.ts:98`) o vazamento é real e reproduzível. O parecer r1 exigia "decidir tratamento de entidades HTML"; a decisão não foi tomada.

**Condição de aceite (obrigatória antes de qualquer consumidor em canal HTML/e-mail renderizado):** decodificar entidades HTML (ao menos `&lt; &gt; &amp; &#NN; &#xHH; &quot; &#39;`) antes da varredura — idealmente dentro de `stripMarkup` ou como pré-passe dedicada — e adicionar testes de regressão para `&lt;b&gt;`, `&#64;` e entidades numéricas em `sanitizeOutboundMessageBody(stripHtml=false)`, `sanitizeFreeTextVariable` e `detectPiiCategories`. Alternativa aceitável: documentar/proibir explicitamente `stripHtml=false` para saídas que serão renderizadas como HTML até a correção.

### Observações não bloqueantes (registradas para o histórico)
- Ofuscação por whitespace não-ASCII dentro do PII (`123.\u00A0456`, tab, zero-width `\u200B`) também impede o match dos regexes — limitação inerente a scanning por regex, pré-existente e fora do escopo desta correção; recomendo handoff ao Agente 00 para backlog de hardening do scanner.
- `{{ }}` dentro do número (`123.{{ }}456.789-01` → `123. 456.789-01`) não casa CPF — resultado não é CPF válido, sem vazamento.
- O sanitizer continua **sem consumidor de produção** (grep só encontra testes). A fundação está correta, mas o risco LGPD real em `CadenceDispatchers`/`templateRenderer`/`notification.service.ts` permanece até os handoffs serem acionados — pendência do Agente 00, não defeito desta entrega.

## Decisão
**APROVADO-COM-CONDICAO**

Os dois bloqueios do parecer r1 estão **verificadamente sanados** no SHA `047de6f4cae431c2f0f992be6d6184f19b080bf6`: ACH-01 (strip de marcação antes da varredura + comparação shadow fail-closed em `stripHtml=false`) e ACH-02 (phone antes de credit_card + validação Luhn), com 8 testes de regressão novos que falhavam antes e passam agora (18/18 no módulo, 23/23 no escopo, tsc 0, biome limpo).

A condição ACH-03 (entidades HTML) **não** impede a aprovação porque: (a) os canais de texto puro — único uso realista hoje — não decodificam entidades; (b) não existe consumidor de produção; (c) a correção é pequena e está precisamente delimitada. Fica **vedada** a fiação do sanitizer (especialmente `stripHtml=false`) em qualquer pipeline que emita HTML renderizado antes da correção de entidades.

Este parecer **não autoriza merge/push/deploy** por si só — gate de integração global permanece com o Agente 00/Ória. Qualquer alteração pós `047de6f4ca`/`0fd493d93f` invalida o review.
