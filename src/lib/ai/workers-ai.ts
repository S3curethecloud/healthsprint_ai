import {
  AI_CONTRACT_VERSION,
  type AiCoachingRequest,
  type AiCoachingSuccessResponse,
  type AiCoachingUnavailableResponse,
  type AiModelMetadata,
} from "./contracts";
import {
  createUnavailableAiResponse,
  GENERAL_SAFETY_NOTICE,
} from "./responses";
import {
  AI_COACHING_RESPONSE_SCHEMA,
  WORKERS_AI_MODEL,
  validateStructuredAiOutput,
} from "./structured-output";

type WorkersAiMessage = {
  role: "system" | "user";
  content: string;
};

export interface WorkersAiRunInput {
  messages: WorkersAiMessage[];
  response_format: {
    type: "json_schema";
    json_schema:
      typeof AI_COACHING_RESPONSE_SCHEMA;
  };
}

export type WorkersAiRun = (
  model: typeof WORKERS_AI_MODEL,
  input: WorkersAiRunInput,
) => Promise<unknown>;

export interface WorkersAiInferenceResult {
  response:
    | AiCoachingSuccessResponse
    | AiCoachingUnavailableResponse;
  metadata: AiModelMetadata;
}

const SYSTEM_PROMPT = [
  "You are HealthSprint's wellness-only coaching model.",
  "Use only the aggregate wellness context supplied in the request.",
  "Do not diagnose conditions.",
  "Do not provide medication or treatment advice.",
  "Do not interpret symptoms as medical conditions.",
  "Do not recommend extreme calorie restriction or punishment-based exercise.",
  "Do not claim to be a clinician.",
  "Do not request, modify, or write Health Connect records.",
  "Return only content that matches the required structured response schema.",
].join(" ");

function buildMinimalModelInput(
  request: AiCoachingRequest,
): string {
  return JSON.stringify({
    intent: request.intent,
    ...(request.question
      ? { question: request.question }
      : {}),
    context: request.context,
  });
}

function extractStructuredPayload(
  raw: unknown,
): unknown {
  if (
    typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw) &&
    "response" in raw
  ) {
    return raw.response;
  }

  return raw;
}

function metadata(
  latencyMs: number,
): AiModelMetadata {
  return {
    provider: "cloudflare-workers-ai",
    model: WORKERS_AI_MODEL,
    inferenceAttempted: true,
    latencyMs,
  };
}

export async function runWorkersAiCoaching(
  run: WorkersAiRun,
  request: AiCoachingRequest,
): Promise<WorkersAiInferenceResult> {
  const startedAt = performance.now();

  try {
    const raw = await run(
      WORKERS_AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content:
              buildMinimalModelInput(request),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema:
            AI_COACHING_RESPONSE_SCHEMA,
        },
      },
    );

    const modelMetadata =
      metadata(
        Math.max(
          0,
          Math.round(
            performance.now() - startedAt,
          ),
        ),
      );

    const validated =
      validateStructuredAiOutput(
        extractStructuredPayload(raw),
      );

    if (!validated.valid || !validated.output) {
      return {
        response:
          createUnavailableAiResponse(
            request.requestId,
            "AI coaching is temporarily unavailable because the model returned an invalid response.",
          ),
        metadata: modelMetadata,
      };
    }

    return {
      response: {
        version: AI_CONTRACT_VERSION,
        requestId: request.requestId,
        status: "success",
        classification:
          "wellness_allowed",
        policyDecision: "allow",
        summary:
          validated.output.summary,
        observations:
          validated.output.observations,
        suggestedActions:
          validated.output.suggestedActions,
        safetyNotice:
          GENERAL_SAFETY_NOTICE,
        modelMetadata,
      },
      metadata: modelMetadata,
    };
  } catch {
    const modelMetadata =
      metadata(
        Math.max(
          0,
          Math.round(
            performance.now() - startedAt,
          ),
        ),
      );

    return {
      response:
        createUnavailableAiResponse(
          request.requestId,
          "AI coaching is temporarily unavailable. Please try again later.",
        ),
      metadata: modelMetadata,
    };
  }
}
