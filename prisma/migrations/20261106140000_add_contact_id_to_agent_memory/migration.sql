-- Migration: 20261106140000_add_contact_id_to_agent_memory
-- Responsável: Agente 01 (Plataforma, Segurança e Dados) & 01A
-- Onda: Onda 1 — Saneamento P1 (Handoff 01a-para-01-schema-agentmemory-titular-lgpd.md)
--
-- Adiciona suporte a identificação e expurgo de titular LGPD na memória de agentes:
-- 1. Coluna contactId opcional em AgentMemory.
-- 2. Índice composto em (organizationId, contactId) para busca eficiente em expurgo e portabilidade.

-- AlterTable AgentMemory
ALTER TABLE "AgentMemory" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentMemory_organizationId_contactId_idx" ON "AgentMemory"("organizationId", "contactId");
