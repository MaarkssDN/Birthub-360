import { Button, Modal } from '../../../components/design-system/index.js';

interface OverviewActionModalProps {
  activeActionModal: string | null;
  onClose: () => void;
  onConfirm: (type: string) => void;
}

export function OverviewActionModal({
  activeActionModal,
  onClose,
  onConfirm,
}: OverviewActionModalProps) {
  return (
    <Modal
      isOpen={activeActionModal !== null}
      onClose={() => onClose()}
      title={
        activeActionModal === 'agent'
          ? 'Criar Novo Agente de Voz'
          : activeActionModal === 'telephony'
            ? 'Vincular Número de Telefonia (SIP)'
            : activeActionModal === 'knowledge'
              ? 'Importar Base de Conhecimento'
              : 'Executar Teste de Chamada'
      }
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onClose()}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => onConfirm(activeActionModal || '')}>
            Continuar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Você será redirecionado para a tela correspondente para concluir esta ação.
        </p>
      </div>
    </Modal>
  );
}
