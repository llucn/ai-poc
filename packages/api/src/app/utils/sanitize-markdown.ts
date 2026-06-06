/**
 * Basic Markdown content validation for backend.
 * Frontend should use a proper sanitization library like DOMPurify.
 *
 * This function checks for potentially dangerous patterns but does NOT
 * modify the content - it's stored as-is. Sanitization happens on render.
 */

const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=
  /<embed[^>]*>/gi,
  /<object[^>]*>/gi,
];

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
}

/**
 * Validate Markdown content for potentially dangerous patterns.
 * Returns warnings but does not reject the content.
 */
export function validateMarkdownContent(content: string | null): ValidationResult {
  if (!content) {
    return { isValid: true, warnings: [] };
  }

  const warnings: string[] = [];

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`Potentially dangerous pattern detected: ${pattern.source}`);
    }
  }

  // Always return isValid: true - we log warnings but don't block
  // The frontend sanitization layer will handle the actual cleaning
  return {
    isValid: true,
    warnings,
  };
}

/**
 * Sanitize basic HTML tags for plain text fields.
 * Use this for description fields, not for Markdown content.
 */
export function stripHtmlTags(text: string | null): string | null {
  if (!text) {
    return text;
  }

  return text.replace(/<[^>]*>/g, '');
}
