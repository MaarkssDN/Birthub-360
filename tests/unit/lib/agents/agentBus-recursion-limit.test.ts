import { describe, expect, it } from 'vitest';
import { agentBus, LoopDetectedException } from '../../../../src/lib/agents/agentBus.js';

describe('AgentBus — Recursion Limit and Loop Safeguards', () => {
  it('permite mensagens normais incrementando o hopCount', () => {
    const msg = agentBus.routeMessage({
      senderAgentId: 'agent-a',
      recipientAgentId: 'agent-b',
      payload: { action: 'analyze' },
    });

    expect(msg.hopCount).toBe(1);
    expect(msg.correlationId).toMatch(/^corr-/);
    expect(msg.traceParent).toBeDefined();
  });

  it('interrompe loop simulado entre dois agentes com LoopDetectedException no quinto hop excedido', () => {
    let currentHop = 0;
    const correlationId = 'test-loop-corr';

    // Simula ping-pong ciclico: A -> B -> A -> B -> A -> B
    const runPingPong = () => {
      let currentMsg = agentBus.routeMessage({
        senderAgentId: 'agent-a',
        recipientAgentId: 'agent-b',
        payload: { text: 'ping' },
        correlationId,
        hopCount: currentHop,
      });

      for (let i = 0; i < 10; i++) {
        currentHop = currentMsg.hopCount;
        const sender = currentMsg.recipientAgentId;
        const recipient = currentMsg.senderAgentId;
        currentMsg = agentBus.routeMessage({
          senderAgentId: sender,
          recipientAgentId: recipient,
          payload: { text: 'pong' },
          correlationId: currentMsg.correlationId,
          hopCount: currentHop,
        });
      }
    };

    expect(runPingPong).toThrow(LoopDetectedException);
  });
});
