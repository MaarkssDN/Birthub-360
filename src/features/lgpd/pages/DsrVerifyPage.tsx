import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  type DsrVerifyResult,
  downloadDsrPackage,
  dsrErrorMessage,
  dsrApi,
} from './dsr.api.js';
import { DsrAlert, DsrShell } from './dsrShared.js';

type VerifyState =
  | { kind: 'loading' }
  | { kind: 'success'; result: DsrVerifyResult }
  | { kind: 'error'; message: string };

/**
 * `/privacidade/dsr/verificar?protocol=...&token=...` — destino do link de
 * verificação enviado por e-mail. O POST /verify é de uso único: executa o
 * direito na hora (LGPD art. 18) e devolve o dossiê para ACCESS/PORTABILITY.
 */
export default function DsrVerifyPage() {
  const [searchParams] = useSearchParams();
  const protocol = searchParams.get('protocol') ?? '';
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<VerifyState>({ kind: 'loading' });
  const ranRef = useRef(false);

  useEffect(() => {
    // StrictMode/render duplo não pode consumir o token duas vezes — a rota é
    // idempotente no servidor (token já usado → invalid_or_expired_token), mas
    // uma segunda chamada transformaria um sucesso em erro na tela.
    if (ranRef.current) return;
    ranRef.current = true;

    if (!protocol || !token) {
      setState({
        kind: 'error',
        message:
          'Este link está incompleto — faltam o protocolo ou o token. Abra o link exatamente como recebido no e-mail ou fale com o DPO.',
      });
      return;
    }

    let cancelled = false;
    dsrApi
      .verify(protocol, token)
      .then((res) => {
        if (cancelled) return;
        setState({ kind: 'success', result: res });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: 'error',
          message: dsrErrorMessage(
            err,
            'Não foi possível concluir sua solicitação agora. Tente novamente em instantes.',
          ),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [protocol, token]);

  return (
    <DsrShell title="Confirmação de solicitação de direitos">
      {state.kind === 'loading' && (
        <p className="text-sm text-ink-2" role="status" aria-live="polite">
          Confirmando sua solicitação…
        </p>
      )}

      {state.kind === 'error' && <DsrAlert tone="error">{state.message}</DsrAlert>}

      {state.kind === 'success' && (
        <div className="space-y-4" aria-live="polite">
          <DsrAlert tone="success">
            {state.result.status === 'COMPLETED' ? (
              <>
                <strong>Solicitação concluída.</strong> Seus dados foram tratados conforme o tipo
                de direito solicitado. Uma confirmação foi enviada ao seu e-mail.
              </>
            ) : (
              <>
                <strong>Solicitação recebida e em análise.</strong> Para correções e informações
                sobre compartilhamento, o Encarregado de Dados (DPO) analisa manualmente — você
                receberá a resposta no e-mail cadastrado, no prazo de até 15 dias.
              </>
            )}
          </DsrAlert>

          {state.result.package && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-2">
              <p className="text-sm text-ink-2">
                Seus dados pessoais exportados estão prontos para download em formato JSON.
                Guarde este arquivo em local seguro — ele contém dados pessoais.
              </p>
              <button
                type="button"
                onClick={() => downloadDsrPackage(protocol, state.result.package as string)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Baixar meus dados (JSON)
              </button>
            </div>
          )}
        </div>
      )}
    </DsrShell>
  );
}
