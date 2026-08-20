import {
  signalStore, withState, withMethods, withComputed, withHooks, patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { ChatService } from '../features/chat/services/chat.service';
import { ChatRealtimeService } from '../core/services/chat-realtime.service';
import { AuthStore } from './auth.store';

interface ChatUnreadState {
  /** unreadCount por conversationId. */
  byConversation: Record<string, number>;
  /** unreadCount por projectId (para el workspace). */
  byProject: Record<string, number>;
  isLoading: boolean;
}

/**
 * Contadores de mensajes no leídos por conversación y proyecto. Alimentado por
 * la carga inicial de `getConversations()` más `onMessage()` del socket.
 */
export const ChatUnreadStore = signalStore(
  { providedIn: 'root' },
  withState<ChatUnreadState>({
    byConversation: {},
    byProject: {},
    isLoading: false,
  }),

  withComputed((store) => ({
    total: computed(() =>
      Object.values(store.byConversation()).reduce((sum, n) => sum + n, 0),
    ),
    hasUnread: computed(() =>
      Object.values(store.byConversation()).some((n) => n > 0),
    ),
  })),

  withMethods((store) => {
    const chatService = inject(ChatService);

    return {
      /** Se llama tras login o al abrir el sidebar. */
      loadInitial(): void {
        patchState(store, { isLoading: true });
        chatService.getConversations().subscribe({
          next: (res: any) => {
            const conversations = res?.data ?? res ?? [];
            const byConv: Record<string, number> = {};
            const byProj: Record<string, number> = {};
            for (const c of conversations) {
              const unread = c.unreadCount ?? 0;
              byConv[c.id] = unread;
              if (c.projectId || c.applicationId) {
                const pid = c.projectId ?? c.applicationId;
                byProj[pid] = (byProj[pid] ?? 0) + unread;
              }
            }
            patchState(store, { byConversation: byConv, byProject: byProj, isLoading: false });
          },
          error: () => patchState(store, { isLoading: false }),
        });
      },

      incrementForConversation(conversationId: string, projectId?: string | null): void {
        const byConv = { ...store.byConversation() };
        byConv[conversationId] = (byConv[conversationId] ?? 0) + 1;
        const byProj = { ...store.byProject() };
        if (projectId) byProj[projectId] = (byProj[projectId] ?? 0) + 1;
        patchState(store, { byConversation: byConv, byProject: byProj });
      },

      clearConversation(conversationId: string, projectId?: string | null): void {
        const previous = store.byConversation()[conversationId] ?? 0;
        if (previous === 0) return;
        const byConv = { ...store.byConversation() };
        delete byConv[conversationId];
        const byProj = { ...store.byProject() };
        if (projectId && byProj[projectId]) {
          byProj[projectId] = Math.max(0, byProj[projectId] - previous);
          if (byProj[projectId] === 0) delete byProj[projectId];
        }
        patchState(store, { byConversation: byConv, byProject: byProj });
      },

      getByProject(projectId: string | null | undefined): number {
        if (!projectId) return 0;
        return store.byProject()[projectId] ?? 0;
      },
    };
  }),

  withHooks({
    onInit(store) {
      const auth = inject(AuthStore);
      const realtime = inject(ChatRealtimeService);

      // El socket puede aún no estar conectado; ensureConnected() se dispara
      // dentro de ChatRealtimeService en cualquier operación relevante.
      realtime.onMessage().subscribe((msg: any) => {
        if (!msg?.conversationId) return;
        // Ignorar los mensajes propios: no cuentan como no leídos para uno mismo.
        const currentUserId = auth.user()?.id;
        if (currentUserId && msg.senderId === currentUserId) return;
        store.incrementForConversation(msg.conversationId, msg.projectId ?? null);
      });
    },
  }),
);
