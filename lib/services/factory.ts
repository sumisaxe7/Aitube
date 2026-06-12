// Selects a service implementation by env var, defaulting to "mock".
// Adding a real provider later is: register it in the impls map of that service's
// index.ts and flip the env var — callers (which import the exported instance)
// never change.
export function selectProvider<T>(
  envVar: string,
  impls: Record<string, () => T>,
): T {
  const key = process.env[envVar] ?? "mock";
  const make = impls[key];
  if (!make) {
    throw new Error(
      `Unknown provider "${key}" for ${envVar}. Available: ${Object.keys(impls).join(", ")}`,
    );
  }
  return make();
}
