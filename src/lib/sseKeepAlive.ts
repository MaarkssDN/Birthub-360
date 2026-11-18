import type { ServerResponse } from 'node:http';

/**
 * Intervalo default do heartbeat SSE. 25s fica abaixo do timeout típico de
 * proxies/load balancers ociosos (30–60s), mantendo o stream vivo sem tráfego
 * significativo.
 */
export const SSE_HEARTBEAT_INTERVAL_MS = 25_000;

type SseWritable = Pick<ServerResponse, 'write' | 'on' | 'off'>;

/**
 * Keepalive para endpoints SSE (`text/event-stream`): escreve um comentário
 * `: ping` a cada `intervalMs`. Comentários SSE são descartados pelo parser do
 * cliente (EventSource ou reader manual), então não afetam o protocolo de dados.
 *
 * Impede que proxies/load balancers derrubem conexões ociosas e serve de
 * "liveness" barato para o socket. Retorna `stop()`; o intervalo também é
 * limpo automaticamente nos eventos `close`/`error` do response (anti memory
 * leak). `unref()` garante que o timer não segure o processo vivo sozinho.
 */
export function attachSseKeepAlive(
  res: SseWritable,
  intervalMs: number = SSE_HEARTBEAT_INTERVAL_MS,
): () => void {
  const stop = () => {
    clearInterval(timer);
    res.off('close', stop);
    res.off('error', stop);
  };

  const timer = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // Socket já morreu — limpa o timer imediatamente.
      stop();
    }
  }, intervalMs);
  (timer as { unref?: () => void }).unref?.();

  res.on('close', stop);
  res.on('error', stop);

  return stop;
}
