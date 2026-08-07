"use client";

import { useState } from "react";

import {
  requestActivityAiGuidance,
  type ActivityGuidanceInput,
  isAiNetworkAvailable,
} from "@/lib/ai/client";
import type {
  AiCoachingResponse,
  AiCoachingSuccessResponse,
} from "@/lib/ai/contracts";

type ActivityAiGuidancePanelProps =
  ActivityGuidanceInput;

function isSuccess(
  response: AiCoachingResponse,
): response is AiCoachingSuccessResponse {
  return response.status === "success";
}

export default function ActivityAiGuidancePanel(
  props: ActivityAiGuidancePanelProps,
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

    if (!isAiNetworkAvailable()) {
      setNetworkError(
        "AI coaching is unavailable while you are offline. Your local HealthSprint tracking remains available.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const result =
        await requestActivityAiGuidance(props);

      setResponse(result);
    } catch {
      setNetworkError(
        "Activity guidance is temporarily unavailable. You can continue tracking your movement and steps.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className="ai-activity-guidance"
      aria-labelledby="ai-activity-guidance-title"
      aria-busy={isLoading}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            AI-generated wellness guidance
          </p>
          <h3 id="ai-activity-guidance-title">
            Activity summary
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
            : "Get activity summary"}
        </button>
      </div>

      <p className="panel-description">
        Uses only your current aggregate step
        count and activity minutes when available.
      </p>

      {!response && !networkError && (
        <p className="ai-summary-placeholder">
          No activity summary has been generated.
        </p>
      )}

      {networkError && (
        <div
          className="ai-summary-status"
          role="status"
        >
          <strong>
            Activity guidance unavailable
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
            AI-generated activity summary
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
                  : "Activity guidance unavailable"}
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
