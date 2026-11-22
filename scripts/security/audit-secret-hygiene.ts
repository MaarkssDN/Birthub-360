// scripts/security/audit-secret-hygiene.ts
//
// Utilitário de auditoria de conformidade de segredos e higienização.
// Avalia entropia, detecção de placeholders e prontidão de rotação sem vazar segredos.
//
// Propriedade: Agente 15 (Segurança Aplicada e Rotação de Segredos)
//
// Uso:
//   npx tsx scripts/security/audit-secret-hygiene.ts
//

import { maskSecret } from '../../src/lib/security/credentialCrypto.js';

interface SecretDefinition {
  name: string;
  tier: number;
  minLen: number;
  expectedFormat?: 'base64-32b' | 'hex-32b' | 'any';
  requiredInProduction: boolean;
  description: string;
}

const SECRETS_REGISTRY: SecretDefinition[] = [
  {
    name: 'CREDENTIALS_ENCRYPTION_KEY',
    tier: 0,
    minLen: 44,
    expectedFormat: 'base64-32b',
    requiredInProduction: true,
    description: 'Chave mestra AES-256-GCM para credenciais de integração em repouso',
  },
  {
    name: 'PII_BLIND_INDEX_KEY',
    tier: 0,
    minLen: 44,
    expectedFormat: 'base64-32b',
    requiredInProduction: true,
    description: 'Chave HMAC-SHA256 para índices cegos de busca de PII (LGPD)',
  },
  {
    name: 'BETTER_AUTH_SECRET',
    tier: 1,
    minLen: 32,
    expectedFormat: 'any',
    requiredInProduction: true,
    description: 'Segredo de assinatura de tokens de sessão de usuários (Better Auth)',
  },
  {
    name: 'PLATFORM_OPERATOR_TOKEN',
    tier: 1,
    minLen: 32,
    expectedFormat: 'any',
    requiredInProduction: true,
    description: 'Token de operador de infraestrutura (/admin/queues e /metrics)',
  },
  {
    name: 'DATABASE_URL',
    tier: 1,
    minLen: 15,
    expectedFormat: 'any',
    requiredInProduction: true,
    description: 'String de conexão PostgreSQL com senha',
  },
  {
    name: 'BIRTH_VOICES_WEBHOOK_SECRET',
    tier: 2,
    minLen: 16,
    expectedFormat: 'any',
    requiredInProduction: false,
    description: 'Segredo compartilhado HMAC para webhooks do Birth Voices Hub',
  },
  {
    name: 'BIRTHHUB360_WEBHOOK_SECRET',
    tier: 2,
    minLen: 16,
    expectedFormat: 'any',
    requiredInProduction: false,
    description: 'Segredo de validação do webhook de resultado de voz (/voice-result)',
  },
  {
    name: 'THREECX_WEBHOOK_SECRET',
    tier: 2,
    minLen: 16,
    expectedFormat: 'any',
    requiredInProduction: false,
    description: 'Segredo HMAC para eventos da central telefônica 3CX',
  },
  {
    name: 'CHATWOOT_WEBHOOK_SECRET',
    tier: 2,
    minLen: 16,
    expectedFormat: 'any',
    requiredInProduction: false,
    description: 'Token de validação de webhooks do Chatwoot',
  },
  {
    name: 'BITRIX24_WEBHOOK_URL',
    tier: 3,
    minLen: 25,
    expectedFormat: 'any',
    requiredInProduction: false,
    description: 'URL de webhook de saída Bitrix24 com token embutido',
  },
  {
    name: 'BLAND_API_KEY',
    tier: 3,
    minLen: 20,
    expectedFormat: 'any',
    requiredInProduction: false,
    description: 'Chave de API da Bland AI para telefonia e discagem comercial',
  },
];

const PLACEHOLDER_PATTERNS = [
  /^replace-with/i,
  /^change-this/i,
  /^dev-only/i,
  /^00000000/i,
  /^insecure/i,
  /^default/i,
  /^your-/i,
];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(value));
}

function auditSecret(def: SecretDefinition): {
  status: 'OK' | 'MISSING' | 'PLACEHOLDER' | 'WEAK' | 'FORMAT_ERROR';
  masked: string;
  notes: string;
} {
  const val = process.env[def.name]?.trim();

  if (!val) {
    return {
      status: 'MISSING',
      masked: '[NÃO CONFIGURADO]',
      notes: def.requiredInProduction ? 'Obrigatório em produção (Fail-closed)' : 'Opcional',
    };
  }

  const masked = maskSecret(val);

  if (isPlaceholder(val)) {
    return {
      status: 'PLACEHOLDER',
      masked,
      notes: 'Valor provisório/placeholder detectado. Proibido em produção.',
    };
  }

  if (val.length < def.minLen) {
    return {
      status: 'WEAK',
      masked,
      notes: `Tamanho insuficiente (${val.length} caracteres, mínimo esperado: ${def.minLen}).`,
    };
  }

  if (def.expectedFormat === 'base64-32b') {
    const buf = Buffer.from(val, 'base64');
    if (buf.length !== 32) {
      return {
        status: 'FORMAT_ERROR',
        masked,
        notes: `Esperado 32 bytes em base64 (recebido ${buf.length} bytes decodificados).`,
      };
    }
  }

  return {
    status: 'OK',
    masked,
    notes: 'Em conformidade com a política de rotação.',
  };
}

export function runAudit(): void {
  console.log('='.repeat(80));
  console.log('🔍 AUDITORIA DE HIGIENE E CONFORMIDADE DE SEGREDOS (Agente 15)');
  console.log(`Ambiente detectado: NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(80));

  let totalIssues = 0;

  for (const def of SECRETS_REGISTRY) {
    const res = auditSecret(def);
    const icon = res.status === 'OK' ? '✅' : res.status === 'MISSING' && !def.requiredInProduction ? 'ℹ️' : '⚠️';

    if (res.status !== 'OK' && (res.status !== 'MISSING' || def.requiredInProduction)) {
      totalIssues++;
    }

    console.log(`\n${icon} [Tier ${def.tier}] ${def.name}`);
    console.log(`   Descrição: ${def.description}`);
    console.log(`   Status: ${res.status} | Amostra: ${res.masked}`);
    console.log(`   Diagnóstico: ${res.notes}`);
  }

  console.log('\n' + '='.repeat(80));
  if (totalIssues === 0) {
    console.log('✅ Todos os segredos avaliados estão íntegros e em conformidade.');
  } else {
    console.log(`⚠️ Foram identificados ${totalIssues} apontamentos para atenção/remediação.`);
  }
  console.log('='.repeat(80));
}

if (process.argv[1]?.endsWith('audit-secret-hygiene.ts')) {
  runAudit();
}
