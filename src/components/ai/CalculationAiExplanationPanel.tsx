"use client";

import { useState } from "react";

import {
  requestCalculationAiExplanation,
  type CalculationExplanationInput,
} from "@/lib/ai/client";
import type {
  AiCoachingResponse,
  AiCoachingSuccessResponse,
} from "@/lib/ai/contracts";

type CalculationAiExplanationPanelProps =
  CalculationExplanationInput;

function isSuccess(
  response: AiCoachingResponse,
): response is AiCoachingSuccessResponse {
  return response.status === "success";
}

export default function CalculationAiExplanationPanel(
  props: CalculationAiExplanationPanelProps,
) {
  const [response, setResponse] =
    useState<AiCoachingResponse | null>(null);
  const [isLoading, setIsLoading] =
    useState(false);
  const [networkError, setNetworkError] =
    useState("");

  async function generateExplanation() {
    setIsLoading(true);
    setNetworkError("");
    setResponse(null);

    try {
      const result =
        await requestCalculationAiExplanation(
          props,
        );

      setResponse(result);
    } catch {
      setNetworkError(
        "Calculation explanation is temporarily unavailable. Your nutrition totals remain available.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className="ai-calculation-explanation"
      aria-labelledby="ai-calculation-explanation-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            AI-generated wellness guidance
          </p>
          <h3 id="ai-calculation-explanation-title">
            Calculation explanation
          </h3>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={generateExplanation}
          disabled={isLoading}
        >
          {isLoading
            ? "Generating..."
            : "Explain totals"}
        </button>
      </div>

      <p className="panel-description">
        Explains your current aggregate calorie
        and macro totals using the values already
        shown in your dashboard.
      </p>

      {!response && !networkError && (
        <p className="ai-summary-placeholder">
          No calculation explanation has been
          generated.
        </p>
      )}

      {networkError && (
        <div
          className="ai-summary-status"
          role="status"
        >
          <strong>
            Calculation explanation unavailable
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
            AI-generated calculation explanation
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
                  : "Calculation explanation unavailable"}
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
