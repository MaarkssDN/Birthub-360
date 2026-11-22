import type { ValidationIssue } from './ValidationEngine.js';

export type { ValidationIssue };

export type NodeType =
  | 'start'
  | 'voice'
  | 'llm'
  | 'prompt'
  | 'condition'
  | 'action'
  | 'router'
  | 'webhook'
  | 'end'
  | 'tool'
  | 'knowledge'
  | 'switch'
  | 'memory'
  | 'question'
  | string;

export interface StudioNodeData {
  label: string;
  category?: string;
  config?: Record<string, unknown>;
  metrics?: {
    invocations?: number;
    errorRate?: number;
    latencyMs?: number;
  };
  [key: string]: unknown;
}

export interface StudioNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: StudioNodeData;
  [key: string]: unknown;
}

export interface StudioEdgeData {
  category?: string;
  description?: string;
  [key: string]: unknown;
}

export interface StudioEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: StudioEdgeData;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  [key: string]: unknown;
}

export interface WorkflowVersionSummary {
  id?: string;
  workflowId?: string;
  version: number;
  description?: string | null;
  createdAt?: string | Date;
  createdBy?: string | null;
  publishedAt?: string | Date | null;
  isActive?: boolean;
  [key: string]: unknown;
}
