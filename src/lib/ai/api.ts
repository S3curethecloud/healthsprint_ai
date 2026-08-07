import type {
  AiClassification,
  AiCoachingResponse,
} from "./contracts";
import {
  createControlledAiResponse,
  createUnavailableAiResponse,
} from "./responses";
import { evaluateAiRuntimePolicy } from "./runtime-policy";

export interface AiApiEvaluation {
  httpStatus: number;
  response: AiCoachingResponse;
  evidenceClassification: AiClassification;
  inferenceAttempted: boolean;
  inferenceAllowed: boolean;
  promptInjectionDetected: boolean;
}

function requestIdFromUnknown(input: unknown): string {
  if (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    "requestId" in input &&
    typeof input.requestId === "string" &&
    input.requestId.trim().length > 0 &&
    input.requestId.length <= 128
  ) {
    return input.requestId;
  }

  return "invalid-request";
}

export function evaluateAiApiRequest(
  input: unknown,
): AiApiEvaluation {
  const evaluation =
    evaluateAiRuntimePolicy(input);

  const requestId =
    evaluation.request?.requestId ??
    requestIdFromUnknown(input);

  const { result } = evaluation;

  if (result.classification === "wellness_allowed") {
    if (result.decision !== "allow") {
      return {
        httpStatus: 500,
        response:
          createControlledAiResponse({
            requestId,
            classification: "invalid",
            policyDecision: "block",
          }),
        evidenceClassification: "invalid",
        inferenceAttempted: false,
        inferenceAllowed: false,
        promptInjectionDetected:
          result.promptInjectionDetected,
      };
    }

    return {
      httpStatus: 503,
      response:
        createUnavailableAiResponse(requestId),
      evidenceClassification:
        result.classification,
      inferenceAttempted: false,
      inferenceAllowed: true,
      promptInjectionDetected:
        result.promptInjectionDetected,
    };
  }

  const classification = result.classification;

  if (classification === "medical_disallowed") {
    return {
      httpStatus: 422,
      response:
        createControlledAiResponse({
          requestId,
          classification,
          policyDecision: "redirect",
        }),
      evidenceClassification: classification,
      inferenceAttempted: false,
      inferenceAllowed: false,
      promptInjectionDetected: false,
    };
  }

  if (
    classification ===
      "prompt_injection_detected" ||
    classification === "unsafe_disallowed"
  ) {
    return {
      httpStatus: 403,
      response:
        createControlledAiResponse({
          requestId,
          classification,
          policyDecision: "block",
        }),
      evidenceClassification: classification,
      inferenceAttempted: false,
      inferenceAllowed: false,
      promptInjectionDetected:
        result.promptInjectionDetected,
    };
  }

  return {
    httpStatus: 400,
    response:
      createControlledAiResponse({
        requestId,
        classification,
        policyDecision: "block",
      }),
    evidenceClassification: classification,
    inferenceAttempted: false,
    inferenceAllowed: false,
    promptInjectionDetected: false,
  };
}
