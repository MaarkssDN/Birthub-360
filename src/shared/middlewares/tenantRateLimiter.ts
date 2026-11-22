import type { NextFunction, Request, Response } from 'express';
import { getTenantId } from '../../lib/async-context.js';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
}

interface WindowBucket {
  resetTime: number;
  count: number;
}

export class TenantRateLimiter {
  private buckets = new Map<string, WindowBucket>();

  constructor(private readonly options: RateLimitOptions) {}

  public getRateLimiter() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const now = Date.now();
      const tenantId = getTenantId();
      // Tenant-aware key isolation: tenant ID first, fallback to IP
      const clientKey = tenantId ? `tenant:${tenantId}` : `ip:${req.ip || 'unknown'}`;
      const bucketKey = `${clientKey}:${req.baseUrl || ''}${req.path}`;

      let bucket = this.buckets.get(bucketKey);

      if (!bucket || now >= bucket.resetTime) {
        bucket = {
          resetTime: now + this.options.windowMs,
          count: 1,
        };
        this.buckets.set(bucketKey, bucket);
      } else {
        bucket.count++;
      }

      const remaining = Math.max(0, this.options.max - bucket.count);
      const resetInSeconds = Math.ceil((bucket.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.options.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetInSeconds);

      if (bucket.count > this.options.max) {
        res.setHeader('Retry-After', resetInSeconds);
        res.status(this.options.statusCode || 429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: this.options.message || 'Muitas requisições. Tente novamente mais tarde.',
            retryAfterSeconds: resetInSeconds,
          },
        });
        return;
      }

      next();
    };
  }

  public reset(): void {
    this.buckets.clear();
  }
}

export function createTenantRateLimiter(options: RateLimitOptions) {
  const limiter = new TenantRateLimiter(options);
  return limiter.getRateLimiter();
}
