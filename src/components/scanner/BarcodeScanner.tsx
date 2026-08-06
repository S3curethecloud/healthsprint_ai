"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { BrowserMultiFormatOneDReader } from "@zxing/browser";

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
}

type ScannerControls = {
  stop: () => void;
};

function normalizeBarcode(value: string) {
  return value.replace(/\D/g, "").trim();
}

function isLikelyRetailBarcode(value: string) {
  return [8, 12, 13, 14].includes(value.length);
}

export default function BarcodeScanner({
  onBarcodeDetected,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const readerRef =
    useRef<BrowserMultiFormatOneDReader | null>(null);
  const scanLockedRef = useRef(false);

  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState(
    "Start the camera or enter a barcode manually.",
  );
  const [error, setError] = useState("");

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    const stream = videoRef.current?.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    readerRef.current = null;
    scanLockedRef.current = false;
    setIsScanning(false);
  }, []);

  const processBarcode = useCallback(
    (rawValue: string) => {
      const barcode = normalizeBarcode(rawValue);

      if (!isLikelyRetailBarcode(barcode)) {
        setError(
          "The detected value does not look like a supported retail barcode.",
        );
        return false;
      }

      setError("");
      setManualBarcode(barcode);
      setStatus(`Barcode ${barcode} captured.`);
      onBarcodeDetected(barcode);

      return true;
    },
    [onBarcodeDetected],
  );

  const startScanner = useCallback(async () => {
    setError("");

    if (!window.isSecureContext) {
      setError(
        "Camera scanning requires HTTPS or localhost. Enter the barcode manually.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access is not available in this browser. Enter the barcode manually.",
      );
      return;
    }

    if (!videoRef.current) {
      setError("The camera preview is not available.");
      return;
    }

    stopScanner();

    try {
      const reader = new BrowserMultiFormatOneDReader();

      readerRef.current = reader;
      scanLockedRef.current = false;
      setIsScanning(true);
      setStatus(
        "Point the rear camera at the product barcode.",
      );

      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
        },
        videoRef.current,
        (result) => {
          if (!result || scanLockedRef.current) {
            return;
          }

          const captured = processBarcode(result.getText());

          if (captured) {
            scanLockedRef.current = true;

            window.setTimeout(() => {
              stopScanner();
            }, 0);
          }
        },
      );

      controlsRef.current = controls;
    } catch (scannerError) {
      stopScanner();

      if (
        scannerError instanceof DOMException &&
        scannerError.name === "NotAllowedError"
      ) {
        setError(
          "Camera permission was denied. Allow camera access or enter the barcode manually.",
        );
        return;
      }

      if (
        scannerError instanceof DOMException &&
        scannerError.name === "NotFoundError"
      ) {
        setError(
          "No usable camera was found. Enter the barcode manually.",
        );
        return;
      }

      setError(
        "The camera could not be started. Check browser permissions or enter the barcode manually.",
      );
    }
  }, [processBarcode, stopScanner]);

  function submitManualBarcode(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    processBarcode(manualBarcode);
  }

  useEffect(() => {
    const videoElement = videoRef.current;

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;

      const stream = videoElement?.srcObject;

      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
    };
  }, []);

  return (
    <section
      className="barcode-scanner"
      aria-labelledby="barcode-scanner-title"
    >
      <div className="barcode-scanner-heading">
        <div>
          <p className="eyebrow">Barcode capture</p>
          <h2 id="barcode-scanner-title">
            Scan packaged food
          </h2>
          <p className="panel-description">
            Scan a UPC or EAN barcode, or enter the number
            printed below the barcode.
          </p>
        </div>

        <span className="status-chip">Phase 4D</span>
      </div>

      <div className="barcode-scanner-grid">
        <div className="scanner-camera-panel">
          <div
            className={`scanner-viewfinder ${
              isScanning ? "scanning" : ""
            }`}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              aria-label="Barcode scanner camera preview"
            />

            {!isScanning && (
              <div className="scanner-placeholder">
                <span aria-hidden="true">▥</span>
                <strong>Camera inactive</strong>
                <small>
                  Camera video is processed locally by the
                  browser.
                </small>
              </div>
            )}

            {isScanning && (
              <div
                className="scanner-target"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={startScanner}
              disabled={isScanning}
            >
              Start camera
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={stopScanner}
              disabled={!isScanning}
            >
              Stop camera
            </button>
          </div>

        </div>

        <form
          className="scanner-manual-panel"
          onSubmit={submitManualBarcode}
        >
          <label className="form-field">
            Barcode number
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]*"
              minLength={8}
              maxLength={14}
              value={manualBarcode}
              placeholder="Example: 012345678905"
              onChange={(event) =>
                setManualBarcode(
                  normalizeBarcode(event.target.value),
                )
              }
            />
          </label>

          <button
            type="submit"
            className="secondary-button"
          >
            Use barcode
          </button>

          <p
            className="scanner-status"
            role="status"
            aria-live="polite"
          >
            {status}
          </p>

          {error && (
            <p className="scanner-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
