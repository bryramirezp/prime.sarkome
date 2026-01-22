/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Validate API key format (basic check for Gemini API keys)
 */
export const validateApiKey = (key: string): boolean => {
  if (!key) return false;
  
  // Gemini API keys typically start with "AIza" and are 39 characters long
  const apiKeyPattern = /^AIza[0-9A-Za-z_-]{35}$/;
  
  return apiKeyPattern.test(key);
};

/**
 * Sanitize and validate user prompt before sending to LLM
 * Returns the sanitized prompt or null if invalid
 */
export const sanitizePrompt = (prompt: string, maxLength: number = 10000): string | null => {
  if (!prompt || typeof prompt !== 'string') return null;
  
  // Trim and check length
  const trimmed = prompt.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) return trimmed.substring(0, maxLength);
  
  // Remove control characters except newlines and tabs
  const cleaned = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return cleaned;
};

/**
 * Check if running on HTTPS (except localhost)
 */
export const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '[::1]';
  
  return window.location.protocol === 'https:' || isLocalhost;
};

/**
 * Warn user if not using HTTPS
 */
export const checkSecureConnection = (): void => {
  if (!isSecureContext() && typeof window !== 'undefined') {
    console.warn('⚠️ WARNING: You are not using a secure HTTPS connection. Your API key could be intercepted.');
  }
};

/**
 * Validate URL to prevent SSRF attacks
 */
export const isValidUrl = (url: string, allowedDomains?: string[]): boolean => {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Check against allowed domains if provided
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      );
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Rate limiting helper - tracks API calls
 */
class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private timeWindow: number;

  constructor(maxCalls: number = 60, timeWindowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }

  canMakeCall(): boolean {
    const now = Date.now();
    
    // Remove calls outside the time window
    this.calls = this.calls.filter(time => now - time < this.timeWindow);
    
    // Check if we're under the limit
    if (this.calls.length < this.maxCalls) {
      this.calls.push(now);
      return true;
    }
    
    return false;
  }

  getRemainingCalls(): number {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxCalls - this.calls.length);
  }

  getResetTime(): number {
    if (this.calls.length === 0) return 0;
    const oldestCall = Math.min(...this.calls);
    return Math.max(0, this.timeWindow - (Date.now() - oldestCall));
  }
}

export const apiRateLimiter = new RateLimiter(60, 60000); // 60 calls per minute
