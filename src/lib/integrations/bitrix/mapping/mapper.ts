export interface BitrixCustomFieldSchema {
  bitrixFieldKey: string; // ex: UF_CRM_170001
  internalFieldKey: string;
  type: 'string' | 'number' | 'boolean';
  fallbackValue: string | number | boolean;
}

export function mapBitrixPayloadWithTypedCustomFieldFallback(
  rawPayload: Record<string, unknown>,
  schema: readonly BitrixCustomFieldSchema[],
): {
  mapped: Record<string, string | number | boolean>;
  missingOrOrphanFields: string[];
} {
  const mapped: Record<string, string | number | boolean> = {};
  const missingOrOrphanFields: string[] = [];

  for (const field of schema) {
    const rawVal = rawPayload[field.bitrixFieldKey];
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      mapped[field.internalFieldKey] = field.fallbackValue;
      missingOrOrphanFields.push(field.bitrixFieldKey);
      continue;
    }

    if (field.type === 'number') {
      const parsed = Number(rawVal);
      if (Number.isFinite(parsed)) {
        mapped[field.internalFieldKey] = parsed;
      } else {
        mapped[field.internalFieldKey] = field.fallbackValue;
        missingOrOrphanFields.push(field.bitrixFieldKey);
      }
    } else if (field.type === 'boolean') {
      mapped[field.internalFieldKey] =
        rawVal === true || rawVal === 'Y' || rawVal === '1' || rawVal === 1;
    } else {
      mapped[field.internalFieldKey] = String(rawVal).trim();
    }
  }

  return { mapped, missingOrOrphanFields };
}
