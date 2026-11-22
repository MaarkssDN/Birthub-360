import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validateRequest } from '../../../src/shared/middlewares/validateRequest.js';
import { sanitizeRequest, sanitizeValue } from '../../../src/shared/middlewares/sanitizeRequest.js';
import { TenantRateLimiter } from '../../../src/shared/middlewares/tenantRateLimiter.js';

describe('API Hardening & Defensive Middlewares (Fase 2.3)', () => {
  describe('validateRequest', () => {
    it('validates legacy single schema on req.body successfully', async () => {
      const schema = z.object({ title: z.string().min(3) });
      const middleware = validateRequest(schema);

      const req: any = { body: { title: 'Lead Qualificado' } };
      const res: any = {};
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.body.title).toBe('Lead Qualificado');
    });

    it('rejects invalid req.body and calls next with ZodError', async () => {
      const schema = z.object({ age: z.number().min(18) });
      const middleware = validateRequest(schema);

      const req: any = { body: { age: 15 } };
      const res: any = {};
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(z.ZodError);
    });

    it('validates multi-segment configuration (params, query, body)', async () => {
      const middleware = validateRequest({
        params: z.object({ id: z.string().uuid() }),
        query: z.object({ take: z.coerce.number().max(100) }),
        body: z.object({ name: z.string() }),
      });

      const req: any = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        query: { take: '25' },
        body: { name: 'Acme Corp' },
      };
      const res: any = {};
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
      // query 'take' was coerced from string '25' to number 25
      expect(req.query.take).toBe(25);
      expect(req.params.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('sanitizeRequest', () => {
    it('strips dangerous __proto__ and prototype keys', () => {
      const payload = JSON.parse('{"name":"test","__proto__":{"polluted":"yes"},"nested":{"constructor":"hack"}}');
      const clean = sanitizeValue(payload);

      expect(clean).toEqual({ name: 'test', nested: {} });
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('strips null-byte characters from string inputs', () => {
      const malicious = 'filename\0.jpg';
      const clean = sanitizeValue(malicious);
      expect(clean).toBe('filename.jpg');
    });

    it('sanitizes req.body, req.query and req.params in middleware', () => {
      const req: any = {
        body: { title: 'Valid\0Title', __proto__: { admin: true } },
        query: { search: 'query\0attack' },
        params: { id: 'clean-id' },
      };
      const res: any = {};
      const next = vi.fn();

      sanitizeRequest(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.body.title).toBe('ValidTitle');
      expect(req.query.search).toBe('queryattack');
      expect(req.params.id).toBe('clean-id');
    });
  });

  describe('TenantRateLimiter', () => {
    it('allows requests within threshold and sets headers', () => {
      const limiter = new TenantRateLimiter({ windowMs: 60000, max: 2 });
      const middleware = limiter.getRateLimiter();

      const req: any = { ip: '127.0.0.1', path: '/api/resource' };
      const headers: Record<string, any> = {};
      const res: any = {
        setHeader: (k: string, v: any) => { headers[k] = v; },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(headers['X-RateLimit-Limit']).toBe(2);
      expect(headers['X-RateLimit-Remaining']).toBe(1);

      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
      expect(headers['X-RateLimit-Remaining']).toBe(0);

      // Third request -> 429
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(2); // not called again
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'RATE_LIMIT_EXCEEDED' }),
        })
      );
    });
  });
});
