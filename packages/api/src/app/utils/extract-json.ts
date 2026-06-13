/**
 * Extract a parseable JSON object from raw LLM output.
 *
 * The agent is instructed to reply with a single raw JSON object (see
 * system-prompt.ts), but LLMs occasionally wrap it in a Markdown code fence
 * (```json ... ```) or surround it with explanatory prose. Calling JSON.parse
 * on such output throws and, in the agent loop, that aborts the whole turn.
 *
 * This function strips those common contaminations BEFORE parsing. It is
 * conservative: for already-clean JSON it returns the input unchanged, and
 * when it cannot find an object it returns the (trimmed) input so the caller's
 * JSON.parse still surfaces a meaningful error.
 *
 * It does NOT attempt to repair malformed JSON (missing quotes, trailing
 * commas, truncation) — only to peel away wrappers around otherwise-valid JSON.
 */
export function extractJsonObject(raw: string): string {
  if (!raw) return raw;
  let s = raw.trim();

  // 1. If the whole thing is wrapped in a single fenced code block, unwrap it.
  //    Matches ```json\n...\n``` and ```\n...\n``` (language tag optional).
  const fence = /^```[ \t]*[a-zA-Z]*[ \t]*\r?\n?([\s\S]*?)\r?\n?```$/;
  const fenceMatch = fence.exec(s);
  if (fenceMatch) {
    s = fenceMatch[1].trim();
  }

  // 2. Extract the outermost {...} object by matching braces, skipping any
  //    braces that appear inside string literals. This also discards leading or
  //    trailing prose (e.g. "Here is the JSON: {...} Hope that helps!").
  const start = s.indexOf('{');
  if (start === -1) {
    // No object found — hand the trimmed text back so JSON.parse reports it.
    return s;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }

  // Unbalanced braces (e.g. truncated output): return from the first brace so
  // JSON.parse surfaces the error rather than silently dropping content.
  return s.slice(start);
}
