// Dev/test-only knob: force a safety-pipeline outcome through the mock services.
// Real providers (Hive, Rekognition, …) ignore this field entirely.
export type SimulateScenario =
  | "clean"
  | "review"
  | "explicit"
  | "violence"
  | "deepfake"
  | "not_ai";
