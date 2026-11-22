/**
 * Implementação de ancoragem externa durável em S3 Object Lock (WORM) para o head da cadeia de consentimento LGPD.
 * Atende Issue #36 / F5 (Agentes 15 e 10).
 *
 * Em produção:
 * - O checkpoint (organizationId, genesisId, genesisHash, lastSequence, lastHash, anchoredAt) é gravado
 *   em bucket S3 com Object Lock WORM habilitado (Legal Hold ou Retenção em modo Compliance).
 * - A chave no S3 segue a partição segura: `checkpoints/${organizationId}/seq-${sequence}.json` e `checkpoints/${organizationId}/latest.json`.
 * - Se fornecido signingSecret / KMS CMK, assina o payload do checkpoint com HMAC-SHA256 para garantir não-repúdio.
 */

import { createHmac } from 'node:crypto';
import { logger } from '../logger.js';
import type {
  ExternalConsentCheckpoint,
  IConsentExternalCheckpointStore,
} from './consentAuditChain.service.js';

export interface S3ObjectLockConsentCheckpointStoreOptions {
  bucketName: string;
  prefix?: string;
  kmsKeyId?: string;
  signingSecret?: string;
  s3Client?: any;
}

export class S3ObjectLockConsentCheckpointStore implements IConsentExternalCheckpointStore {
  private readonly bucketName: string;
  private readonly prefix: string;
  private readonly kmsKeyId?: string;
  private readonly signingSecret?: string;
  private s3ClientInstance?: any;

  constructor(opts: S3ObjectLockConsentCheckpointStoreOptions) {
    this.bucketName = opts.bucketName;
    this.prefix = opts.prefix ?? 'lgpd-consent-checkpoints';
    this.kmsKeyId = opts.kmsKeyId;
    this.signingSecret = opts.signingSecret;
    this.s3ClientInstance = opts.s3Client;
  }

  private async getS3Client() {
    if (this.s3ClientInstance) return this.s3ClientInstance;
    const { S3Client } = await import('@aws-sdk/client-s3');
    this.s3ClientInstance = new S3Client({});
    return this.s3ClientInstance;
  }

  private signPayload(
    checkpoint: Omit<ExternalConsentCheckpoint, 'signature'>,
  ): string | undefined {
    const secret = this.signingSecret ?? this.kmsKeyId;
    if (!secret) return undefined;
    const data = `${checkpoint.organizationId}:${checkpoint.genesisHash}:${checkpoint.lastSequence}:${checkpoint.lastHash}:${checkpoint.anchoredAt}`;
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  async saveCheckpoint(checkpoint: ExternalConsentCheckpoint): Promise<void> {
    const signature = checkpoint.signature ?? this.signPayload(checkpoint);
    const enrichedCheckpoint: ExternalConsentCheckpoint = {
      ...checkpoint,
      signature,
    };

    const payload = JSON.stringify(enrichedCheckpoint, null, 2);
    const s3 = await this.getS3Client();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    const keyLatest = `${this.prefix}/${checkpoint.organizationId}/latest.json`;
    const keySeq = `${this.prefix}/${checkpoint.organizationId}/seq-${checkpoint.lastSequence}.json`;

    const putSeq = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: keySeq,
      Body: payload,
      ContentType: 'application/json',
      ObjectLockLegalHoldStatus: 'ON',
      Metadata: {
        'organization-id': checkpoint.organizationId,
        'last-sequence': String(checkpoint.lastSequence),
        'last-hash': checkpoint.lastHash,
      },
    });

    const putLatest = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: keyLatest,
      Body: payload,
      ContentType: 'application/json',
      Metadata: {
        'organization-id': checkpoint.organizationId,
        'last-sequence': String(checkpoint.lastSequence),
      },
    });

    await Promise.all([s3.send(putSeq), s3.send(putLatest)]);

    logger.info(
      {
        bucket: this.bucketName,
        organizationId: checkpoint.organizationId,
        sequence: checkpoint.lastSequence,
      },
      'S3ObjectLockConsentCheckpointStore: checkpoint externo gravado com sucesso',
    );
  }

  async getLatestCheckpoint(organizationId: string): Promise<ExternalConsentCheckpoint | null> {
    try {
      const s3 = await this.getS3Client();
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const keyLatest = `${this.prefix}/${organizationId}/latest.json`;

      const response = await s3.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: keyLatest,
        }),
      );

      if (!response.Body) return null;
      const content = await response.Body.transformToString('utf-8');
      const parsed = JSON.parse(content) as ExternalConsentCheckpoint;

      if (this.signingSecret || this.kmsKeyId) {
        const expectedSig = this.signPayload(parsed);
        if (parsed.signature && expectedSig && parsed.signature !== expectedSig) {
          logger.error(
            { organizationId, sequence: parsed.lastSequence },
            'S3ObjectLockConsentCheckpointStore: assinatura do checkpoint externo inválida',
          );
          return null;
        }
      }

      return parsed;
    } catch (err: any) {
      if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      logger.error(
        { err, organizationId },
        'S3ObjectLockConsentCheckpointStore: erro ao recuperar checkpoint externo',
      );
      throw err;
    }
  }
}
