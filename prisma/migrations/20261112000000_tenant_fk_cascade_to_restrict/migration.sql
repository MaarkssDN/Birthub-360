-- TAREFA-SANEAMENTO-014 / BT360-DT-0013: audit & history FKs -> RESTRICT
-- Business-entity org FKs remain CASCADE (tenant teardown mechanism).
-- Consent chain tables already protected by prior LGPD migrations (RESTRICT + triggers).

ALTER TABLE "AIGuardrailEvent" DROP CONSTRAINT "AIGuardrailEvent_organizationId_fkey";
ALTER TABLE "AIGuardrailEvent" ADD CONSTRAINT "AIGuardrailEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgentExecution" DROP CONSTRAINT "AgentExecution_organizationId_fkey";
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgentMemoryRecord" DROP CONSTRAINT "AgentMemoryRecord_organizationId_fkey";
ALTER TABLE "AgentMemoryRecord" ADD CONSTRAINT "AgentMemoryRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RoleMemoryRecord" DROP CONSTRAINT "RoleMemoryRecord_organizationId_fkey";
ALTER TABLE "RoleMemoryRecord" ADD CONSTRAINT "RoleMemoryRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationMemoryRecord" DROP CONSTRAINT "OrganizationMemoryRecord_organizationId_fkey";
ALTER TABLE "OrganizationMemoryRecord" ADD CONSTRAINT "OrganizationMemoryRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadStageHistory" DROP CONSTRAINT "LeadStageHistory_organizationId_fkey";
ALTER TABLE "LeadStageHistory" ADD CONSTRAINT "LeadStageHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DealClosureEvent" DROP CONSTRAINT "DealClosureEvent_organizationId_fkey";
ALTER TABLE "DealClosureEvent" ADD CONSTRAINT "DealClosureEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ForecastSnapshot" DROP CONSTRAINT "ForecastSnapshot_organizationId_fkey";
ALTER TABLE "ForecastSnapshot" ADD CONSTRAINT "ForecastSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AccountIntelligenceSnapshot" DROP CONSTRAINT "AccountIntelligenceSnapshot_organizationId_fkey";
ALTER TABLE "AccountIntelligenceSnapshot" ADD CONSTRAINT "AccountIntelligenceSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CopilotoDealHealthSnapshot" DROP CONSTRAINT "CopilotoDealHealthSnapshot_organizationId_fkey";
ALTER TABLE "CopilotoDealHealthSnapshot" ADD CONSTRAINT "CopilotoDealHealthSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CopilotoConsentRecord" DROP CONSTRAINT "CopilotoConsentRecord_organizationId_fkey";
ALTER TABLE "CopilotoConsentRecord" ADD CONSTRAINT "CopilotoConsentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationAiConsent" DROP CONSTRAINT "OrganizationAiConsent_organizationId_fkey";
ALTER TABLE "OrganizationAiConsent" ADD CONSTRAINT "OrganizationAiConsent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OptOutRecord" DROP CONSTRAINT "OptOutRecord_organizationId_fkey";
ALTER TABLE "OptOutRecord" ADD CONSTRAINT "OptOutRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CallLog" DROP CONSTRAINT "CallLog_organizationId_fkey";
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VoiceCallLog" DROP CONSTRAINT "VoiceCallLog_organizationId_fkey";
ALTER TABLE "VoiceCallLog" ADD CONSTRAINT "VoiceCallLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ThreeCXCallEvent" DROP CONSTRAINT "ThreeCXCallEvent_organizationId_fkey";
ALTER TABLE "ThreeCXCallEvent" ADD CONSTRAINT "ThreeCXCallEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BitrixSyncLog" DROP CONSTRAINT "BitrixSyncLog_organizationId_fkey";
ALTER TABLE "BitrixSyncLog" ADD CONSTRAINT "BitrixSyncLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExternalCrmSyncLog" DROP CONSTRAINT "ExternalCrmSyncLog_organizationId_fkey";
ALTER TABLE "ExternalCrmSyncLog" ADD CONSTRAINT "ExternalCrmSyncLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DomainEventOutbox" DROP CONSTRAINT "DomainEventOutbox_organizationId_fkey";
ALTER TABLE "DomainEventOutbox" ADD CONSTRAINT "DomainEventOutbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DomainEventConsumption" DROP CONSTRAINT "DomainEventConsumption_organizationId_fkey";
ALTER TABLE "DomainEventConsumption" ADD CONSTRAINT "DomainEventConsumption_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProspectingSearchExecution" DROP CONSTRAINT "ProspectingSearchExecution_organizationId_fkey";
ALTER TABLE "ProspectingSearchExecution" ADD CONSTRAINT "ProspectingSearchExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FlywheelApproachRecord" DROP CONSTRAINT "FlywheelApproachRecord_organizationId_fkey";
ALTER TABLE "FlywheelApproachRecord" ADD CONSTRAINT "FlywheelApproachRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
