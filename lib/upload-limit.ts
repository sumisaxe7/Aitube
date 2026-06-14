export const DEFAULT_FILE_SIZE_LIMIT_MB = 200;
export const DEFAULT_FILE_SIZE_LIMIT_BYTES =
  DEFAULT_FILE_SIZE_LIMIT_MB * 1024 * 1024;

export function getFileSizeLimit(value?: string | null): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_FILE_SIZE_LIMIT_BYTES;
}
