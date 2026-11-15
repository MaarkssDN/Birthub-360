import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { clientLogger } from './clientLogger.js';

/**
 * Entrega de arquivo gerado no cliente (CSV/XLSX/texto) de forma que funcione
 * tanto na web quanto dentro do app Capacitor (Android/iOS).
 *
 * Contexto (handoff 09→02, Onda 8): o padrão `URL.createObjectURL(blob)` +
 * `<a download>` não funciona no WebView empacotado — o bridge do Capacitor não
 * registra `WebView.setDownloadListener` e um `blob:` URL vive só na realm JS,
 * sem caminho nativo de interceptação. No app, gravamos o arquivo no diretório
 * de cache do app via `@capacitor/filesystem` e entregamos pela folha de
 * compartilhamento nativa (`@capacitor/share`), que inclui "salvar em
 * Arquivos"/"salvar no Drive". Na web, mantemos o download direto via Blob URL.
 */

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // data:<mime>;base64,<payload> — o plugin espera apenas o payload base64
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler Blob'));
    reader.readAsDataURL(blob);
  });
}

function sanitizeFilename(filename: string): string {
  // Remove separadores de caminho e qualquer caractere fora de [A-Za-z0-9._-] —
  // o nome vira um arquivo dentro de Directory.Cache, nunca um caminho absoluto.
  const base = filename.split(/[\\/]/).pop() ?? 'download';
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^\.+/, '');
  return cleaned.trim() || 'download';
}

async function downloadNative(blob: Blob, filename: string): Promise<void> {
  const safeName = sanitizeFilename(filename);
  const data = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: safeName,
    data,
    directory: Directory.Cache,
    recursive: true,
  });
  await Share.share({
    title: safeName,
    files: [written.uri],
  });
}

function downloadWeb(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Baixa/salva um Blob com o nome informado. No app nativo abre a folha de
 * compartilhamento do sistema; na web dispara o download do navegador.
 * Lança erro em falha — o chamador decide como exibir (toast etc.).
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await downloadNative(blob, filename);
      return;
    } catch (err) {
      clientLogger.error({ err }, 'Falha ao entregar arquivo via share nativo');
      throw err;
    }
  }
  downloadWeb(blob, filename);
}
