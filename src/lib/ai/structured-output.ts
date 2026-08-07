export const WORKERS_AI_MODEL =
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;

export const AI_COACHING_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
    },
    observations: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },
    suggestedActions: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },
    safetyNotice: {
      type: "string",
    },
  },
  required: [
    "summary",
    "observations",
    "suggestedActions",
    "safetyNotice",
  ],
} as const;

export interface AiStructuredModelOutput {
  summary: string;
  observations: string[];
  suggestedActions: string[];
  safetyNotice: string;
}

export interface AiStructuredOutputValidation {
  valid: boolean;
  output?: AiStructuredModelOutput;
  reasons: string[];
}

const OUTPUT_KEYS = [
  "summary",
  "observations",
  "suggestedActions",
  "safetyNotice",
] as const;

const MAX_TEXT_LENGTH = 1_000;
const MAX_LIST_ITEMS = 5;
const MAX_LIST_ITEM_LENGTH = 500;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateText(
  value: unknown,
  field: string,
  reasons: string[],
): value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > MAX_TEXT_LENGTH
  ) {
    reasons.push(
      `${field} must be a non-empty string no longer than ${MAX_TEXT_LENGTH} characters`,
    );
    return false;
  }

  return true;
}

function validateStringList(
  value: unknown,
  field: string,
  reasons: string[],
): value is string[] {
  if (!Array.isArray(value)) {
    reasons.push(`${field} must be an array`);
    return false;
  }

  if (value.length > MAX_LIST_ITEMS) {
    reasons.push(
      `${field} must contain no more than ${MAX_LIST_ITEMS} items`,
    );
    return false;
  }

  let valid = true;

  for (const item of value) {
    if (
      typeof item !== "string" ||
      item.trim().length === 0 ||
      item.length > MAX_LIST_ITEM_LENGTH
    ) {
      reasons.push(
        `${field} entries must be non-empty strings no longer than ${MAX_LIST_ITEM_LENGTH} characters`,
      );
      valid = false;
    }
  }

  return valid;
}

export function validateStructuredAiOutput(
  input: unknown,
): AiStructuredOutputValidation {
  const reasons: string[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      reasons: ["model output must be an object"],
    };
  }

  for (const key of Object.keys(input)) {
    if (
      !OUTPUT_KEYS.includes(
        key as (typeof OUTPUT_KEYS)[number],
      )
    ) {
      reasons.push(
        `unsupported model output field: ${key}`,
      );
    }
  }

  const summaryValid =
    validateText(
      input.summary,
      "summary",
      reasons,
    );

  const observationsValid =
    validateStringList(
      input.observations,
      "observations",
      reasons,
    );

  const actionsValid =
    validateStringList(
      input.suggestedActions,
      "suggestedActions",
      reasons,
    );

  const safetyNoticeValid =
    validateText(
      input.safetyNotice,
      "safetyNotice",
      reasons,
    );

  if (
    reasons.length > 0 ||
    !summaryValid ||
    !observationsValid ||
    !actionsValid ||
    !safetyNoticeValid
  ) {
    return {
      valid: false,
      reasons,
    };
  }

  return {
    valid: true,
    output: {
      summary: input.summary as string,
      observations: input.observations as string[],
      suggestedActions:
        input.suggestedActions as string[],
      safetyNotice:
        input.safetyNotice as string,
    },
    reasons: [],
  };
}
