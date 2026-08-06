# Android Bridge Contract

## Version

`1.0`

## Transport

The Android wrapper and embedded HealthSprint web application communicate through an explicitly registered native bridge.

The bridge must not expose arbitrary Kotlin or Java methods.

## Request envelope

```json
{
  "version": "1.0",
  "requestId": "uuid",
  "action": "healthConnect.status",
  "payload": {}
}
Response envelope
{
  "version": "1.0",
  "requestId": "uuid",
  "status": "success",
  "data": {}
}

Error response:

{
  "version": "1.0",
  "requestId": "uuid",
  "status": "error",
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Health Connect permission was not granted."
  }
}
Approved actions
healthConnect.status

Returns:

device support
SDK availability
provider availability
current permission state
healthConnect.permissions

Launches the native permission flow for the explicitly approved record types.

It must require a visible user action.

healthConnect.readSummary

Returns aggregate values for an explicit date range.

Maximum initial date range: 45 days.

Approved fields:

steps
activeCalories
totalCalories
weight
exerciseDuration
healthConnect.writeWeight

Writes one user-confirmed weight record.

Required payload:

weightPounds
timestamp
clientRecordId
healthConnect.writeExercise

Writes one user-confirmed exercise session.

Required payload:

title
exerciseType
startTime
endTime
clientRecordId
app.version

Returns Android wrapper and web application version metadata.

app.openSettings

Opens the relevant Android or Health Connect settings screen.

Validation requirements
Unknown actions are rejected.
Unknown fields are ignored or rejected according to schema.
Payload size is bounded.
Date ranges are bounded.
Numbers must be finite.
Timestamps must be ISO 8601.
Every write requires recent user interaction.
Duplicate clientRecordId values must be idempotent.
Bridge messages must not execute JavaScript supplied by payload fields.
