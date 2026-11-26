import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  writeFile: vi.fn(async () => ({ uri: 'file:///cache/Cache/out.csv' })),
  share: vi.fn(async () => ({})),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mocks.isNativePlatform() },
}));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { writeFile: mocks.writeFile },
}));
vi.mock('@capacitor/share', () => ({
  Share: { share: mocks.share },
}));

import { downloadBlob } from '../nativeDownload.js';

describe('downloadBlob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isNativePlatform.mockReturnValue(false);
    mocks.writeFile.mockResolvedValue({ uri: 'file:///cache/Cache/out.csv' });
    // jsdom não implementa createObjectURL/revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('na web dispara download via Blob URL + <a download>', async () => {
    const blob = new Blob(['a,b\n1,2'], { type: 'text/csv' });
    await downloadBlob(blob, 'leads.csv');

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(mocks.share).not.toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('no app nativo grava no cache e abre a folha de compartilhamento', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    const blob = new Blob(['conteudo'], { type: 'text/plain' });
    await downloadBlob(blob, 'script.py');

    expect(mocks.writeFile).toHaveBeenCalledTimes(1);
    const writeArgs = (mocks.writeFile.mock.calls[0] as any)?.[0] as {
      path: string;
      data: string;
      directory: string;
    };
    expect(writeArgs.path).toBe('script.py');
    expect(writeArgs.directory).toBe('CACHE');
    // payload é base64 do conteúdo ('conteudo' -> 'Y29udGV1ZG8=')
    expect(writeArgs.data).toBe('Y29udGV1ZG8=');
    expect(mocks.share).toHaveBeenCalledWith({
      title: 'script.py',
      files: ['file:///cache/Cache/out.csv'],
    });
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('sanitiza o nome do arquivo no caminho nativo', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    await downloadBlob(new Blob(['x']), '../tmp/relatorio final (v2).csv');
    const writeArgs = (mocks.writeFile.mock.calls[0] as any)?.[0] as { path: string };
    expect(writeArgs.path).not.toContain('/');
    expect(writeArgs.path).not.toContain('..');
    expect(writeArgs.path.endsWith('.csv')).toBe(true);
  });

  it('propaga erro quando a entrega nativa falha', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.writeFile.mockRejectedValueOnce(new Error('sem espaço'));
    await expect(downloadBlob(new Blob(['x']), 'a.csv')).rejects.toThrow('sem espaço');
  });
});
