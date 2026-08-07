import type {
  AiClassification,
  AiIntent,
  AiPolicyDecision,
} from "./contracts";
import {
  AI_EVIDENCE_VERSION,
  type AiEvidenceRecord,
} from "./evidence";

export interface CreateAiEvidenceInput {
  requestId: string;
  endpoint: string;
  intent?: AiIntent;
  classification: AiClassification;
  policyDecision: AiPolicyDecision;
  promptInjectionDetected: boolean;
  inferenceAttempted: boolean;
  responseStatus:
    | "success"
    | "blocked"
    | "redirected"
    | "unavailable"
    | "invalid";
  gatewayId?: string;
  model?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export function createAiEvidence(
  input: CreateAiEvidenceInput,
): AiEvidenceRecord {
  return Object.freeze({
    version: AI_EVIDENCE_VERSION,
    timestamp: new Date().toISOString(),
    requestId: input.requestId,
    endpoint: input.endpoint,
    intent: input.intent,
    classification: input.classification,
    policyDecision: input.policyDecision,
    promptInjectionDetected:
      input.promptInjectionDetected,
    inferenceAttempted:
      input.inferenceAttempted,
    gatewayId: input.gatewayId,
    model: input.model,
    latencyMs: input.latencyMs,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    responseStatus: input.responseStatus,
  });
}

export function emitAiEvidence(
  evidence: AiEvidenceRecord,
): void {
  console.info(
    "healthsprint.ai.decision",
    JSON.stringify(evidence),
  );
}
