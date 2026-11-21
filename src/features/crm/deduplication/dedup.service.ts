export interface CrmContactCandidate {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export function normalizePhoneToE164(
  rawPhone: string | null | undefined,
  defaultCountryCode: string = '55',
): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D+/g, '');
  if (digits.length < 10) return null;
  if (digits.startsWith(defaultCountryCode) && digits.length >= 12) {
    return `+${digits}`;
  }
  return `+${defaultCountryCode}${digits}`;
}

export function computePhoneticKeyPtBr(rawName: string): string {
  return rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/PH/g, 'F')
    .replace(/Y/g, 'I')
    .replace(/W/g, 'V')
    .replace(/Z/g, 'S')
    .replace(/([A-Z])\1+/g, '$1')
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();
}

export function detectDuplicateCrmContacts(
  contacts: readonly CrmContactCandidate[],
): { primaryId: string; duplicateId: string; reason: 'EMAIL' | 'PHONE_E164' | 'PHONETIC_NAME' }[] {
  const duplicates: {
    primaryId: string;
    duplicateId: string;
    reason: 'EMAIL' | 'PHONE_E164' | 'PHONETIC_NAME';
  }[] = [];

  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  const byPhonetic = new Map<string, string>();

  for (const c of contacts) {
    const cleanEmail = c.email?.trim().toLowerCase();
    const e164 = normalizePhoneToE164(c.phone);
    const phonetic = computePhoneticKeyPtBr(c.name);

    if (cleanEmail && byEmail.has(cleanEmail)) {
      duplicates.push({
        primaryId: byEmail.get(cleanEmail)!,
        duplicateId: c.id,
        reason: 'EMAIL',
      });
      continue;
    }
    if (e164 && byPhone.has(e164)) {
      duplicates.push({
        primaryId: byPhone.get(e164)!,
        duplicateId: c.id,
        reason: 'PHONE_E164',
      });
      continue;
    }
    if (phonetic && byPhonetic.has(phonetic)) {
      duplicates.push({
        primaryId: byPhonetic.get(phonetic)!,
        duplicateId: c.id,
        reason: 'PHONETIC_NAME',
      });
      continue;
    }

    if (cleanEmail) byEmail.set(cleanEmail, c.id);
    if (e164) byPhone.set(e164, c.id);
    if (phonetic) byPhonetic.set(phonetic, c.id);
  }

  return duplicates;
}
