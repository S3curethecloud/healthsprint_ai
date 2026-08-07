import type {
  AiClassification,
  AiCoachingRequest,
} from "./contracts";
import { detectPromptInjection } from "./injection";
import { classifyAiRequest } from "./classifier";
import {
  AI_POLICY_VERSION,
  type AiPolicyResult,
} from "./policy";
import { validateAiCoachingRequest } from "./validation";

export interface AiRuntimePolicyEvaluation {
  request?: AiCoachingRequest;
  result: AiPolicyResult;
}

function decisionForClassification(
  classification: AiClassification,
): Pick<
  AiPolicyResult,
  "decision" | "modelInvocationAllowed"
> {
  switch (classification) {
    case "wellness_allowed":
      return {
        decision: "allow",
        modelInvocationAllowed: true,
      };

    case "medical_disallowed":
      return {
        decision: "redirect",
        modelInvocationAllowed: false,
      };

    case "prompt_injection_detected":
    case "unsafe_disallowed":
    case "unsupported":
    case "invalid":
      return {
        decision: "block",
        modelInvocationAllowed: false,
      };
  }
}

export function evaluateAiRuntimePolicy(
  input: unknown,
): AiRuntimePolicyEvaluation {
  const validation = validateAiCoachingRequest(input);

  if (!validation.valid || !validation.request) {
    return {
      result: {
        policyVersion: AI_POLICY_VERSION,
        classification: "invalid",
        decision: "block",
        reasons: validation.reasons,
        promptInjectionDetected: false,
        modelInvocationAllowed: false,
      },
    };
  }

  const request = validation.request;

  const injection = detectPromptInjection(
    request.question,
  );

  const classification = classifyAiRequest(
    request,
    injection,
  );

  const decision =
    decisionForClassification(classification);

  return {
    request,
    result: {
      policyVersion: AI_POLICY_VERSION,
      classification,
      decision: decision.decision,
      reasons:
        injection.detected
          ? injection.indicators
          : [classification],
      promptInjectionDetected: injection.detected,
      modelInvocationAllowed:
        decision.modelInvocationAllowed,
    },
  };
}
