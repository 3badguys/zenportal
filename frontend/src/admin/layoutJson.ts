// Pure JSON validation helpers — no React state, unit-testable

export interface ParseResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  errorLine?: number | null;
}

/**
 * Parse layout JSON and return structured result.
 * - valid JSON array → ok
 * - valid JSON but not array → error 'blocks must be a JSON array'
 * - invalid JSON → error message + best-effort line number
 */
export function parseLayoutJson(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    const match = e.message?.match(/position\s+(\d+)/);
    if (match) {
      const pos = parseInt(match[1], 10);
      const lineNum = raw.substring(0, pos).split('\n').length;
      return { ok: false, error: `Line ${lineNum}: ${e.message.split('\n')[0]}`, errorLine: lineNum };
    }
    return { ok: false, error: e.message || 'Invalid JSON', errorLine: null };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'blocks must be a JSON array', errorLine: null };
  }
  return { ok: true, data: parsed, errorLine: null };
}
