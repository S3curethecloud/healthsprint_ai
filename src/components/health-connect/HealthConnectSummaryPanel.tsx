"use client";

import { useState } from "react";

import {
  healthSprintNative,
  NativeBridgeError,
  type HealthConnectReadSummaryData,
} from "@/lib/native";

const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 45;

function createRange(days: number) {
  const endTime = new Date();
  const startTime = new Date(endTime);

  startTime.setUTCDate(
    startTime.getUTCDate() - days,
  );

  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(
    Math.round(value),
  );
}

function formatWeight(
  summary: HealthConnectReadSummaryData,
): string {
  if (!summary.latestWeight) {
    return "No weight found";
  }

  return `${summary.latestWeight.pounds.toFixed(1)} lb`;
}

function formatWeightTime(
  summary: HealthConnectReadSummaryData,
): string {
  if (!summary.latestWeight) {
    return "No approved weight record in this range";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(
    new Date(summary.latestWeight.time),
  );
}

export default function HealthConnectSummaryPanel() {
  const [rangeDays, setRangeDays] =
    useState(DEFAULT_RANGE_DAYS);
  const [summary, setSummary] =
    useState<HealthConnectReadSummaryData | null>(
      null,
    );
  const [isLoading, setIsLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");

  async function loadSummary() {
    setMessage("");

    if (!healthSprintNative.isAvailable()) {
      setSummary(null);
      setMessage(
        "Health Connect summaries are available in the HealthSprint Android application.",
      );
      return;
    }

    const boundedRange = Math.min(
      MAX_RANGE_DAYS,
      Math.max(1, rangeDays),
    );

    setRangeDays(boundedRange);
    setIsLoading(true);

    try {
      const result =
        await healthSprintNative.readHealthConnectSummary(
          createRange(boundedRange),
        );

      setSummary(result);
      setMessage(
        `Loaded the most recent ${boundedRange} days from Health Connect.`,
      );
    } catch (error) {
      setSummary(null);

      setMessage(
        error instanceof NativeBridgeError
          ? error.message
          : "Health Connect summary data could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className="health-connect-summary-panel"
      aria-labelledby="health-connect-summary-title"
    >
      <div className="health-connect-summary-heading">
        <div>
          <p className="eyebrow">
            Read-only native summary
          </p>

          <h2 id="health-connect-summary-title">
            Health Connect activity
          </h2>

          <p>
            Load approved aggregate health data without
            replacing your locally entered daily metrics.
          </p>
        </div>

        <label className="compact-field health-connect-range-field">
          Recent days
          <input
            type="number"
            min="1"
            max={MAX_RANGE_DAYS}
            value={rangeDays}
            disabled={isLoading}
            onChange={(event) =>
              setRangeDays(
                Math.min(
                  MAX_RANGE_DAYS,
                  Math.max(
                    1,
                    Number(event.target.value) ||
                      DEFAULT_RANGE_DAYS,
                  ),
                ),
              )
            }
          />
        </label>
      </div>

      <div className="health-connect-summary-actions">
        <button
          type="button"
          className="primary-button"
          disabled={isLoading}
          onClick={() => void loadSummary()}
        >
          {isLoading
            ? "Loading summary..."
            : "Load Health Connect summary"}
        </button>

        <small>
          Maximum range: {MAX_RANGE_DAYS} days
        </small>
      </div>

      {summary ? (
        <>
          <div className="health-connect-summary-grid">
            <article>
              <span>Steps</span>
              <strong>
                {formatNumber(summary.steps)}
              </strong>
              <small>
                Aggregate steps in selected range
              </small>
            </article>

            <article>
              <span>Active calories</span>
              <strong>
                {formatNumber(
                  summary.activeCalories,
                )}{" "}
                kcal
              </strong>
              <small>
                Activity-related energy
              </small>
            </article>

            <article>
              <span>Total calories</span>
              <strong>
                {formatNumber(
                  summary.totalCalories,
                )}{" "}
                kcal
              </strong>
              <small>
                Total approved energy records
              </small>
            </article>

            <article>
              <span>Exercise sessions</span>
              <strong>
                {formatNumber(
                  summary.exerciseSessionCount,
                )}
              </strong>
              <small>
                {formatNumber(
                  summary.exerciseDurationMinutes,
                )}{" "}
                total minutes
              </small>
            </article>

            <article>
              <span>Latest weight</span>
              <strong>
                {formatWeight(summary)}
              </strong>
              <small>
                {formatWeightTime(summary)}
              </small>
            </article>
          </div>

          <p className="health-connect-summary-range">
            Native range:{" "}
            {new Date(
              summary.startTime,
            ).toLocaleDateString()}{" "}
            through{" "}
            {new Date(
              summary.endTime,
            ).toLocaleDateString()}
          </p>
        </>
      ) : (
        <div className="health-connect-summary-empty">
          <strong>No native summary loaded</strong>
          <p>
            Select a range and load data when you are ready.
            Nothing is read automatically.
          </p>
        </div>
      )}

      {message ? (
        <p
          className="health-connect-message"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
