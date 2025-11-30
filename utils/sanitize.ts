import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Raw user input string
 * @returns Sanitized string safe for storage and display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Configure DOMPurify to strip all HTML tags
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  });
  
  return clean.trim();
}

/**
 * Sanitize user input but allow basic formatting (for future use)
 * @param input - Raw user input string
 * @returns Sanitized string with safe HTML
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Allow only safe HTML tags for basic formatting
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: []
  });
  
  return clean.trim();
}
