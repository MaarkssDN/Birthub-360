import { describe, it, expect, vi } from 'vitest';
import { cn } from '@/lib/utils';

describe('Lib utils', () => {
  describe('cn', () => {
    it('should merge classes properly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
      expect(cn('p-4 text-black', 'p-8')).toBe('text-black p-8');
    });
  });
});
