export const MAX_AUTONOMOUS_AGENT_STEPS = 10;

export interface AutonomousAgentStepResult<TOutput> {
  done: boolean;
  output?: TOutput;
  thought?: string;
  action?: string;
}

export class MaxAgentStepsExceededError extends Error {
  readonly code = 'MAX_AGENT_STEPS_EXCEEDED';
  readonly maxSteps: number;
  readonly executedSteps: number;

  constructor(maxSteps: number, executedSteps: number) {
    super(
      `Loop de auto-reflexão do agente autônomo interrompido ao atingir o limite rígido de ${maxSteps} passos (executados: ${executedSteps}).`,
    );
    this.name = 'MaxAgentStepsExceededError';
    this.maxSteps = maxSteps;
    this.executedSteps = executedSteps;
  }
}

export async function runAutonomousSupervisorLoop<TOutput>(params: {
  agentId: string;
  tenantId: string;
  maxSteps?: number;
  executeStep: (stepIndex: number) => Promise<AutonomousAgentStepResult<TOutput>>;
}): Promise<{ output: TOutput; stepsExecuted: number; traceThoughts: string[] }> {
  const configuredMax = params.maxSteps ?? MAX_AUTONOMOUS_AGENT_STEPS;
  const effectiveMaxSteps = Math.min(
    Math.max(1, Math.trunc(configuredMax)),
    MAX_AUTONOMOUS_AGENT_STEPS,
  );

  const traceThoughts: string[] = [];

  for (let step = 1; step <= effectiveMaxSteps; step++) {
    const stepRes = await params.executeStep(step);
    if (stepRes.thought) {
      traceThoughts.push(stepRes.thought);
    }
    if (stepRes.done && stepRes.output !== undefined) {
      return {
        output: stepRes.output,
        stepsExecuted: step,
        traceThoughts,
      };
    }
  }

  throw new MaxAgentStepsExceededError(effectiveMaxSteps, effectiveMaxSteps);
}
