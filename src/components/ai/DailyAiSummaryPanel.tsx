"use client";

import { useState } from "react";

import {
  requestDailyAiSummary,
  type DailySummaryInput,
  isAiNetworkAvailable,
} from "@/lib/ai/client";
import type {
  AiCoachingResponse,
  AiCoachingSuccessResponse,
} from "@/lib/ai/contracts";

type DailyAiSummaryPanelProps =
  DailySummaryInput;

function isSuccess(
  response: AiCoachingResponse,
): response is AiCoachingSuccessResponse {
  return response.status === "success";
}

export default function DailyAiSummaryPanel(
  props: DailyAiSummaryPanelProps,
) {
  const [response, setResponse] =
    useState<AiCoachingResponse | null>(null);
  const [isLoading, setIsLoading] =
    useState(false);
  const [networkError, setNetworkError] =
    useState("");

  async function generateSummary() {
    setIsLoading(true);
    setNetworkError("");
    setResponse(null);

    if (!isAiNetworkAvailable()) {
      setNetworkError(
        "AI coaching is unavailable while you are offline. Your local HealthSprint tracking remains available.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const result =
        await requestDailyAiSummary(props);

      setResponse(result);
    } catch {
      setNetworkError(
        "AI coaching is temporarily unavailable. Your local HealthSprint tracking is still available.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className="panel ai-summary-panel"
      aria-labelledby="ai-daily-summary-title"
      aria-busy={isLoading}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            AI-generated wellness guidance
          </p>
          <h2 id="ai-daily-summary-title">
            Daily coaching summary
          </h2>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={generateSummary}
          disabled={isLoading}
        >
          {isLoading
            ? "Generating..."
            : "Generate AI summary"}
        </button>
      </div>

      <p className="panel-description">
        HealthSprint sends only today&apos;s
        aggregate nutrition, hydration, movement,
        and optional weight values when you
        explicitly request this summary.
      </p>

      {!response && !networkError && (
        <p className="ai-summary-placeholder">
          No AI summary has been generated for
          this view.
        </p>
      )}

      {networkError && (
        <div
          className="ai-summary-status"
          role="status"
        >
          <strong>AI unavailable</strong>
          <p>{networkError}</p>
        </div>
      )}

      {response && isSuccess(response) && (
        <div
          className="ai-summary-result"
          aria-live="polite"
        >
          <p className="ai-summary-label">
            AI-generated summary
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
                  : "AI unavailable"}
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
