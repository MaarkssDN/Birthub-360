import React from 'react';

export interface AudioStreamVisualizerProps {
  sampleRateHz: number;
  rmsAmplitude: number;
  trackMutedByOs?: boolean;
}

export function evaluateRealMicrophoneSignal(props: AudioStreamVisualizerProps): {
  capturingRealAudio: boolean;
  levelPct: number;
  statusLabel: string;
} {
  if (props.trackMutedByOs || props.sampleRateHz <= 0 || props.rmsAmplitude <= 0.001) {
    return {
      capturingRealAudio: false,
      levelPct: 0,
      statusLabel: props.trackMutedByOs
        ? 'Microfone silenciado pelo sistema operacional'
        : 'Sem sinal de áudio detectado',
    };
  }
  const levelPct = Math.min(100, Math.max(5, Math.round(props.rmsAmplitude * 100)));
  return {
    capturingRealAudio: true,
    levelPct,
    statusLabel: `Capturando áudio real (${props.sampleRateHz} Hz)`,
  };
}

export const VoiceAudioVisualizer: React.FC<AudioStreamVisualizerProps> = (props) => {
  const signal = evaluateRealMicrophoneSignal(props);
  return (
    <div
      data-testid="voice-audio-visualizer"
      data-capturing={String(signal.capturingRealAudio)}
      className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs"
    >
      <span className="font-semibold">{signal.statusLabel}</span>
      <span data-testid="voice-audio-level">{signal.levelPct}%</span>
    </div>
  );
};
