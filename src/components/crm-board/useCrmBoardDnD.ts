import {
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { type Dispatch, type SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { clientLogger } from '../../lib/clientLogger.js';
import { SoundFX } from '../../lib/soundEffects.js';
import { toast } from '../../lib/toast.js';
import type { Lead, LeadStatus } from '../../types/index.js';

// dnd-kit ativa drag por teclado em Space E Enter por padrão — mas KanbanCard também usa Enter pra
// abrir o LeadDetailDrawer (mesma tecla, dois significados). Restringindo o sensor a Space, Enter
// fica livre e sem ambiguidade pra "abrir detalhes"; Space vira exclusivamente "pegar/soltar o card".
const KEYBOARD_DRAG_CODES = {
  start: [KeyboardCode.Space],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space],
};

interface UseCrmBoardDnDOptions {
  leads: Lead[];
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  fetchLeads: () => void | Promise<void>;
  columns: LeadStatus[];
}

/**
 * Estado e handlers de drag-and-drop do CrmBoard, extraídos na TAREFA-SANEAMENTO-002 (W4).
 * Comportamento preservado verbatim — incluindo a solução de teclado multi-coluna documentada
 * abaixo (cursor autocontido em ref, sem reparentar `leads` durante o drag).
 */
export function useCrmBoardDnD({ leads, setLeads, fetchLeads, columns }: UseCrmBoardDnDOptions) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const keyboardDragStatusRef = useRef<LeadStatus | null>(null);

  // `sortableKeyboardCoordinates` (@dnd-kit/sortable) foi testado primeiro, por ser a opção
  // nativa do dnd-kit — mas falhou em execução real neste board multi-coluna: sua busca por
  // distância de canto (closestCorners) compara o card contra TODOS os droppables registrados
  // (cada card individual E o droppable de cada coluna inteira via useDroppable em
  // KanbanColumn), e o droppable da coluna, bem mais alto, tende a "ganhar" essa comparação
  // antes de a seta conseguir avançar — ArrowRight repetido nunca saía da coluna vizinha mais
  // próxima da origem.
  //
  // A primeira correção tentada usava um coordinateGetter próprio lendo `leads` (state) +
  // um handleDragOver que reparentava o card otimisticamente no array `leads` a cada mudança de
  // `over`, pra dar ao getter algo atualizado pra ler. Também falhou, por dois motivos
  // confirmados em execução real: (1) o KeyboardSensor do dnd-kit congela a função
  // coordinateGetter no momento em que o drag é ativado (Space) e reusa essa MESMA closure pro
  // resto do gesto — fechar sobre `leads` direto sempre lia o valor de quando o drag começou,
  // nunca o atualizado, nem trocando por uma ref sempre-atual resolvia sozinho; (2) reparentar o
  // card de verdade em `leads` fazia o React desmontar/remontar o KanbanCard em outra
  // <SortableContext> (coluna diferente = subárvore diferente, reconciliação por `key` não
  // atravessa colunas), derrubando o foco real do DOM pro <body> no meio do drag — e esse
  // remount, combinado com a remedição contínua de retângulos do dnd-kit
  // (MeasuringStrategy.WhileDragging), também fazia a "coluna atual" pular sozinha sem nenhuma
  // tecla ser pressionada.
  //
  // A solução abaixo evita os dois problemas não tocando em `leads` durante o drag: o
  // coordinateGetter mantém seu próprio "cursor" (`keyboardDragStatusRef`), que ele mesmo lê E
  // escreve a cada seta — autocontido, imune a re-render e a remontagem. `leads` só muda de
  // verdade no drop (handleDragEnd), igual ao mouse já fazia antes desta rodada. O preview
  // visual durante o drag continua vindo do <DragOverlay> (já existia antes desta rodada), que o
  // dnd-kit já anima seguindo a posição virtual — não precisa de reparentação nenhuma pra isso.
  const columnKeyboardCoordinateGetter = useCallback(
    (
      event: KeyboardEvent,
      {
        context,
      }: {
        context: {
          droppableRects: Map<
            string | number,
            { left: number; top: number; width: number; height: number }
          >;
        };
      },
    ) => {
      if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return undefined;
      const currentStatus = keyboardDragStatusRef.current;
      if (!currentStatus) return undefined;

      const currentIndex = columns.indexOf(currentStatus);
      if (currentIndex === -1) return undefined;
      const nextIndex = event.code === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
      const nextStatus = columns[nextIndex];
      if (!nextStatus) return undefined; // já está na primeira/última coluna

      const rect = context.droppableRects.get(nextStatus);
      if (!rect) return undefined;

      event.preventDefault();
      keyboardDragStatusRef.current = nextStatus;
      // Mira no CENTRO do retângulo da coluna, não perto do topo: closestCenter compara
      // centro-a-centro contra TODOS os droppables (cada card E cada coluna inteira). Um ponto
      // perto do topo fica geometricamente mais perto do centro de um card vizinho (retângulo
      // pequeno) do que do centro da própria coluna (retângulo alto) — fazia o alvo "grudar" na
      // coluna anterior por 1-2 teclas antes de reagir, ou pular coluna vazia. Mirando no centro
      // real da coluna, ela sempre vence essa comparação pra ela mesma.
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    },
    [columns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: columnKeyboardCoordinateGetter,
      keyboardCodes: KEYBOARD_DRAG_CODES,
    }),
  );

  /** Resolve a coluna de destino a partir do `over.id` do dnd-kit — pode ser o id da própria
        coluna (drop numa coluna vazia) ou o id de um card dentro dela (drop entre dois cards). */
  const resolveStatusFromOverId = useCallback(
    (overId: string | number): LeadStatus | null => {
      if (typeof overId === 'string' && columns.includes(overId as LeadStatus)) {
        return overId as LeadStatus;
      }
      const overLead = leads.find((l) => l.id === overId);
      return overLead ? overLead.status : null;
    },
    [leads, columns],
  );

  const leadLabel = useCallback((lead: Lead | null | undefined) => {
    if (!lead) return 'Card';
    return (
      lead.company?.tradeName || lead.company?.legalName || lead.contact?.name || 'Lead sem empresa'
    );
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const lead = leads.find((l) => l.id === active.id);
      if (lead) {
        setActiveLead(lead);
        keyboardDragStatusRef.current = lead.status;
        SoundFX.play('focus');
      }
    },
    [leads],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveLead(null);
      keyboardDragStatusRef.current = null;

      if (!over) return;

      const leadId = active.id;
      const targetStatus = resolveStatusFromOverId(over.id);
      if (!targetStatus) return;

      const currentLead = leads.find((l) => l.id === leadId);
      if (currentLead && currentLead.status !== targetStatus) {
        if (targetStatus === 'Negócios Ganhos' || targetStatus === 'Convertido em Oportunidade') {
          SoundFX.play('success');
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: [
              '--color-brand-primary',
              '--color-brand-secondary',
              '--color-brand-accent',
              '--color-success',
              '--color-info',
            ].map((token) =>
              getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
            ),
            disableForReducedMotion: true,
          });
        } else {
          SoundFX.play('confirm');
        }

        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, status: targetStatus } : lead)),
        );

        try {
          // /api/leads/:id só existe como PUT (lead.routes.ts) — api.patch mandava PATCH,
          // que o backend nunca registrou (404 silencioso engolido pelo catch abaixo).
          // Resultado real: mover um card no Kanban nunca persistia, sempre revertia com o
          // toast "a alteração foi desfeita" (achado do teste E2E de drag-and-drop).
          await api.put(`/api/leads/${leadId}`, { status: targetStatus });
        } catch (error: any) {
          SoundFX.play('error');
          clientLogger.error({ err: error }, 'Error updating lead status');
          toast.error(
            `Não foi possível mover ${leadLabel(currentLead)} — a alteração foi desfeita.`,
          );
          fetchLeads();
        }
      }
    },
    [leads, setLeads, fetchLeads, resolveStatusFromOverId, leadLabel],
  );

  const handleDragCancel = useCallback(() => {
    setActiveLead(null);
    keyboardDragStatusRef.current = null;
  }, []);

  // Announcements acessíveis do dnd-kit — o default ("Draggable item l2...") expõe o id
  // interno do lead, que não diz nada pro usuário. Trocado por nome da empresa + coluna,
  // sem introduzir dependência nova (accessibility.announcements é nativo do @dnd-kit/core).
  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const lead = leads.find((l) => l.id === active.id);
        return `${leadLabel(lead)} selecionado para mover, coluna atual ${lead?.status ?? ''}. Use as setas para escolher o destino, espaço para soltar, Esc para cancelar.`;
      },
      onDragOver({ active, over }) {
        const lead = leads.find((l) => l.id === active.id);
        const status = over ? resolveStatusFromOverId(over.id) : null;
        if (!status) return `${leadLabel(lead)} não está sobre nenhuma coluna.`;
        return `${leadLabel(lead)} sobre a coluna ${status}.`;
      },
      onDragEnd({ active, over }) {
        const lead = leads.find((l) => l.id === active.id);
        const status = over ? resolveStatusFromOverId(over.id) : null;
        if (!status) return `Movimentação de ${leadLabel(lead)} cancelada.`;
        return `${leadLabel(lead)} movido para ${status}.`;
      },
      onDragCancel({ active }) {
        const lead = leads.find((l) => l.id === active.id);
        // `leads` nunca é tocado durante o drag (só no drop, em handleDragEnd), então
        // lead.status aqui já é a coluna de origem, sem precisar de nenhuma ref à parte.
        return `Movimentação de ${leadLabel(lead)} cancelada. O card permanece em ${lead?.status ?? ''}.`;
      },
    }),
    [leads, leadLabel, resolveStatusFromOverId],
  );

  return {
    activeLead,
    sensors,
    announcements,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
