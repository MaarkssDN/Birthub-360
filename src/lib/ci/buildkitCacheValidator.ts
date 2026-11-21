export const CANONICAL_BUILDKIT_GHA_CACHE_SNIPPET = `
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
- name: Build and push with BuildKit cache
  uses: docker/build-push-action@v6
  with:
    context: .
    cache-from: type=gha
    cache-to: type=gha,mode=max
`.trim();

export function validateDockerBuildkitCacheConfig(yamlContent: string): {
  hasBuildx: boolean;
  hasGhaCacheFrom: boolean;
  hasGhaCacheTo: boolean;
  valid: boolean;
} {
  const hasBuildx = /docker\/setup-buildx-action@/i.test(yamlContent);
  const hasGhaCacheFrom = /cache-from:\s*type=gha/i.test(yamlContent);
  const hasGhaCacheTo = /cache-to:\s*type=gha/i.test(yamlContent);

  return {
    hasBuildx,
    hasGhaCacheFrom,
    hasGhaCacheTo,
    valid: hasBuildx && hasGhaCacheFrom && hasGhaCacheTo,
  };
}
