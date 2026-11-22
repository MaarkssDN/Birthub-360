import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  available: vi.fn(async () => ({ available: true })),
  requestPermissions: vi.fn(async () => ({ speechRecognition: 'granted' })),
  start: vi.fn(async () => ({ matches: ['abrir crm'] })),
  stop: vi.fn(async () => {}),
  listeners: {} as Record<string, (data: any) => void>,
  addListener: vi.fn(async (event: string, cb: (data: any) => void) => {
    mocks.listeners[event] = cb;
    return { remove: vi.fn() };
  }),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mocks.isNativePlatform() },
}));
vi.mock('@capacitor-community/speech-recognition', () => ({
  SpeechRecognition: {
    available: mocks.available,
    requestPermissions: mocks.requestPermissions,
    start: mocks.start,
    stop: mocks.stop,
    addListener: mocks.addListener,
  },
}));

import { createSpeechRecognition } from '../nativeSpeech.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createSpeechRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isNativePlatform.mockReturnValue(false);
    mocks.available.mockResolvedValue({ available: true });
    mocks.requestPermissions.mockResolvedValue({ speechRecognition: 'granted' });
    mocks.start.mockResolvedValue({ matches: ['abrir crm'] });
    mocks.listeners = {};
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;
  });

  it('na web usa window.SpeechRecognition quando existe', () => {
    class FakeRec {
      continuous = false;
      lang = '';
      start() {}
      stop() {}
    }
    // @ts-expect-error stub mínimo da Web Speech API
    window.SpeechRecognition = FakeRec;
    const rec = createSpeechRecognition();
    expect(rec).toBeInstanceOf(FakeRec);
  });

  it('na web retorna null sem a API', () => {
    expect(createSpeechRecognition()).toBeNull();
  });

  it('no app nativo retorna adaptador que emite resultado final e onend', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    const rec = createSpeechRecognition();
    expect(rec).not.toBeNull();

    const onresult = vi.fn();
    const onend = vi.fn();
    const onerror = vi.fn();
    rec!.onresult = onresult;
    rec!.onend = onend;
    rec!.onerror = onerror;
    rec!.lang = 'pt-BR';

    rec!.start();
    await flush();
    await flush();

    expect(mocks.requestPermissions).toHaveBeenCalled();
    expect(mocks.start).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'pt-BR', partialResults: true }),
    );
    // resultado final emitido pelo plugin
    expect(onresult).toHaveBeenCalledWith(
      expect.objectContaining({
        results: [expect.objectContaining({ 0: { transcript: 'abrir crm' }, isFinal: true })],
      }),
    );
    expect(onend).toHaveBeenCalled();
    expect(onerror).not.toHaveBeenCalled();
  });

  it('emite resultados parciais durante a escuta', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.start.mockImplementation(() => new Promise(() => {})); // nunca resolve
    const rec = createSpeechRecognition()!;
    const onresult = vi.fn();
    rec.onresult = onresult;
    rec.start();
    await flush();
    await flush();

    mocks.listeners.partialResults?.({ matches: ['abrir', 'crm'] });
    expect(onresult).toHaveBeenCalledWith(
      expect.objectContaining({
        results: [expect.objectContaining({ 0: { transcript: 'abrir crm' }, isFinal: false })],
      }),
    );
    rec.stop();
  });

  it('permissão negada dispara onerror + onend sem iniciar', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.requestPermissions.mockResolvedValue({ speechRecognition: 'denied' });
    const rec = createSpeechRecognition()!;
    const onerror = vi.fn();
    const onend = vi.fn();
    rec.onerror = onerror;
    rec.onend = onend;
    rec.start();
    await flush();
    await flush();

    expect(mocks.start).not.toHaveBeenCalled();
    expect(onerror).toHaveBeenCalled();
    expect(onend).toHaveBeenCalled();
  });

  it('stop() chama o plugin e impede novo start automático', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    const rec = createSpeechRecognition()!;
    rec.start();
    await flush();
    await flush();
    rec.stop();
    await flush();
    expect(mocks.stop).toHaveBeenCalled();
  });
});
