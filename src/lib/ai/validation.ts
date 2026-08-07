import {
  AI_CONTRACT_VERSION,
  AI_INTENTS,
  type AiCoachingContext,
  type AiCoachingRequest,
  type AiIntent,
} from "./contracts";

export const MAX_AI_REQUEST_ID_LENGTH = 128;
export const MAX_AI_QUESTION_LENGTH = 2_000;

const AI_REQUEST_KEYS = [
  "version",
  "requestId",
  "intent",
  "question",
  "context",
] as const;

const CONTEXT_KEYS: readonly (keyof AiCoachingContext)[] = [
  "calorieTarget",
  "caloriesConsumed",
  "proteinGrams",
  "carbohydrateGrams",
  "fatGrams",
  "hydrationOunces",
  "steps",
  "activityMinutes",
  "latestWeightPounds",
];

export interface AiRequestValidationResult {
  valid: boolean;
  request?: AiCoachingRequest;
  reasons: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isIntent(value: unknown): value is AiIntent {
  return (
    typeof value === "string" &&
    AI_INTENTS.includes(value as AiIntent)
  );
}

function validateContext(
  value: unknown,
  reasons: string[],
): value is AiCoachingContext {
  if (!isRecord(value)) {
    reasons.push("context must be an object");
    return false;
  }

  for (const key of Object.keys(value)) {
    if (!CONTEXT_KEYS.includes(key as keyof AiCoachingContext)) {
      reasons.push(`unsupported context field: ${key}`);
    }
  }

  for (const key of CONTEXT_KEYS) {
    const field = value[key];

    if (field === undefined) {
      continue;
    }

    if (
      typeof field !== "number" ||
      !Number.isFinite(field) ||
      field < 0
    ) {
      reasons.push(`${key} must be a finite non-negative number`);
    }
  }

  return reasons.length === 0;
}

export function validateAiCoachingRequest(
  input: unknown,
): AiRequestValidationResult {
  const reasons: string[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      reasons: ["request must be an object"],
    };
  }

  for (const key of Object.keys(input)) {
    if (
      !AI_REQUEST_KEYS.includes(
        key as (typeof AI_REQUEST_KEYS)[number],
      )
    ) {
      reasons.push(
        `unsupported request field: ${key}`,
      );
    }
  }

  if (input.version !== AI_CONTRACT_VERSION) {
    reasons.push(
      `version must be ${AI_CONTRACT_VERSION}`,
    );
  }

  if (
    typeof input.requestId !== "string" ||
    input.requestId.trim().length === 0 ||
    input.requestId.length > MAX_AI_REQUEST_ID_LENGTH
  ) {
    reasons.push("requestId is invalid");
  }

  if (!isIntent(input.intent)) {
    reasons.push("intent is unsupported");
  }

  if (
    input.question !== undefined &&
    (
      typeof input.question !== "string" ||
      input.question.length > MAX_AI_QUESTION_LENGTH
    )
  ) {
    reasons.push("question is invalid");
  }

  validateContext(input.context, reasons);

  if (reasons.length > 0) {
    return {
      valid: false,
      reasons,
    };
  }

  return {
    valid: true,
    request: input as unknown as AiCoachingRequest,
    reasons: [],
  };
}
