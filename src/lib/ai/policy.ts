import type {
  AiClassification,
  AiIntent,
  AiPolicyDecision,
} from "./contracts";

export const AI_POLICY_VERSION = "1.0" as const;

export const APPROVED_AI_INTENTS: readonly AiIntent[] = [
  "daily_summary",
  "meal_guidance",
  "activity_guidance",
  "hydration_guidance",
  "calculation_explanation",
  "general_wellness_question",
];

export const PROHIBITED_AI_BEHAVIORS = [
  "diagnosis",
  "medication_advice",
  "treatment_recommendation",
  "symptom_interpretation",
  "extreme_calorie_restriction",
  "punishment_based_exercise",
  "false_clinician_attribution",
  "autonomous_health_record_modification",
  "automatic_health_connect_write",
  "secret_extraction",
  "system_prompt_extraction",
  "policy_bypass",
] as const;

export type ProhibitedAiBehavior =
  (typeof PROHIBITED_AI_BEHAVIORS)[number];

export interface AiPolicyResult {
  policyVersion: typeof AI_POLICY_VERSION;
  classification: AiClassification;
  decision: AiPolicyDecision;
  reasons: string[];
  promptInjectionDetected: boolean;
  modelInvocationAllowed: boolean;
}

export const MODEL_INVOCATION_ALLOWED_CLASSIFICATION:
  AiClassification = "wellness_allowed";

export const MODEL_INVOCATION_ALLOWED_DECISION:
  AiPolicyDecision = "allow";
