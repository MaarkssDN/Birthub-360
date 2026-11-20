import { describe, expect, it } from 'vitest';
import {
  buildSecureVoiceRecordingUpload,
  DEFAULT_VOICE_KMS_KEY_ALIAS,
  MissingKmsEncryptionError,
  type VoiceUploadParams,
} from '../../../../src/features/voice-hub/recording/storage.js';

describe('Voice Recording SSE-KMS Encryption (Agente 62 Sol)', () => {
  const validBuffer = Buffer.from('RIFF....WAVEfmt ');

  it('rejects voice upload when ServerSideEncryption is missing or not aws:kms', () => {
    const invalidParams: VoiceUploadParams = {
      bucket: 'birthhub-voice-vault',
      key: 'recordings/call-123.wav',
      audioBuffer: validBuffer,
      organizationId: 'tenant-voice',
      callSid: 'CA123456789',
      // serverSideEncryption missing
    };

    expect(() => buildSecureVoiceRecordingUpload(invalidParams)).toThrow(
      MissingKmsEncryptionError,
    );
  });

  it('generates compliant S3 PutObject payload with SSE-KMS enforced when params are valid', () => {
    const validParams: VoiceUploadParams = {
      bucket: 'birthhub-voice-vault',
      key: 'recordings/call-123.wav',
      audioBuffer: validBuffer,
      organizationId: 'tenant-voice',
      callSid: 'CA123456789',
      serverSideEncryption: 'aws:kms',
      ssekmsKeyId: 'arn:aws:kms:sa-east-1:123456789012:key/voice-custom-key',
    };

    const payload = buildSecureVoiceRecordingUpload(validParams);

    expect(payload.ServerSideEncryption).toBe('aws:kms');
    expect(payload.SSEKMSKeyId).toBe('arn:aws:kms:sa-east-1:123456789012:key/voice-custom-key');
    expect(payload.Metadata.organizationId).toBe('tenant-voice');
    expect(payload.Metadata.callSid).toBe('CA123456789');
    expect(payload.Metadata.encryptedAt).toBeDefined();
  });

  it('uses default voice KMS key alias when specific key ID is not overridden', () => {
    const defaultParams: VoiceUploadParams = {
      bucket: 'birthhub-voice-vault',
      key: 'recordings/call-default.wav',
      audioBuffer: validBuffer,
      organizationId: 'tenant-voice',
      callSid: 'CA999',
      serverSideEncryption: 'aws:kms',
    };

    const payload = buildSecureVoiceRecordingUpload(defaultParams);

    expect(payload.ServerSideEncryption).toBe('aws:kms');
    expect(payload.SSEKMSKeyId).toBe(DEFAULT_VOICE_KMS_KEY_ALIAS);
  });
});
