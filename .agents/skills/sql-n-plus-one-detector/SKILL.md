---
name: sql-n-plus-one-detector
description: Detecção e eliminação de problemas de N+1 queries no Prisma Client e rotas do backend. Otimiza carregamento de relacionamentos, reduz latência da API e previne gargalo no PostgreSQL sob concorrência.
---

# SQL N+1 Detector — Birth Hub 360

## Objetivo
Identificar e corrigir padrões de consulta ineficientes onde o backend executa 1 query inicial para listar registros principais e subsequentemente N queries adicionais dentro de loops para buscar entidades relacionadas (ex: contatos, itens de oportunidade, histórico de mensagens).

## Padrões Ofensivos no Prisma

### Exemplo de Anti-Pattern (N+1):
```typescript
// Ruim: 1 query para leads + N queries para tarefas dentro do map
const leads = await prisma.lead.findMany({ where: { organizationId } });
const leadsWithTasks = await Promise.all(
  leads.map(async (lead) => {
    const tasks = await prisma.task.findMany({ where: { leadId: lead.id } });
    return { ...lead, tasks };
  })
);
```

### Soluções Recomendadas:

#### 1. Uso de `include` / `select` nativo do Prisma:
```typescript
// Bom: o Prisma agrupa automaticamente em poucas queries com WHERE IN (...)
const leadsWithTasks = await prisma.lead.findMany({
  where: { organizationId },
  include: {
    tasks: {
      select: { id: true, title: true, status: true, dueDate: true }
    }
  }
});
```

#### 2. Agrupamento em Batch com `findMany({ where: { leadId: { in: leadIds } } })`:
Para situações onde os dados vêm de fontes separadas, colete todos os IDs e busque em uma única query com operador `in`.

#### 3. DataLoader:
Para serviços GraphQL ou composições profundas de microsserviços/módulos, utilize DataLoader com memoização e batching.

## Checklist de Auditoria
- [ ] Nenhum `await prisma.<model>.*` existe dentro de laços `.map()`, `.forEach()` ou loops `for..of`.
- [ ] Queries que listam tabelas com relacionamentos limitam as colunas selecionadas (`select` em vez de carregar modelos inteiros).
- [ ] Relacionamentos volumosos aplicam paginação (`take`, `skip` ou cursores) para não carregar dezenas de milhares de registros na memória do Node.js.
