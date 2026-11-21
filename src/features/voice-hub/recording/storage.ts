/**
 * Secure Voice Recording Storage with Enforced Server-Side Encryption (SSE-KMS)
 * Requisito Sol (Squad 60 - Agente 62)
 *
 * Força criptografia Server-Side (SSE-KMS) no bucket S3 de gravações de chamadas de voz.
 * Qualquer tentativa de upload sem os cabeçalhos mandatários de criptografia KMS é
 * rejeitada sumariamente para conformidade de telecom e proteção de dados sensíveis (LGPD).
 */

import { logger } from '../../../lib/logger.js';

export const DEFAULT_VOICE_KMS_KEY_ALIAS = 'alias/birthhub-voice-recordings';

export interface VoiceUploadParams {
  bucket: string;
  key: string;
  audioBuffer: Buffer | Uint8Array;
  organizationId: string;
  callSid: string;
  serverSideEncryption?: 'aws:kms';
  ssekmsKeyId?: string;
  contentType?: string;
}

export interface S3PutObjectEncryptedPayload {
  Bucket: string;
  Key: string;
  Body: Buffer | Uint8Array;
  ContentType: string;
  ServerSideEncryption: 'aws:kms';
  SSEKMSKeyId: string;
  Metadata: {
    organizationId: string;
    callSid: string;
    encryptedAt: string;
    retention: string;
  };
}

export class MissingKmsEncryptionError extends Error {
  constructor(reason: string) {
    super(
      `Segurança de Voz [Sol]: Rejeitado upload de áudio sem criptografia SSE-KMS obrigatória. Motivo: ${reason}`,
    );
    this.name = 'MissingKmsEncryptionError';
  }
}

/**
 * Constrói e valida o payload de envio para o S3 garantindo que SSE-KMS esteja estritamente ativo.
 */
export function buildSecureVoiceRecordingUpload(
  params: VoiceUploadParams,
): S3PutObjectEncryptedPayload {
  const {
    bucket,
    key,
    audioBuffer,
    organizationId,
    callSid,
    serverSideEncryption,
    ssekmsKeyId,
    contentType = 'audio/wav',
  } = params;

  if (serverSideEncryption !== 'aws:kms') {
    logger.error(
      { organizationId, callSid, serverSideEncryption },
      'VoiceRecordingStorage: Tentativa de upload sem ServerSideEncryption="aws:kms". Upload bloqueado!',
    );
    throw new MissingKmsEncryptionError('O cabeçalho ServerSideEncryption deve ser "aws:kms".');
  }

  const effectiveKmsKey = ssekmsKeyId || DEFAULT_VOICE_KMS_KEY_ALIAS;
  if (!effectiveKmsKey) {
    throw new MissingKmsEncryptionError(
      'Chave KMS (SSEKMSKeyId) é obrigatória para gravações de áudio.',
    );
  }

  logger.info(
    { organizationId, callSid, bucket, key, ssekmsKeyId: effectiveKmsKey },
    'VoiceRecordingStorage: Upload de áudio criptografado com SSE-KMS preparado com sucesso.',
  );

  return {
    Bucket: bucket,
    Key: key,
    Body: audioBuffer,
    ContentType: contentType,
    ServerSideEncryption: 'aws:kms',
    SSEKMSKeyId: effectiveKmsKey,
    Metadata: {
      organizationId,
      callSid,
      encryptedAt: new Date().toISOString(),
      retention: 'voice-call-recordings-7y',
    },
  };
}
