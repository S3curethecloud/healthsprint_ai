"use client";

import { useCallback, useEffect, useState } from "react";

import {
  healthSprintNative,
  NativeBridgeError,
  type HealthConnectStatusData,
} from "@/lib/native";

type PanelState =
  | { phase: "browser" }
  | { phase: "loading" }
  | {
      phase: "ready";
      status: HealthConnectStatusData;
    }
  | {
      phase: "error";
      message: string;
    };

function providerLabel(status: HealthConnectStatusData): string {
  if (status.available) {
    return "Available";
  }

  if (status.status === "provider_update_required") {
    return "Install or update required";
  }

  return "Unavailable";
}

export default function HealthConnectConnectionPanel() {
  const [panelState, setPanelState] =
    useState<PanelState>({ phase: "loading" });
  const [isRequestingPermissions, setIsRequestingPermissions] =
    useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadStatus = useCallback(async () => {
    setActionMessage("");

    if (!healthSprintNative.isAvailable()) {
      setPanelState({ phase: "browser" });
      return;
    }

    setPanelState({ phase: "loading" });

    try {
      const status =
        await healthSprintNative.healthConnectStatus();

      setPanelState({
        phase: "ready",
        status,
      });
    } catch (error) {
      setPanelState({
        phase: "error",
        message:
          error instanceof Error
            ? error.message
            : "Health Connect status could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStatus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadStatus]);

  async function requestReadPermissions() {
    setIsRequestingPermissions(true);
    setActionMessage("");

    try {
      const result =
        await healthSprintNative.healthConnectPermissions();

      setActionMessage(
        result.granted
          ? "Health Connect read access was granted."
          : "Health Connect read access was not fully granted.",
      );

      await loadStatus();
    } catch (error) {
      const message =
        error instanceof NativeBridgeError
          ? error.message
          : "Health Connect permissions could not be updated.";

      setActionMessage(message);
    } finally {
      setIsRequestingPermissions(false);
    }
  }

  if (panelState.phase === "browser") {
    return (
      <section
        className="health-connect-panel"
        aria-labelledby="health-connect-title"
      >
        <div className="health-connect-heading">
          <div>
            <p className="eyebrow">Android health integration</p>
            <h2 id="health-connect-title">Health Connect</h2>
          </div>

          <span className="health-connect-badge neutral">
            Browser mode
          </span>
        </div>

        <p className="health-connect-description">
          Health Connect is available through the HealthSprint Android
          application. Your browser-based dashboard continues to work
          without native health access.
        </p>
      </section>
    );
  }

  if (panelState.phase === "loading") {
    return (
      <section
        className="health-connect-panel"
        aria-labelledby="health-connect-title"
        aria-busy="true"
      >
        <div className="health-connect-heading">
          <div>
            <p className="eyebrow">Android health integration</p>
            <h2 id="health-connect-title">Health Connect</h2>
          </div>
        </div>

        <p className="health-connect-description">
          Checking Health Connect availability and permissions...
        </p>
      </section>
    );
  }

  if (panelState.phase === "error") {
    return (
      <section
        className="health-connect-panel"
        aria-labelledby="health-connect-title"
      >
        <div className="health-connect-heading">
          <div>
            <p className="eyebrow">Android health integration</p>
            <h2 id="health-connect-title">Health Connect</h2>
          </div>

          <span className="health-connect-badge warning">
            Status unavailable
          </span>
        </div>

        <p className="health-connect-message" role="alert">
          {panelState.message}
        </p>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadStatus()}
        >
          Try again
        </button>
      </section>
    );
  }

  const { status } = panelState;

  return (
    <section
      className="health-connect-panel"
      aria-labelledby="health-connect-title"
    >
      <div className="health-connect-heading">
        <div>
          <p className="eyebrow">Android health integration</p>
          <h2 id="health-connect-title">Health Connect</h2>
        </div>

        <span
          className={`health-connect-badge ${
            status.available ? "success" : "warning"
          }`}
        >
          {providerLabel(status)}
        </span>
      </div>

      <p className="health-connect-description">
        HealthSprint can read approved activity summaries. Weight and
        exercise writes remain separate and require confirmation when
        you choose to save them.
      </p>

      <div className="health-connect-status-grid">
        <article>
          <span>Provider</span>
          <strong>{providerLabel(status)}</strong>
          <small>{status.providerPackage}</small>
        </article>

        <article>
          <span>Read access</span>
          <strong>
            {status.readPermissionsGranted
              ? "Granted"
              : "Not granted"}
          </strong>
          <small>
            Steps, weight, exercise, and approved calorie totals
          </small>
        </article>

        <article>
          <span>Write access</span>
          <strong>
            {status.writePermissionsGranted
              ? "Granted"
              : "Requested when needed"}
          </strong>
          <small>
            Weight and exercise only, with native confirmation
          </small>
        </article>
      </div>

      <div className="health-connect-actions">
        {status.available && !status.readPermissionsGranted ? (
          <button
            type="button"
            className="primary-button"
            disabled={isRequestingPermissions}
            onClick={() => void requestReadPermissions()}
          >
            {isRequestingPermissions
              ? "Opening Health Connect..."
              : "Review read access"}
          </button>
        ) : null}

        <button
          type="button"
          className="secondary-button"
          disabled={isRequestingPermissions}
          onClick={() => void loadStatus()}
        >
          Refresh status
        </button>
      </div>

      {actionMessage ? (
        <p className="health-connect-message" role="status">
          {actionMessage}
        </p>
      ) : null}
    </section>
  );
}
