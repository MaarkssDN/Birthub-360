-- Create policy for DocumentEmbedding (Onda S1 - Agente 01)
CREATE POLICY "tenant_isolation" ON "DocumentEmbedding" AS PERMISSIVE FOR ALL TO public USING ("tenantId" = current_setting('app.current_tenant_id', true));
