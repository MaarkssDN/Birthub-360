export interface IosSigningCertificateMetadata {
  profileName: string;
  bundleId: string;
  expiresAt: Date;
}

export interface CertificateRenewalDecision {
  profileName: string;
  bundleId: string;
  daysRemaining: number;
  status: 'VALID' | 'RENEWAL_REQUIRED' | 'EXPIRED';
  fastlaneCommand: string | null;
}

export const IOS_CERT_RENEWAL_THRESHOLD_DAYS = 14;

export function evaluateIosSigningCertificateHealth(
  cert: IosSigningCertificateMetadata,
  now: Date = new Date(),
): CertificateRenewalDecision {
  const diffMs = cert.expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (daysRemaining < 0) {
    return {
      profileName: cert.profileName,
      bundleId: cert.bundleId,
      daysRemaining,
      status: 'EXPIRED',
      fastlaneCommand: 'bundle exec fastlane ios renew_certificates',
    };
  }

  if (daysRemaining <= IOS_CERT_RENEWAL_THRESHOLD_DAYS) {
    return {
      profileName: cert.profileName,
      bundleId: cert.bundleId,
      daysRemaining,
      status: 'RENEWAL_REQUIRED',
      fastlaneCommand: 'bundle exec fastlane ios renew_certificates',
    };
  }

  return {
    profileName: cert.profileName,
    bundleId: cert.bundleId,
    daysRemaining,
    status: 'VALID',
    fastlaneCommand: null,
  };
}
