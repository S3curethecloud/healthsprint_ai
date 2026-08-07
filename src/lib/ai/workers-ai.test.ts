import assert from "node:assert/strict";
import test from "node:test";

import {
  AI_CONTRACT_VERSION,
  type AiCoachingRequest,
} from "./contracts";
import {
  WORKERS_AI_MODEL,
} from "./structured-output";
import {
  runWorkersAiCoaching,
  type WorkersAiRun,
} from "./workers-ai";

function request(): AiCoachingRequest {
  return {
    version: AI_CONTRACT_VERSION,
    requestId: "workers-ai-test-001",
    intent: "hydration_guidance",
    question:
      "How can I improve my hydration today?",
    context: {
      hydrationOunces: 48,
      steps: 6_000,
    },
  };
}

function validModelOutput() {
  return {
    response: {
      summary:
        "Your hydration is progressing but remains below your target.",
      observations: [
        "You have logged 48 ounces of hydration.",
      ],
      suggestedActions: [
        "Drink another glass of water.",
      ],
      safetyNotice:
        "General wellness guidance only.",
    },
  };
}

test(
  "returns validated Workers AI coaching output",
  async () => {
    let calledModel: string | undefined;

    const run: WorkersAiRun =
      async (model) => {
        calledModel = model;
        return validModelOutput();
      };

    const result =
      await runWorkersAiCoaching(
        run,
        request(),
      );

    assert.equal(
      calledModel,
      WORKERS_AI_MODEL,
    );
    assert.equal(
      result.response.status,
      "success",
    );
    assert.equal(
      result.metadata.inferenceAttempted,
      true,
    );
    assert.equal(
      result.metadata.provider,
      "cloudflare-workers-ai",
    );
  },
);

test(
  "sends only minimized approved request data",
  async () => {
    let userContent = "";

    const run: WorkersAiRun =
      async (_model, input) => {
        userContent =
          input.messages[1]?.content ?? "";

        return validModelOutput();
      };

    await runWorkersAiCoaching(
      run,
      request(),
    );

    const payload =
      JSON.parse(userContent) as
        Record<string, unknown>;

    assert.equal(
      "requestId" in payload,
      false,
    );
    assert.equal(
      "version" in payload,
      false,
    );

    assert.equal(
      payload.intent,
      "hydration_guidance",
    );
    assert.equal(
      typeof payload.context,
      "object",
    );
  },
);

test(
  "rejects malformed model output",
  async () => {
    const run: WorkersAiRun =
      async () => ({
        response: {
          summary: "Incomplete output",
        },
      });

    const result =
      await runWorkersAiCoaching(
        run,
        request(),
      );

    assert.equal(
      result.response.status,
      "unavailable",
    );
    assert.equal(
      result.metadata.inferenceAttempted,
      true,
    );
  },
);

test(
  "fails closed when Workers AI throws",
  async () => {
    const run: WorkersAiRun =
      async () => {
        throw new Error(
          "simulated Workers AI failure",
        );
      };

    const result =
      await runWorkersAiCoaching(
        run,
        request(),
      );

    assert.equal(
      result.response.status,
      "unavailable",
    );
    assert.equal(
      result.metadata.inferenceAttempted,
      true,
    );
  },
);

test(
  "requests JSON schema output",
  async () => {
    let responseType = "";

    const run: WorkersAiRun =
      async (_model, input) => {
        responseType =
          input.response_format.type;

        return validModelOutput();
      };

    await runWorkersAiCoaching(
      run,
      request(),
    );

    assert.equal(
      responseType,
      "json_schema",
    );
  },
);
