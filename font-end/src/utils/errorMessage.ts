export function getErrorMessage(err: unknown, fallback: string): string {
  const raw = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (!raw) return fallback;

  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      // không phải JSON hợp lệ — fallthrough dùng raw
    }
  }
  return raw;
}
