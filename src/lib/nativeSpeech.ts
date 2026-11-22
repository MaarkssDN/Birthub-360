import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechPlugin } from '@capacitor-community/speech-recognition';
import { clientLogger } from './clientLogger.js';

/**
 * Fábrica de reconhecimento de voz que funciona na web e dentro do app
 * Capacitor (Android/iOS).
 *
 * Contexto (handoff 09→02, Onda 8): `VoiceCommandWidget` e demais consumidores
 * usam só a Web Speech API (`window.SpeechRecognition`), que não existe no
 * WebView/WKWebView empacotado — no app o botão de microfone sempre caía no
 * alerta de "não suportado". Aqui, em plataforma nativa, devolvemos um adaptador
 * sobre `@capacitor-community/speech-recognition` que implementa a mesma
 * interface `SpeechRecognitionLike` (tipos ambient em
 * `src/types/speech-recognition.d.ts`), então os consumidores não precisam
 * saber qual motor está por trás — só a fonte do texto transcrito muda.
 *
 * Limitação conhecida do plugin nativo: não existe modo "contínuo" real — cada
 * `start()` cobre uma elocução. Quando `continuous = true`, o adaptador reinicia
 * a escuta automaticamente após cada resultado final, até `stop()` ser chamado.
 */

interface SpeechResultItem {
  0: { transcript: string };
  isFinal: boolean;
}

class NativeSpeechRecognitionAdapter implements SpeechRecognitionLike {
  continuous = false;
  interimResults = true;
  lang = 'pt-BR';

  onresult: SpeechRecognitionLike['onresult'] = null;
  onerror: SpeechRecognitionLike['onerror'] = null;
  onend: SpeechRecognitionLike['onend'] = null;

  private started = false;
  private stoppedByUser = false;
  private listenersReady = false;
  private partialTranscript = '';

  private emitPartial(matches: string[]): void {
    const transcript = matches.join(' ');
    if (!transcript) return;
    this.partialTranscript = transcript;
    const item: SpeechResultItem = { 0: { transcript }, isFinal: false };
    this.onresult?.({ resultIndex: 0, results: [item] } as SpeechRecognitionEventLike);
  }

  private emitFinal(matches: string[]): void {
    const transcript = (matches.length > 0 ? matches : [this.partialTranscript])
      .filter(Boolean)
      .join(' ');
    this.partialTranscript = '';
    if (!transcript) return;
    const item: SpeechResultItem = { 0: { transcript }, isFinal: true };
    this.onresult?.({ resultIndex: 0, results: [item] } as SpeechRecognitionEventLike);
  }

  private async ensureListeners(): Promise<void> {
    if (this.listenersReady) return;
    this.listenersReady = true;
    await NativeSpeechPlugin.addListener('partialResults', (data) => {
      if (this.interimResults !== false) {
        this.emitPartial(data.matches ?? []);
      }
    });
    await NativeSpeechPlugin.addListener('listeningState', (data) => {
      if (data.status === 'stopped') {
        this.started = false;
        this.onend?.();
      }
    });
  }

  start(): void {
    if (this.started || this.stoppedByUser) return;
    this.stoppedByUser = false;
    this.partialTranscript = '';
    void this.startInternal();
  }

  private async startInternal(): Promise<void> {
    try {
      const { available } = await NativeSpeechPlugin.available();
      if (!available) {
        this.fail();
        return;
      }
      const perms = await NativeSpeechPlugin.requestPermissions();
      if (perms.speechRecognition === 'denied') {
        this.fail();
        return;
      }
      await this.ensureListeners();
      this.started = true;
      const result = await NativeSpeechPlugin.start({
        language: this.lang || 'pt-BR',
        maxResults: 5,
        partialResults: this.interimResults !== false,
        popup: false,
      });
      this.started = false;
      // O plugin resolve com os matches finais quando a escuta termina.
      this.emitFinal(result.matches ?? []);
      this.onend?.();
      // Modo contínuo: reinicia a escuta até stop() explícito.
      if (this.continuous && !this.stoppedByUser) {
        this.start();
      }
    } catch (err) {
      clientLogger.error({ err }, 'Falha no reconhecimento de voz nativo');
      this.fail();
    }
  }

  private fail(): void {
    this.started = false;
    this.onerror?.();
    this.onend?.();
  }

  stop(): void {
    this.stoppedByUser = true;
    this.started = false;
    void NativeSpeechPlugin.stop().catch((err) => {
      clientLogger.error({ err }, 'Falha ao parar reconhecimento de voz nativo');
    });
  }
}

/**
 * Retorna um reconhecedor de voz utilizável no ambiente atual:
 * - app nativo (Capacitor): adaptador do plugin `@capacitor-community/speech-recognition`;
 * - web: `window.SpeechRecognition`/`webkitSpeechRecognition` quando existir;
 * - `null` quando nenhum dos dois está disponível.
 */
export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (Capacitor.isNativePlatform()) {
    return new NativeSpeechRecognitionAdapter();
  }
  if (typeof window === 'undefined') return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}
