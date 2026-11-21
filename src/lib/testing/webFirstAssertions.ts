export interface PlaywrightSleepAuditResult {
  compliant: boolean;
  hardSleepOccurrences: number;
  suggestion: string;
}

const HARD_SLEEP_REGEX = /\b(?:page|frame)\.waitForTimeout\s*\(/g;

export function auditPlaywrightTestForHardSleeps(sourceCode: string): PlaywrightSleepAuditResult {
  const matches = sourceCode.match(HARD_SLEEP_REGEX) ?? [];
  return {
    compliant: matches.length === 0,
    hardSleepOccurrences: matches.length,
    suggestion:
      matches.length > 0
        ? 'Substitua page.waitForTimeout() por asserções web-first do Playwright (ex.: await expect(locator).toBeVisible()).'
        : 'Suíte em conformidade com web-first assertions.',
  };
}
