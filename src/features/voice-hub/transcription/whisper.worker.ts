export interface WhisperChannelTranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
  confidence?: number;
}

export interface StereoAudioBufferInput {
  callId: string;
  tenantId: string;
  sampleRate: number;
  /** Canal 0 (Left): operador/atendente */
  agentChannelSamples: Float32Array;
  /** Canal 1 (Right): cliente/paciente */
  customerChannelSamples: Float32Array;
}

export interface DiarizedUtterance {
  speaker: 'AGENT' | 'CUSTOMER';
  channelIndex: 0 | 1;
  startSec: number;
  endSec: number;
  text: string;
  confidence: number;
}

export interface WhisperChannelTranscriberPort {
  transcribeMonoChannel(params: {
    samples: Float32Array;
    sampleRate: number;
    channelIndex: 0 | 1;
  }): Promise<WhisperChannelTranscriptSegment[]>;
}

/**
 * Separa um buffer PCM estéreo intercalado [L0, R0, L1, R1, ...] em dois canais independentes
 * para impedir que falas simultâneas de atendente e cliente se sobreponham no STT.
 */
export function splitInterleavedStereoPcm(interleaved: Float32Array): {
  agentChannel: Float32Array;
  customerChannel: Float32Array;
} {
  if (interleaved.length % 2 !== 0) {
    throw new Error('Buffer PCM estéreo intercalado deve possuir número par de amostras.');
  }
  const frameCount = interleaved.length / 2;
  const agentChannel = new Float32Array(frameCount);
  const customerChannel = new Float32Array(frameCount);

  for (let i = 0; i < frameCount; i++) {
    agentChannel[i] = interleaved[i * 2];
    customerChannel[i] = interleaved[i * 2 + 1];
  }

  return { agentChannel, customerChannel };
}

export async function diarizeStereoAudioChannels(
  input: StereoAudioBufferInput,
  transcriber: WhisperChannelTranscriberPort,
): Promise<DiarizedUtterance[]> {
  if (!input.tenantId?.trim() || !input.callId?.trim()) {
    throw new Error('tenantId e callId são obrigatórios no pipeline Whisper.');
  }

  const [agentSegments, customerSegments] = await Promise.all([
    transcriber.transcribeMonoChannel({
      samples: input.agentChannelSamples,
      sampleRate: input.sampleRate,
      channelIndex: 0,
    }),
    transcriber.transcribeMonoChannel({
      samples: input.customerChannelSamples,
      sampleRate: input.sampleRate,
      channelIndex: 1,
    }),
  ]);

  const utterances: DiarizedUtterance[] = [];

  for (const seg of agentSegments) {
    const cleanText = seg.text.trim();
    if (!cleanText) continue;
    utterances.push({
      speaker: 'AGENT',
      channelIndex: 0,
      startSec: seg.startSec,
      endSec: seg.endSec,
      text: cleanText,
      confidence: seg.confidence ?? 0.95,
    });
  }

  for (const seg of customerSegments) {
    const cleanText = seg.text.trim();
    if (!cleanText) continue;
    utterances.push({
      speaker: 'CUSTOMER',
      channelIndex: 1,
      startSec: seg.startSec,
      endSec: seg.endSec,
      text: cleanText,
      confidence: seg.confidence ?? 0.95,
    });
  }

  utterances.sort((a, b) => a.startSec - b.startSec || a.channelIndex - b.channelIndex);
  return utterances;
}
