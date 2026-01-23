/**
 * Performance Monitoring for Literature Features
 * Tracks metrics like load times, cache hit rates, and errors
 * @module utils/literatureMonitoring
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorMetric {
  type: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class LiteratureMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Track a performance metric
   */
  trackMetric(name: string, value: number, metadata?: Record<string, any>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only last 100 metrics to prevent memory leak
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[LiteratureMonitor] ${name}: ${value}ms`, metadata);
    }
  }

  /**
   * Track an error
   */
  trackError(type: string, message: string, metadata?: Record<string, any>) {
    this.errors.push({
      type,
      message,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[LiteratureMonitor] Error - ${type}: ${message}`, metadata);
    }
  }

  /**
   * Track cache hit
   */
  trackCacheHit() {
    this.cacheHits++;
  }

  /**
   * Track cache miss
   */
  trackCacheMiss() {
    this.cacheMisses++;
  }

  /**
   * Get cache hit rate as percentage
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return (this.cacheHits / total) * 100;
  }

  /**
   * Get average metric value by name
   */
  getAverageMetric(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }

  /**
   * Get error rate (errors per minute)
   */
  getErrorRate(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentErrors = this.errors.filter(e => e.timestamp > oneMinuteAgo);
    return recentErrors.length;
  }

  /**
   * Get all metrics for reporting
   */
  getMetrics() {
    return {
      averageLoadTime: this.getAverageMetric('literature_load_time'),
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
      totalCacheHits: this.cacheHits,
      totalCacheMisses: this.cacheMisses,
      recentMetrics: this.metrics.slice(-10),
      recentErrors: this.errors.slice(-10),
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.metrics = [];
    this.errors = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Export metrics for analytics
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      errors: this.errors,
      cacheStats: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: this.getCacheHitRate(),
      },
      timestamp: Date.now(),
    };
  }
}

// Global monitor instance
export const literatureMonitor = new LiteratureMonitor();

/**
 * Higher-order function to measure execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    literatureMonitor.trackMetric(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    literatureMonitor.trackMetric(name, duration, { ...metadata, failed: true });
    throw error;
  }
}

/**
 * Track analytics event (placeholder for actual analytics integration)
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // In production, integrate with your analytics service
  // Example: analytics.track(eventName, properties);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, properties);
  }
}
