import {
  AI_CONTRACT_VERSION,
  type AiClassification,
  type AiCoachingControlledResponse,
  type AiPolicyDecision,
} from "./contracts";

const GENERAL_SAFETY_NOTICE =
  "HealthSprint provides general wellness guidance and does not provide medical diagnosis or treatment.";

export function createControlledAiResponse(input: {
  requestId: string;
  classification: Exclude<
    AiClassification,
    "wellness_allowed"
  >;
  policyDecision: Extract<
    AiPolicyDecision,
    "block" | "redirect"
  >;
}): AiCoachingControlledResponse {
  const {
    requestId,
    classification,
    policyDecision,
  } = input;

  if (
    classification === "medical_disallowed"
  ) {
    return {
      version: AI_CONTRACT_VERSION,
      requestId,
      status: "redirected",
      classification,
      policyDecision: "redirect",
      message:
        "That request falls outside HealthSprint's wellness-only scope. Please consult an appropriate healthcare professional for medical diagnosis, medication, treatment, or symptom interpretation.",
      safetyNotice: GENERAL_SAFETY_NOTICE,
    };
  }

  if (
    classification === "prompt_injection_detected"
  ) {
    return {
      version: AI_CONTRACT_VERSION,
      requestId,
      status: "blocked",
      classification,
      policyDecision: "block",
      message:
        "The coaching request could not be processed because it attempted to override or extract protected application instructions.",
      safetyNotice: GENERAL_SAFETY_NOTICE,
    };
  }

  if (classification === "unsafe_disallowed") {
    return {
      version: AI_CONTRACT_VERSION,
      requestId,
      status: "blocked",
      classification,
      policyDecision: "block",
      message:
        "HealthSprint cannot provide unsafe restriction or punishment-based wellness guidance.",
      safetyNotice: GENERAL_SAFETY_NOTICE,
    };
  }

  return {
    version: AI_CONTRACT_VERSION,
    requestId,
    status: "invalid",
    classification,
    policyDecision,
    message:
      "The coaching request could not be processed.",
    safetyNotice: GENERAL_SAFETY_NOTICE,
  };
}

export function createUnavailableAiResponse(
  requestId: string,
): import("./contracts").AiCoachingUnavailableResponse {
  return {
    version: AI_CONTRACT_VERSION,
    requestId,
    status: "unavailable",
    classification: "wellness_allowed",
    policyDecision: "allow",
    message:
      "AI coaching is not available yet. Your request passed HealthSprint safety policy, but model inference is not enabled.",
    safetyNotice: GENERAL_SAFETY_NOTICE,
  };
}
