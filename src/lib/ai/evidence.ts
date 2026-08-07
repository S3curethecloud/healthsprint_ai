import type {
  AiClassification,
  AiIntent,
  AiPolicyDecision,
} from "./contracts";

export const AI_EVIDENCE_VERSION = "1.0" as const;

export interface AiDecisionEvidence {
  version: typeof AI_EVIDENCE_VERSION;
  timestamp: string;
  requestId: string;
  endpoint: string;
  intent?: AiIntent;
  classification: AiClassification;
  policyDecision: AiPolicyDecision;
  promptInjectionDetected: boolean;
  inferenceAttempted: boolean;
  model?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  responseStatus:
    | "success"
    | "blocked"
    | "redirected"
    | "unavailable"
    | "invalid";
}

/**
 * Evidence must never contain raw coaching questions,
 * raw Health Connect records, permission tokens,
 * full prompts, full model responses, credentials,
 * or free-text medical disclosures.
 */
export type AiEvidenceRecord = Readonly<AiDecisionEvidence>;
