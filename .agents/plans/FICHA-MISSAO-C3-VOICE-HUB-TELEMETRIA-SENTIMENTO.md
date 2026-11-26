# FICHA DE MISSÃO INDEPENDENTE — TRILHA C.3
**Missão:** Exibição de Turnos Diarizados e Sentimento com Redação LGPD no Voice Hub  
**Squads:** Squad 60 (Voz, Telefonia & Mensageria) & Squad 00 (Privacidade & LGPD) & Squad 30 (UX)  
**Ownership Primário:** Agente 65 (Lena — Voice Hub UI), Agente 63 (Lira — Diarização) & Agente 07 (Íris — Privacidade LGPD)  
**Status:** PLANEJAMENTO / AGUARDANDO DESPACHO FORMAL (NO-GO PARA IMPLEMENTAÇÃO)  

---

### 1. Escopo Específico
Integrar no player de chamadas e tela de supervisão (`src/features/voice-hub/components/Supervision.tsx` / `Telephony.tsx`) a timeline de turnos diarizados (Locutor vs Interlocutor) e o indicador de sentimento (Positivo, Neutro, Negativo) gerados por `CallRecordService`.

### 2. Dependências
- Backend: Métodos `analyzeSentiment` e `parseDiarizedTurns` em `src/features/voice-hub/services/callRecord.service.ts` (4/4 testes passando).
- Governança LGPD: Máscara mandante de PII (`[REDACTED_CPF]`, `[REDACTED_PHONE]`, `[REDACTED_EMAIL]`) aplicada em runtime.
- Contrato: Interface `CallRecord` enriquecida em `PrismaCallRecordRepository.ts`.

### 3. Critérios de Aceite
1. Visualização em formato de diálogo sequencial com marcação temporal de cada fala.
2. Badges semânticos de sentimento utilizando a paleta oficial de tokens de status.
3. Garantia de privacidade: nenhum dado pessoal sensível ou não mascarado pode ser exibido na interface pública/operacional.
4. Estados explícitos de UI: carregamento de áudio/transcrição, chamada sem transcrição disponível, erro de streaming e áudio vazio.

### 4. Fronteiras e Prevenção de Sobreposição
- Não alterar endpoints de sinalização SIP/WebRTC (propriedade do Agente 61 - Nando).
- Não modificar gravação bruta de storage (propriedade do Agente 62 - Sol).
