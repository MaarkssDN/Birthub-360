import { formatCurrency, sleep, ApiError } from '@/utils';
import { describe, it, expect, vi } from 'vitest';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format numbers to BRL currency correctly', () => {
      // Due to intl formatting non-breaking spaces variations, match structure
      expect(formatCurrency(100)).toMatch(/R\$\s*100,00/);
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
    });
  });

  describe('sleep', () => {
    it('should wait for specified time', async () => {
      vi.useFakeTimers();
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
      vi.useRealTimers();
    });
  });

  describe('ApiError', () => {
    it('should create an error with statusCode', () => {
      const error = new ApiError('Not found', 404);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });
  });
});
