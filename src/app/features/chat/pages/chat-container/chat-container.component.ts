import {
  Component, ChangeDetectionStrategy, inject, signal, computed, effect,
  OnInit, OnDestroy,
} from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Conversation } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { UiStore } from '../../../../state/ui.store';
import { ChatRealtimeService } from '../../../../core/services/chat-realtime.service';
import { ProjectService } from '../../../projects/services/project.service';
import { ChatSearchComponent } from '../../components/chat-search/chat-search.component';
import { ConversationListComponent } from '../../components/conversation-list/conversation-list.component';

@Component({
  selector: 'app-chat-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MatIconModule, MatButtonModule, ChatSearchComponent, ConversationListComponent],
  templateUrl: './chat-container.component.html',
  styleUrl: './chat-container.component.scss',
})
export class ChatContainerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);
  readonly uiStore = inject(UiStore);
  private readonly chatRealtime = inject(ChatRealtimeService);
  private readonly projectService = inject(ProjectService);

  readonly searchQuery = signal('');
  readonly activeConversationId = signal('');

  private realtimeSub?: Subscription;

  readonly conversationsResource = httpResource<ApiResponse<Conversation[]>>(
    () => ({
      url: `${environment.apiUrl}/chat/conversations`,
    }),
  );

  readonly conversations = computed(() =>
    this.conversationsResource.value()?.data ?? [],
  );

  /**
   * Título del proyecto por `projectId`, resuelto en el frontend: el
   * servicio de chat no envuelve la respuesta con esa información, así que
   * se consulta una vez por proyecto contra `GET /projects/:id` (endpoint
   * público, ya usado en el detalle de proyecto) para poder mostrarlo como
   * nombre principal de la conversación en vez del nombre de la otra
   * persona. Sin esto, dos conversaciones con la misma empresa por dos
   * proyectos distintos son indistinguibles en la lista.
   */
  readonly projectTitles = signal<Map<string, string>>(new Map());
  private readonly requestedProjectIds = new Set<string>();

  readonly filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const convs = this.conversations();
    if (!query) return convs;

    const currentUserId = this.authStore.user()?.id ?? '';
    const titles = this.projectTitles();
    return convs.filter(c => {
      const other = c.participants.find(p => p.userId !== currentUserId) ?? c.participants[0];
      const title = c.projectId ? titles.get(c.projectId) : undefined;
      return other?.displayName?.toLowerCase().includes(query)
        || title?.toLowerCase().includes(query)
        || c.lastMessage?.content?.toLowerCase().includes(query);
    });
  });

  readonly hasActiveConversation = computed(() => !!this.activeConversationId());

  constructor() {
    effect(() => {
      const convs = this.conversations();
      const pending = [...new Set(
        convs.map((c) => c.projectId).filter((id): id is string =>
          !!id && !this.requestedProjectIds.has(id)),
      )];
      pending.forEach((projectId) => {
        this.requestedProjectIds.add(projectId);
        this.projectService.getById(projectId).subscribe({
          next: (res) => {
            const title = (res as any)?.data?.title ?? (res as any)?.title;
            if (!title) return;
            this.projectTitles.update((map) => new Map(map).set(projectId, title));
          },
          error: () => {
            // Proyecto no accesible o eliminado — la conversación conserva
            // el nombre de la otra persona como respaldo (ver conversation-display.ts).
          },
        });
      });
    });
  }

  ngOnInit(): void {
    this.chatRealtime.connect();

    // Refresh conversations when new messages arrive
    this.realtimeSub = this.chatRealtime.onMessage().subscribe(() => {
      this.conversationsResource.reload();
    });

    // Extract active conversation from child route
    const updateActiveFromRoute = () => {
      const childRoute = this.route.firstChild;
      if (childRoute) {
        const params = childRoute.snapshot.params;
        this.activeConversationId.set(params['conversationId'] ?? '');
      } else {
        this.activeConversationId.set('');
      }
    };

    updateActiveFromRoute();

    this.realtimeSub?.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => updateActiveFromRoute())
    );
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
    this.chatRealtime.disconnect();
  }

  onSelectConversation(id: string): void {
    this.activeConversationId.set(id);
    this.router.navigate(['chat', id]);
  }
}
