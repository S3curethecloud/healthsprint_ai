const BRIDGE_VERSION = "1.0";
const RESPONSE_EVENT = "healthsprint:native-response";
const DEFAULT_TIMEOUT_MS = 15_000;
const INTERACTIVE_WRITE_TIMEOUT_MS = 120_000;
const INTERACTIVE_PERMISSION_TIMEOUT_MS = 120_000;

export type NativeAction =
  | "app.version"
  | "healthConnect.status"
  | "healthConnect.permissions"
  | "healthConnect.readSummary"
  | "healthConnect.writeWeight"
  | "healthConnect.writeExercise";

export type NativeErrorCode =
  | "INVALID_REQUEST"
  | "UNKNOWN_ACTION"
  | "PERMISSION_DENIED"
  | "PROVIDER_UPDATE_REQUIRED"
  | "HEALTH_CONNECT_UNAVAILABLE"
  | "INVALID_DATE_RANGE"
  | "READ_FAILED"
  | "INVALID_WEIGHT_PAYLOAD"
  | "INVALID_EXERCISE_PAYLOAD"
  | "WRITE_FAILED"
  | "BRIDGE_UNAVAILABLE"
  | "BRIDGE_TIMEOUT"
  | "INVALID_NATIVE_RESPONSE";

export interface AppVersionData {
  bridgeVersion: string;
  applicationVersion: string;
  buildType: string;
}

export interface HealthConnectStatusData {
  status:
    | "available"
    | "provider_update_required"
    | "unavailable"
    | string;
  available: boolean;
  providerPackage: string;
  permissionsGranted: boolean;
  readPermissionsGranted: boolean;
  writePermissionsGranted: boolean;
}

export interface HealthConnectPermissionsData {
  granted?: boolean;
  permissionScope?: "read" | "write";
  grantedPermissionCount?: number;
  requiredPermissionCount?: number;
  grantedPermissions?: string[];
}

export interface HealthConnectReadSummaryPayload {
  startTime: string;
  endTime: string;
}

export interface HealthConnectReadSummaryData {
  startTime: string;
  endTime: string;
  steps: number;
  activeCalories: number;
  totalCalories: number;
  exerciseSessionCount: number;
  exerciseDurationMinutes: number;
  latestWeight: {
    pounds: number;
    time: string;
  } | null;
}

export interface HealthConnectWriteWeightPayload {
  weightPounds: number;
  timestamp: string;
  clientRecordId: string;
  clientRecordVersion?: number;
}

export interface HealthConnectWriteExercisePayload {
  startTime: string;
  endTime: string;
  exerciseType: number;
  title: string;
  notes?: string;
  clientRecordId: string;
  clientRecordVersion?: number;
}

export interface HealthConnectWriteData {
  written: boolean;
  cancelled?: boolean;
  clientRecordId?: string;
  clientRecordVersion?: number;
  recordId?: string | null;
  writtenAt?: string;
}

interface NativeRequest {
  version: typeof BRIDGE_VERSION;
  requestId: string;
  action: NativeAction;
  payload: object;
}

interface NativeSuccessResponse<T> {
  version: string;
  requestId: string;
  status: "success";
  data: T;
}

interface NativeErrorResponse {
  version: string;
  requestId: string;
  status: "error";
  error: {
    code: string;
    message: string;
  };
}

type NativeResponse<T> =
  | NativeSuccessResponse<T>
  | NativeErrorResponse;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: NativeBridgeError) => void;
  timeoutId: number;
}

interface HealthSprintNativeInterface {
  postMessage(rawMessage: string): void;
}

declare global {
  interface Window {
    HealthSprintNative?: HealthSprintNativeInterface;
  }
}

export class NativeBridgeError extends Error {
  readonly code: NativeErrorCode | string;

  constructor(
    code: NativeErrorCode | string,
    message: string,
  ) {
    super(message);
    this.name = "NativeBridgeError";
    this.code = code;
  }
}

const pendingRequests = new Map<string, PendingRequest>();

let responseListenerInstalled = false;

function createRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
  ].join("-");
}

function isNativeResponse(
  value: unknown,
): value is NativeResponse<unknown> {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const response = value as Partial<NativeResponse<unknown>>;

  return (
    typeof response.version === "string" &&
    typeof response.requestId === "string" &&
    (
      response.status === "success" ||
      response.status === "error"
    )
  );
}

function handleNativeResponse(event: Event): void {
  if (!(event instanceof CustomEvent)) {
    return;
  }

  if (!isNativeResponse(event.detail)) {
    return;
  }

  const response = event.detail;
  const pending = pendingRequests.get(response.requestId);

  if (!pending) {
    return;
  }

  window.clearTimeout(pending.timeoutId);
  pendingRequests.delete(response.requestId);

  if (response.version !== BRIDGE_VERSION) {
    pending.reject(
      new NativeBridgeError(
        "INVALID_NATIVE_RESPONSE",
        `Unsupported native bridge version: ${response.version}`,
      ),
    );
    return;
  }

  if (response.status === "error") {
    pending.reject(
      new NativeBridgeError(
        response.error.code,
        response.error.message,
      ),
    );
    return;
  }

  pending.resolve(response.data);
}

function installResponseListener(): void {
  if (
    responseListenerInstalled ||
    typeof window === "undefined"
  ) {
    return;
  }

  window.addEventListener(
    RESPONSE_EVENT,
    handleNativeResponse,
  );

  responseListenerInstalled = true;
}

export function isHealthSprintNativeAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.HealthSprintNative?.postMessage ===
      "function"
  );
}

export function sendNativeRequest<T>(
  action: NativeAction,
  payload: object = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  if (!isHealthSprintNativeAvailable()) {
    return Promise.reject(
      new NativeBridgeError(
        "BRIDGE_UNAVAILABLE",
        "The HealthSprint Android native bridge is unavailable.",
      ),
    );
  }

  installResponseListener();

  const requestId = createRequestId();

  const request: NativeRequest = {
    version: BRIDGE_VERSION,
    requestId,
    action,
    payload,
  };

  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingRequests.delete(requestId);

      reject(
        new NativeBridgeError(
          "BRIDGE_TIMEOUT",
          `Native request timed out: ${action}`,
        ),
      );
    }, timeoutMs);

    pendingRequests.set(requestId, {
      resolve: (value) => resolve(value as T),
      reject,
      timeoutId,
    });

    try {
      window.HealthSprintNative?.postMessage(
        JSON.stringify(request),
      );
    } catch (error) {
      window.clearTimeout(timeoutId);
      pendingRequests.delete(requestId);

      reject(
        new NativeBridgeError(
          "BRIDGE_UNAVAILABLE",
          error instanceof Error
            ? error.message
            : "The native bridge request could not be sent.",
        ),
      );
    }
  });
}

export const healthSprintNative = {
  isAvailable: isHealthSprintNativeAvailable,

  appVersion(): Promise<AppVersionData> {
    return sendNativeRequest<AppVersionData>(
      "app.version",
    );
  },

  healthConnectStatus():
    Promise<HealthConnectStatusData> {
    return sendNativeRequest<HealthConnectStatusData>(
      "healthConnect.status",
    );
  },

  healthConnectPermissions():
    Promise<HealthConnectPermissionsData> {
    return sendNativeRequest<HealthConnectPermissionsData>(
      "healthConnect.permissions",
      {},
      INTERACTIVE_PERMISSION_TIMEOUT_MS,
    );
  },

  readHealthConnectSummary(
    payload: HealthConnectReadSummaryPayload,
  ): Promise<HealthConnectReadSummaryData> {
    return sendNativeRequest<HealthConnectReadSummaryData>(
      "healthConnect.readSummary",
      payload,
    );
  },

  writeHealthConnectWeight(
    payload: HealthConnectWriteWeightPayload,
  ): Promise<HealthConnectWriteData> {
    return sendNativeRequest<HealthConnectWriteData>(
      "healthConnect.writeWeight",
      payload,
      INTERACTIVE_WRITE_TIMEOUT_MS,
    );
  },

  writeHealthConnectExercise(
    payload: HealthConnectWriteExercisePayload,
  ): Promise<HealthConnectWriteData> {
    return sendNativeRequest<HealthConnectWriteData>(
      "healthConnect.writeExercise",
      payload,
      INTERACTIVE_WRITE_TIMEOUT_MS,
    );
  },
};
