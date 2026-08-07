"use client";

import { useState } from "react";

import {
  requestMealAiGuidance,
  type MealGuidanceInput,
} from "@/lib/ai/client";
import type {
  AiCoachingResponse,
  AiCoachingSuccessResponse,
} from "@/lib/ai/contracts";

type MealAiGuidancePanelProps =
  MealGuidanceInput;

function isSuccess(
  response: AiCoachingResponse,
): response is AiCoachingSuccessResponse {
  return response.status === "success";
}

export default function MealAiGuidancePanel(
  props: MealAiGuidancePanelProps,
) {
  const [response, setResponse] =
    useState<AiCoachingResponse | null>(null);
  const [isLoading, setIsLoading] =
    useState(false);
  const [networkError, setNetworkError] =
    useState("");

  async function generateGuidance() {
    setIsLoading(true);
    setNetworkError("");
    setResponse(null);

    try {
      const result =
        await requestMealAiGuidance(props);

      setResponse(result);
    } catch {
      setNetworkError(
        "Meal guidance is temporarily unavailable. You can continue using your meal plan and nutrition tracking.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className="ai-meal-guidance"
      aria-labelledby="ai-meal-guidance-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            AI-generated wellness guidance
          </p>
          <h3 id="ai-meal-guidance-title">
            Meal-planning guidance
          </h3>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={generateGuidance}
          disabled={isLoading}
        >
          {isLoading
            ? "Generating..."
            : "Get meal guidance"}
        </button>
      </div>

      <p className="panel-description">
        Uses only your current aggregate calorie
        and macro totals to provide general
        meal-planning guidance.
      </p>

      {!response && !networkError && (
        <p className="ai-summary-placeholder">
          No meal guidance has been generated.
        </p>
      )}

      {networkError && (
        <div
          className="ai-summary-status"
          role="status"
        >
          <strong>
            Meal guidance unavailable
          </strong>
          <p>{networkError}</p>
        </div>
      )}

      {response && isSuccess(response) && (
        <div
          className="ai-summary-result"
          aria-live="polite"
        >
          <p className="ai-summary-label">
            AI-generated meal guidance
          </p>

          <h3>{response.summary}</h3>

          {response.observations.length > 0 && (
            <div>
              <strong>Observations</strong>
              <ul>
                {response.observations.map(
                  (observation) => (
                    <li key={observation}>
                      {observation}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {response.suggestedActions.length >
            0 && (
            <div>
              <strong>Suggested actions</strong>
              <ul>
                {response.suggestedActions.map(
                  (action) => (
                    <li key={action}>
                      {action}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <p className="ai-summary-safety">
            {response.safetyNotice}
          </p>
        </div>
      )}

      {response && !isSuccess(response) && (
        <div
          className="ai-summary-status"
          role="status"
        >
          <strong>
            {response.status === "redirected"
              ? "Request redirected"
              : response.status === "blocked"
                ? "Request blocked"
                : response.status === "invalid"
                  ? "Request could not be processed"
                  : "Meal guidance unavailable"}
          </strong>

          <p>{response.message}</p>

          <p className="ai-summary-safety">
            {response.safetyNotice}
          </p>
        </div>
      )}
    </section>
  );
}
