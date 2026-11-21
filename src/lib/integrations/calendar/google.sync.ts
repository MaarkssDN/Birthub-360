export interface LocalCalendarMeeting {
  localId: string;
  externalGoogleEventId: string;
  status: 'SCHEDULED' | 'CANCELLED';
}

export interface RemoteGoogleCalendarEvent {
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export function reconcileGoogleCalendarDeletedEvents(params: {
  localMeetings: readonly LocalCalendarMeeting[];
  remoteEvents: readonly RemoteGoogleCalendarEvent[];
}): {
  cancelledLocalIds: string[];
  activeLocalIds: string[];
} {
  const remoteById = new Map<string, RemoteGoogleCalendarEvent>();
  for (const ev of params.remoteEvents) {
    remoteById.set(ev.id, ev);
  }

  const cancelledLocalIds: string[] = [];
  const activeLocalIds: string[] = [];

  for (const local of params.localMeetings) {
    if (local.status === 'CANCELLED') {
      continue;
    }
    const remote = remoteById.get(local.externalGoogleEventId);
    // Se o evento sumiu do Google Calendar ou foi marcado como cancelled quando o webhook estava expirado
    if (!remote || remote.status === 'cancelled') {
      cancelledLocalIds.push(local.localId);
    } else {
      activeLocalIds.push(local.localId);
    }
  }

  return { cancelledLocalIds, activeLocalIds };
}
