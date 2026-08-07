import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { evaluateAiApiRequest } from "@/lib/ai/api";
import {
  runWorkersAiCoaching,
  type WorkersAiRun,
} from "@/lib/ai/workers-ai";
import {
  createAiEvidence,
  emitAiEvidence,
} from "@/lib/ai/evidence-runtime";
import {
  AI_INTENTS,
  type AiCoachingRequest,
  type AiPolicyDecision,
} from "@/lib/ai/contracts";

const ENDPOINT = "/api/ai/coaching";

function extractIntent(
  input: unknown,
): AiCoachingRequest["intent"] | undefined {
  if (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    "intent" in input &&
    typeof input.intent === "string" &&
    AI_INTENTS.includes(
      input.intent as AiCoachingRequest["intent"],
    )
  ) {
    return input.intent as AiCoachingRequest["intent"];
  }

  return undefined;
}

function policyDecisionFromResponse(
  response: ReturnType<
    typeof evaluateAiApiRequest
  >["response"],
): AiPolicyDecision {
  return response.policyDecision;
}

export async function POST(request: Request) {
  const startedAt = performance.now();

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    input = null;
  }

  const policyResult =
    evaluateAiApiRequest(input);

  let result = policyResult;

  if (
    policyResult.inferenceAllowed &&
    policyResult.response.classification ===
      "wellness_allowed"
  ) {
    const evaluation =
      policyResult.response.requestId !==
        "invalid-request" &&
      typeof input === "object" &&
      input !== null
        ? input
        : null;

    if (
      evaluation &&
      "version" in evaluation &&
      "requestId" in evaluation &&
      "intent" in evaluation &&
      "context" in evaluation
    ) {
      const { env } =
        getCloudflareContext();

      const run: WorkersAiRun =
        async (model, runInput) =>
          env.AI.run(
            model,
            runInput,
          );

      const inference =
        await runWorkersAiCoaching(
          run,
          evaluation as import("@/lib/ai/contracts").AiCoachingRequest,
        );

      result = {
        ...policyResult,
        httpStatus:
          inference.response.status ===
          "success"
            ? 200
            : 503,
        response: inference.response,
        inferenceAttempted: true,
      };
    }
  }

  const evidence =
    createAiEvidence({
      requestId: result.response.requestId,
      endpoint: ENDPOINT,
      intent: extractIntent(input),
      classification:
        result.evidenceClassification,
      policyDecision:
        policyDecisionFromResponse(
          result.response,
        ),
      promptInjectionDetected:
        result.promptInjectionDetected,
      inferenceAttempted:
        result.inferenceAttempted,
      latencyMs:
        Math.max(
          0,
          Math.round(
            performance.now() - startedAt,
          ),
        ),
      responseStatus:
        result.response.status,
    });

  emitAiEvidence(evidence);

  return NextResponse.json(
    result.response,
    {
      status: result.httpStatus,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
