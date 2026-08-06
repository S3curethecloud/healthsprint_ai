"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  healthSprintNative,
  NativeBridgeError,
  type HealthConnectWriteData,
} from "@/lib/native";

const MIN_WEIGHT_POUNDS = 25;
const MAX_WEIGHT_POUNDS = 1500;
const MAX_EXERCISE_DURATION_MS =
  24 * 60 * 60 * 1000;

const exerciseTypes = [
  { value: 0, label: "Other workout" },
  { value: 79, label: "Walking" },
  { value: 56, label: "Running" },
  { value: 57, label: "Treadmill running" },
  { value: 8, label: "Biking" },
  { value: 9, label: "Stationary biking" },
  { value: 37, label: "Hiking" },
  { value: 70, label: "Strength training" },
  { value: 81, label: "Weightlifting" },
  { value: 36, label: "High-intensity interval training" },
  { value: 83, label: "Yoga" },
  { value: 48, label: "Pilates" },
  { value: 74, label: "Pool swimming" },
  { value: 73, label: "Open-water swimming" },
  { value: 53, label: "Rowing" },
  { value: 54, label: "Rowing machine" },
  { value: 25, label: "Elliptical" },
  { value: 68, label: "Stair climbing" },
  { value: 69, label: "Stair-climbing machine" },
  { value: 16, label: "Dancing" },
  { value: 71, label: "Stretching" },
] as const;

function toLocalDateTimeInput(
  date: Date,
): string {
  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function createClientRecordId(
  recordType: "weight" | "exercise",
  values: Array<string | number>,
): string {
  const normalized = values
    .map((value) => String(value).trim().toLowerCase())
    .join("|");

  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return [
    "healthsprint",
    recordType,
    (hash >>> 0).toString(16).padStart(8, "0"),
  ].join("-");
}

function resultMessage(
  recordLabel: string,
  result: HealthConnectWriteData,
): string {
  if (result.cancelled || !result.written) {
    return `${recordLabel} was not written. Native confirmation was cancelled.`;
  }

  return `${recordLabel} was written to Health Connect.`;
}

function errorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof NativeBridgeError
    ? error.message
    : fallback;
}

export default function HealthConnectWritePanel() {
  const now = useMemo(() => new Date(), []);

  const [weightPounds, setWeightPounds] =
    useState("245");
  const [weightTime, setWeightTime] =
    useState(toLocalDateTimeInput(now));
  const [isWritingWeight, setIsWritingWeight] =
    useState(false);
  const [weightMessage, setWeightMessage] =
    useState("");

  const [exerciseType, setExerciseType] =
    useState(79);
  const [exerciseTitle, setExerciseTitle] =
    useState("HealthSprint workout");
  const [exerciseNotes, setExerciseNotes] =
    useState("");
  const [exerciseStartTime, setExerciseStartTime] =
    useState(
      toLocalDateTimeInput(
        new Date(now.getTime() - 30 * 60_000),
      ),
    );
  const [exerciseEndTime, setExerciseEndTime] =
    useState(toLocalDateTimeInput(now));
  const [isWritingExercise, setIsWritingExercise] =
    useState(false);
  const [exerciseMessage, setExerciseMessage] =
    useState("");

  async function submitWeight(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setWeightMessage("");

    if (!healthSprintNative.isAvailable()) {
      setWeightMessage(
        "Health Connect writes are available in the HealthSprint Android application.",
      );
      return;
    }

    const numericWeight = Number(weightPounds);
    const timestamp = new Date(weightTime);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight < MIN_WEIGHT_POUNDS ||
      numericWeight > MAX_WEIGHT_POUNDS ||
      Number.isNaN(timestamp.getTime())
    ) {
      setWeightMessage(
        `Enter a valid weight from ${MIN_WEIGHT_POUNDS} to ${MAX_WEIGHT_POUNDS} pounds and a valid time.`,
      );
      return;
    }

    const timestampIso = timestamp.toISOString();

    setIsWritingWeight(true);

    try {
      const result =
        await healthSprintNative.writeHealthConnectWeight({
          weightPounds: numericWeight,
          timestamp: timestampIso,
          clientRecordId: createClientRecordId(
            "weight",
            [
              timestampIso,
              numericWeight.toFixed(1),
            ],
          ),
          clientRecordVersion: 1,
        });

      setWeightMessage(
        resultMessage("Weight record", result),
      );
    } catch (error) {
      setWeightMessage(
        errorMessage(
          error,
          "The weight record could not be written.",
        ),
      );
    } finally {
      setIsWritingWeight(false);
    }
  }

  async function submitExercise(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setExerciseMessage("");

    if (!healthSprintNative.isAvailable()) {
      setExerciseMessage(
        "Health Connect writes are available in the HealthSprint Android application.",
      );
      return;
    }

    const startTime = new Date(exerciseStartTime);
    const endTime = new Date(exerciseEndTime);
    const duration =
      endTime.getTime() - startTime.getTime();
    const title = exerciseTitle.trim();
    const notes = exerciseNotes.trim();

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      duration <= 0 ||
      duration > MAX_EXERCISE_DURATION_MS
    ) {
      setExerciseMessage(
        "Exercise must have valid start and end times and last no longer than 24 hours.",
      );
      return;
    }

    if (!title || title.length > 100) {
      setExerciseMessage(
        "Exercise title must contain 1 to 100 characters.",
      );
      return;
    }

    if (notes.length > 500) {
      setExerciseMessage(
        "Exercise notes cannot exceed 500 characters.",
      );
      return;
    }

    const startTimeIso = startTime.toISOString();
    const endTimeIso = endTime.toISOString();

    setIsWritingExercise(true);

    try {
      const result =
        await healthSprintNative.writeHealthConnectExercise({
          startTime: startTimeIso,
          endTime: endTimeIso,
          exerciseType,
          title,
          notes: notes || undefined,
          clientRecordId: createClientRecordId(
            "exercise",
            [
              startTimeIso,
              endTimeIso,
              exerciseType,
              title,
            ],
          ),
          clientRecordVersion: 1,
        });

      setExerciseMessage(
        resultMessage("Exercise session", result),
      );
    } catch (error) {
      setExerciseMessage(
        errorMessage(
          error,
          "The exercise session could not be written.",
        ),
      );
    } finally {
      setIsWritingExercise(false);
    }
  }

  return (
    <section
      className="health-connect-write-panel"
      aria-labelledby="health-connect-write-title"
    >
      <div className="health-connect-write-heading">
        <div>
          <p className="eyebrow">
            Controlled native writes
          </p>

          <h2 id="health-connect-write-title">
            Save to Health Connect
          </h2>

          <p>
            HealthSprint can write weight and exercise records
            only. Android will show a separate confirmation
            before each write.
          </p>
        </div>

        <span className="health-connect-badge warning">
          Confirmation required
        </span>
      </div>

      <div className="health-connect-write-grid">
        <form
          className="health-connect-write-card"
          onSubmit={submitWeight}
        >
          <div>
            <p className="eyebrow">Body measurement</p>
            <h3>Write weight</h3>
            <p>
              Creates one manual Health Connect weight record.
            </p>
          </div>

          <label className="form-field">
            Weight in pounds
            <input
              required
              type="number"
              min={MIN_WEIGHT_POUNDS}
              max={MAX_WEIGHT_POUNDS}
              step="0.1"
              value={weightPounds}
              disabled={isWritingWeight}
              onChange={(event) =>
                setWeightPounds(event.target.value)
              }
            />
          </label>

          <label className="form-field">
            Measurement time
            <input
              required
              type="datetime-local"
              value={weightTime}
              disabled={isWritingWeight}
              onChange={(event) =>
                setWeightTime(event.target.value)
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isWritingWeight}
          >
            {isWritingWeight
              ? "Waiting for confirmation..."
              : "Review weight write"}
          </button>

          {weightMessage ? (
            <p
              className="health-connect-message"
              role="status"
              aria-live="polite"
            >
              {weightMessage}
            </p>
          ) : null}
        </form>

        <form
          className="health-connect-write-card"
          onSubmit={submitExercise}
        >
          <div>
            <p className="eyebrow">Workout record</p>
            <h3>Write exercise</h3>
            <p>
              Creates one manual Health Connect exercise session.
            </p>
          </div>

          <label className="form-field">
            Exercise type
            <select
              value={exerciseType}
              disabled={isWritingExercise}
              onChange={(event) =>
                setExerciseType(
                  Number(event.target.value),
                )
              }
            >
              {exerciseTypes.map((exercise) => (
                <option
                  key={exercise.value}
                  value={exercise.value}
                >
                  {exercise.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Title
            <input
              required
              type="text"
              maxLength={100}
              value={exerciseTitle}
              disabled={isWritingExercise}
              onChange={(event) =>
                setExerciseTitle(event.target.value)
              }
            />
          </label>

          <div className="health-connect-time-grid">
            <label className="form-field">
              Start time
              <input
                required
                type="datetime-local"
                value={exerciseStartTime}
                disabled={isWritingExercise}
                onChange={(event) =>
                  setExerciseStartTime(
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-field">
              End time
              <input
                required
                type="datetime-local"
                value={exerciseEndTime}
                disabled={isWritingExercise}
                onChange={(event) =>
                  setExerciseEndTime(
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <label className="form-field">
            Notes
            <textarea
              maxLength={500}
              rows={4}
              value={exerciseNotes}
              disabled={isWritingExercise}
              onChange={(event) =>
                setExerciseNotes(event.target.value)
              }
              placeholder="Optional workout notes"
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isWritingExercise}
          >
            {isWritingExercise
              ? "Waiting for confirmation..."
              : "Review exercise write"}
          </button>

          {exerciseMessage ? (
            <p
              className="health-connect-message"
              role="status"
              aria-live="polite"
            >
              {exerciseMessage}
            </p>
          ) : null}
        </form>
      </div>

      <p className="health-connect-write-guardrail">
        Selecting a review button does not immediately write
        data. The native Android confirmation dialog remains the
        final authorization step.
      </p>
    </section>
  );
}
