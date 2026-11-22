-- CreateTable
CREATE TABLE "CustomAiTool" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAiTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomAiTool_organizationId_idx" ON "CustomAiTool"("organizationId");

-- AddForeignKey
ALTER TABLE "CustomAiTool" ADD CONSTRAINT "CustomAiTool_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "CustomAiTool" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomAiTool" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "CustomAiTool" AS PERMISSIVE FOR ALL TO public
    USING ("organizationId" = current_setting('app.current_tenant_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_tenant_id', true));
