/**
 * Rate Limiter for API requests
 * Ensures we don't exceed Europe PMC's recommended rate limits
 * @module utils/rateLimiter
 */

/**
 * Queue-based rate limiter with configurable interval
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastRequest = 0;
  private minInterval: number;

  /**
   * Create a new rate limiter
   * @param requestsPerSecond - Maximum requests per second (default: 3)
   */
  constructor(requestsPerSecond: number = 3) {
    this.minInterval = 1000 / requestsPerSecond; // ~333ms for 3 req/sec
  }

  /**
   * Acquire permission to make a request
   * Returns a promise that resolves when it's safe to proceed
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.process();
    });
  }

  /**
   * Process the queue with rate limiting
   */
  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequest;
      
      if (elapsed < this.minInterval) {
        await new Promise((r) => setTimeout(r, this.minInterval - elapsed));
      }

      const next = this.queue.shift();
      if (next) {
        this.lastRequest = Date.now();
        next();
      }
    }

    this.processing = false;
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (use with caution)
   */
  clear(): void {
    this.queue = [];
  }
}

/**
 * Global rate limiter instance for PubMed API
 * Configured for 3 requests per second
 */
export const pubmedRateLimiter = new RateLimiter(3);

/**
 * Wrapper function to execute a function with rate limiting
 * @param fn - Async function to execute
 * @returns Promise with the function result
 */
export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  await pubmedRateLimiter.acquire();
  return fn();
}
