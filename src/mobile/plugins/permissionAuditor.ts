const FORBIDDEN_UNUSED_MOBILE_PERMISSIONS = [
  'CAMERA',
  'ACCESS_FINE_LOCATION',
  'ACCESS_COARSE_LOCATION',
  'Geolocation',
  'Camera',
] as const;

export function auditCapacitorLeastPrivilegeConfig(configSource: string): {
  compliant: boolean;
  unusedPermissionsFound: string[];
} {
  const unusedPermissionsFound: string[] = [];
  for (const perm of FORBIDDEN_UNUSED_MOBILE_PERMISSIONS) {
    const regex = new RegExp(`\\b${perm}\\b`);
    if (regex.test(configSource)) {
      unusedPermissionsFound.push(perm);
    }
  }
  return {
    compliant: unusedPermissionsFound.length === 0,
    unusedPermissionsFound,
  };
}
