export interface RateLimitIdentityInput {
  ipAddress: string;
  tenantId?: string | null;
  apiKeyId?: string | null;
}

export function resolveCompositeRateLimitKey(input: RateLimitIdentityInput): {
  key: string;
  tier: 'CORPORATE_API_KEY' | 'AUTHENTICATED_TENANT' | 'ANONYMOUS_IP';
} {
  const ip = input.ipAddress?.trim() || '0.0.0.0';
  const tenant = input.tenantId?.trim();
  const apiKey = input.apiKeyId?.trim();

  if (tenant && apiKey) {
    return {
      key: `rl:corp:${tenant}:key:${apiKey}`,
      tier: 'CORPORATE_API_KEY',
    };
  }
  if (tenant) {
    return {
      key: `rl:tenant:${tenant}:ip:${ip}`,
      tier: 'AUTHENTICATED_TENANT',
    };
  }
  return {
    key: `rl:ip:${ip}`,
    tier: 'ANONYMOUS_IP',
  };
}
