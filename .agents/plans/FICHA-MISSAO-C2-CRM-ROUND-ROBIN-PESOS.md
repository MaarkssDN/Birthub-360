# FICHA DE MISSÃO INDEPENDENTE — TRILHA C.2
**Missão:** Configuração e Validação de Pesos de Performance no Round-Robin Comercial  
**Squads:** Squad 40 (CRM, Pipeline & Receita) & Squad 30 (UX, Design System & Marca)  
**Ownership Primário:** Agente 47 (Dante — Roteamento) & Agente 44 (Lola — Cadências) & Agente 33 (Célia — Componentes)  
**Status:** PLANEJAMENTO / AGUARDANDO DESPACHO FORMAL (NO-GO PARA IMPLEMENTAÇÃO)  

---

### 1. Escopo Específico
Disponibilizar na interface de configurações de equipe (`src/features/settings/components/TeamManagement.tsx` / `Settings.tsx`) a edição controlada do campo `performanceWeight` (peso de 1 a 5) para roteamento automático ponderado de leads via `assignLeadWeightedByScore`.

### 2. Dependências
- Backend: Função `assignLeadWeightedByScore` em `src/features/crm/routing/round-robin.ts` (testada com 5/5 testes unitários).
- Modelo: Campo numérico de peso associado aos membros da organização no Prisma (`UserOrganization` / `TeamMember`).
- Permissões: Restrição estrita de autorização — apenas papéis `ADMIN` e `GESTOR` podem alterar pesos de performance (Fail-Closed).

### 3. Critérios de Aceite
1. Input numérico controlado de 1 a 5 com feedback visual de distribuição percentual estimada.
2. Validação com Zod no frontend e backend impedindo valores negativos, zero ou superiores a 5.
3. Auditoria de alteração registrada no `auditLog` com tenantId, userId, peso anterior e peso novo (B-10 / P27).
4. Testes unitários de validação e permissão cobrindo rejeição de tentativa de edição por papéis não autorizados (`SDR`, `CLOSER`, `VISUALIZADOR`).

### 4. Fronteiras e Prevenção de Sobreposição
- Não alterar a lógica matemática de ponderação já validada em `round-robin.ts`.
- Não interferir nas regras de deduplicação (propriedade do Agente 48 - Jade).
