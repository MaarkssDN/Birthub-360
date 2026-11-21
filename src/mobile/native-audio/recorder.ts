export interface MicrophonePermissionFlowPort {
  showEducationalModal(explanation: string): Promise<{ userAcceptedExplanation: boolean }>;
  requestOsMicrophonePermission(): Promise<'granted' | 'denied'>;
}

export const MICROPHONE_EDUCATIONAL_EXPLANATION =
  'O Birth Hub 360° utiliza o microfone exclusivamente para gravar comandos de voz comerciais e notas de reunião quando você pressiona o botão de captura.';

export async function requestMicrophoneWithEducationalPrompt(
  port: MicrophonePermissionFlowPort,
): Promise<{
  educationalModalShown: true;
  osPermissionRequested: boolean;
  status: 'granted' | 'denied' | 'deferred_by_user';
}> {
  const { userAcceptedExplanation } = await port.showEducationalModal(
    MICROPHONE_EDUCATIONAL_EXPLANATION,
  );
  if (!userAcceptedExplanation) {
    return {
      educationalModalShown: true,
      osPermissionRequested: false,
      status: 'deferred_by_user',
    };
  }

  const osStatus = await port.requestOsMicrophonePermission();
  return {
    educationalModalShown: true,
    osPermissionRequested: true,
    status: osStatus,
  };
}
