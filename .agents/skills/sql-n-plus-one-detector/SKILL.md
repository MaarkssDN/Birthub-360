---
name: sql-n-plus-one-detector
description: Detecção e eliminação de problemas de N+1 queries no Prisma Client e rotas do backend. Otimiza carregamento de relacionamentos reais do schema (Lead, Activity, Contact, Company) e reduz latência no PostgreSQL.
---

# SQL N+1 Detector — Birth Hub 360

## Objetivo
Identificar e corrigir padrões de consulta onde o backend executa 1 query inicial para listar registros principais e N queries adicionais dentro de loops para buscar entidades relacionadas (ex: `Activity`, `Contact`, `CrmDealItem`, `TimelineEvent`).

## Padrões Ofensivos no Prisma (`prisma/schema.prisma`)

### Exemplo de Anti-Pattern (N+1):
```typescript
// Ruim: 1 query para leads + N queries para activities dentro do map
const leads = await prisma.lead.findMany({ where: { organizationId } });
const leadsWithActivities = await Promise.all(
  leads.map(async (lead) => {
    const activities = await prisma.activity.findMany({
      where: { leadId: lead.id, organizationId },
    });
    return { ...lead, activities };
  }),
);
```

### Soluções Recomendadas:

#### 1. Uso de `include` / `select` nativo do Prisma:
```typescript
// Bom: o Prisma agrupa automaticamente em query com WHERE IN (...)
const leadsWithActivities = await prisma.lead.findMany({
  where: { organizationId },
  include: {
    activities: {
      select: {
        id: true,
        type: true,
        owner: true,
        date: true,
        time: true,
        status: true,
        observations: true,
      },
    },
  },
});
```

#### 2. Agrupamento em Batch com `findMany({ where: { leadId: { in: leadIds } } })`:
Para fluxos onde os dados são agregados em serviços distintos, colete todos os IDs e busque em uma única query com o operador `in`, mantendo sempre o escopo de `organizationId`.

## Checklist de Auditoria
- [ ] Nenhum `await prisma.<model>.*` existe dentro de laços `.map()`, `.forEach()` ou `for..of`.
- [ ] Queries que listam tabelas com relacionamentos limitam as colunas selecionadas (`select`).
- [ ] Relacionamentos volumosos aplicam paginação (`take`, `skip` ou cursor).
