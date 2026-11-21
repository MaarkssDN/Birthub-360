export interface PullRequestDoDInput {
  prNumber: number;
  headSha: string;
  typecheckPassed: boolean;
  lintPassed: boolean;
  unitTestsPassed: boolean;
  architectureCheckPassed: boolean;
  independentReviewStatus: 'APROVADO' | 'REPROVADO' | 'BLOQUEADO' | 'AUSENTE';
  reviewedSha?: string;
}

export interface PullRequestDoDVerdict {
  readyToMerge: boolean;
  failedGates: string[];
}

export function evaluatePullRequestDefinitionOfDone(
  input: PullRequestDoDInput,
): PullRequestDoDVerdict {
  const failedGates: string[] = [];

  if (!input.typecheckPassed) failedGates.push('TYPECHECK_FAILED');
  if (!input.lintPassed) failedGates.push('LINT_FAILED');
  if (!input.unitTestsPassed) failedGates.push('UNIT_TESTS_FAILED');
  if (!input.architectureCheckPassed) failedGates.push('ARCHITECTURE_GATE_FAILED');
  if (input.independentReviewStatus !== 'APROVADO') {
    failedGates.push(`INDEPENDENT_REVIEW_${input.independentReviewStatus}`);
  } else if (!input.reviewedSha || input.reviewedSha !== input.headSha) {
    failedGates.push('REVIEW_SHA_MISMATCH');
  }

  return {
    readyToMerge: failedGates.length === 0,
    failedGates,
  };
}
