import assert from "node:assert/strict";
import test from "node:test";

import {
  requestDailyAiSummary,
  type DailySummaryInput,
} from "./client";
import type {
  AiCoachingResponse,
} from "./contracts";

const input: DailySummaryInput = {
  calorieTarget: 2100,
  caloriesConsumed: 1450,
  proteinGrams: 120,
  carbohydrateGrams: 155,
  fatGrams: 48,
  hydrationOunces: 64,
  steps: 7200,
  latestWeightPounds: 245,
};

test(
  "sends only approved aggregate daily summary data",
  async () => {
    const originalFetch = globalThis.fetch;

    let capturedBody = "";

    globalThis.fetch = async (
      _input,
      init,
    ) => {
      capturedBody = String(init?.body ?? "");

      const response: AiCoachingResponse = {
        version: "1.0",
        requestId: "response-request-id",
        status: "success",
        classification: "wellness_allowed",
        policyDecision: "allow",
        summary: "Daily summary",
        observations: [],
        suggestedActions: [],
        safetyNotice: "General wellness guidance.",
        modelMetadata: {
          provider: "cloudflare-workers-ai",
          model: "test-model",
          inferenceAttempted: true,
        },
      };

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    };

    try {
      await requestDailyAiSummary(input);

      const body = JSON.parse(
        capturedBody,
      ) as Record<string, unknown>;

      assert.equal(
        body.version,
        "1.0",
      );
      assert.equal(
        body.intent,
        "daily_summary",
      );
      assert.equal(
        typeof body.requestId,
        "string",
      );

      assert.deepEqual(
        body.context,
        {
          calorieTarget: 2100,
          caloriesConsumed: 1450,
          proteinGrams: 120,
          carbohydrateGrams: 155,
          fatGrams: 48,
          hydrationOunces: 64,
          steps: 7200,
          latestWeightPounds: 245,
        },
      );

      assert.equal(
        "question" in body,
        false,
      );
      assert.equal(
        "healthConnectRecords" in body,
        false,
      );
      assert.equal(
        "prompt" in body,
        false,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
);

test(
  "returns controlled unavailable responses",
  async () => {
    const originalFetch = globalThis.fetch;

    const controlledResponse:
      AiCoachingResponse = {
        version: "1.0",
        requestId: "test-request",
        status: "unavailable",
        classification: "wellness_allowed",
        policyDecision: "allow",
        message:
          "AI coaching is temporarily unavailable.",
        safetyNotice:
          "General wellness guidance only.",
      };

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify(controlledResponse),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

    try {
      const result =
        await requestDailyAiSummary(input);

      assert.deepEqual(
        result,
        controlledResponse,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
);

test(
  "propagates network failures to the UI fallback",
  async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      throw new Error("network unavailable");
    };

    try {
      await assert.rejects(
        () =>
          requestDailyAiSummary(input),
        /network unavailable/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
);

test(
  "sends only approved aggregate meal guidance data",
  async () => {
    const originalFetch = globalThis.fetch;

    let capturedBody = "";

    globalThis.fetch = async (
      _input,
      init,
    ) => {
      capturedBody = String(init?.body ?? "");

      const response: AiCoachingResponse = {
        version: "1.0",
        requestId: "meal-response-request-id",
        status: "success",
        classification: "wellness_allowed",
        policyDecision: "allow",
        summary: "Meal guidance",
        observations: [],
        suggestedActions: [],
        safetyNotice: "General wellness guidance.",
        modelMetadata: {
          provider: "cloudflare-workers-ai",
          model: "test-model",
          inferenceAttempted: true,
        },
      };

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    };

    try {
      const { requestMealAiGuidance } =
        await import("./client");

      await requestMealAiGuidance({
        calorieTarget: 2100,
        caloriesConsumed: 1450,
        proteinGrams: 120,
        carbohydrateGrams: 155,
        fatGrams: 48,
      });

      const body = JSON.parse(
        capturedBody,
      ) as Record<string, unknown>;

      assert.equal(
        body.intent,
        "meal_guidance",
      );

      assert.deepEqual(
        body.context,
        {
          calorieTarget: 2100,
          caloriesConsumed: 1450,
          proteinGrams: 120,
          carbohydrateGrams: 155,
          fatGrams: 48,
        },
      );

      assert.equal(
        "question" in body,
        false,
      );
      assert.equal(
        "healthConnectRecords" in body,
        false,
      );
      assert.equal(
        "prompt" in body,
        false,
      );

      const context =
        body.context as Record<string, unknown>;

      assert.equal(
        "hydrationOunces" in context,
        false,
      );
      assert.equal(
        "steps" in context,
        false,
      );
      assert.equal(
        "latestWeightPounds" in context,
        false,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
);
