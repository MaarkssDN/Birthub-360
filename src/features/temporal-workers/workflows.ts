import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities.js';
import type { ScrapeProspectParams, ScrapeProspectResult } from './activities.js';

const { scrapeProspect } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function prospectWorkflow(params: ScrapeProspectParams): Promise<ScrapeProspectResult> {
  return await scrapeProspect(params);
}
