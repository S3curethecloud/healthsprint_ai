# HealthSprint AI Android Wrapper

## Phase

Phase 5B — Android wrapper foundation.

## Current capabilities

- Loads the HealthSprint AI web application
- Supports production and emulator development URLs
- Supports camera permission for barcode scanning
- Preserves navigation and WebView state
- Displays loading and network-error states
- Exposes a constrained native bridge
- Supports `app.version`
- Rejects unknown native bridge actions

## Explicitly excluded

- Health Connect permissions
- Health Connect reads
- Health Connect writes
- background synchronization
- Cloudflare AI
- health-data upload

## Debug URL

The debug build loads:

```text
http://10.0.2.2:3000

Run the Next.js application on the host before launching the emulator.

Release URL

The release build loads:

https://healthsprint-ai.theolagold.workers.dev

