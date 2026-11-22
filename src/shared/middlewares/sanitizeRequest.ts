import type { NextFunction, Request, Response } from 'express';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively removes prototype pollution keys and null bytes from request inputs.
 */
export function sanitizeValue<T>(val: T): T {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    // Strip dangerous null-byte injections
    return val.replace(/\0/g, '') as unknown as T;
  }

  if (Array.isArray(val)) {
    return val.map(sanitizeValue) as unknown as T;
  }

  if (typeof val === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(k)) {
        continue; // drop malicious prototype pollution attempts
      }
      sanitizedObj[k] = sanitizeValue(v);
    }
    return sanitizedObj as T;
  }

  return val;
}

/**
 * Defensive Middleware for Prototype Pollution and String Poisoning Prevention
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as any;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as any;
  }
  next();
};
