export const AI_CONTRACT_VERSION = "1.0" as const;

export const AI_INTENTS = [
  "daily_summary",
  "meal_guidance",
  "activity_guidance",
  "hydration_guidance",
  "calculation_explanation",
  "general_wellness_question",
] as const;

export type AiIntent = (typeof AI_INTENTS)[number];

export interface AiCoachingContext {
  calorieTarget?: number;
  caloriesConsumed?: number;
  proteinGrams?: number;
  carbohydrateGrams?: number;
  fatGrams?: number;
  hydrationOunces?: number;
  steps?: number;
  activityMinutes?: number;
  latestWeightPounds?: number;
}

export interface AiCoachingRequest {
  version: typeof AI_CONTRACT_VERSION;
  requestId: string;
  intent: AiIntent;
  question?: string;
  context: AiCoachingContext;
}

export const AI_CLASSIFICATIONS = [
  "wellness_allowed",
  "medical_disallowed",
  "unsafe_disallowed",
  "prompt_injection_detected",
  "unsupported",
  "invalid",
] as const;

export type AiClassification =
  (typeof AI_CLASSIFICATIONS)[number];

export const AI_POLICY_DECISIONS = [
  "allow",
  "block",
  "redirect",
] as const;

export type AiPolicyDecision =
  (typeof AI_POLICY_DECISIONS)[number];

export interface AiModelMetadata {
  provider: "cloudflare-workers-ai";
  model: string;
  inferenceAttempted: boolean;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AiCoachingSuccessResponse {
  version: typeof AI_CONTRACT_VERSION;
  requestId: string;
  status: "success";
  classification: "wellness_allowed";
  policyDecision: "allow";
  summary: string;
  observations: string[];
  suggestedActions: string[];
  safetyNotice: string;
  modelMetadata: AiModelMetadata;
}

export interface AiCoachingControlledResponse {
  version: typeof AI_CONTRACT_VERSION;
  requestId: string;
  status: "blocked" | "redirected" | "unavailable" | "invalid";
  classification: Exclude<
    AiClassification,
    "wellness_allowed"
  >;
  policyDecision: "block" | "redirect";
  message: string;
  safetyNotice: string;
  modelMetadata?: AiModelMetadata;
}

export type AiCoachingResponse =
  | AiCoachingSuccessResponse
  | AiCoachingControlledResponse;
