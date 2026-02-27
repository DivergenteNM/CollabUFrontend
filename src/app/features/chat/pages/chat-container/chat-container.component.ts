import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
  OnInit, OnDestroy,
} from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ApiResponse, Conversation } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { UiStore } from '../../../../state/ui.store';
import { ChatRealtimeService } from '../../../../core/services/chat-realtime.service';
import { ChatSearchComponent } from '../../components/chat-search/chat-search.component';
import { ConversationListComponent } from '../../components/conversation-list/conversation-list.component';

@Component({
  selector: 'app-chat-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ChatSearchComponent, ConversationListComponent],
  template: `
    <div class="chat-layout" [class.mobile]="uiStore.isMobile()">
      <aside class="chat-layout__sidebar"
        [class.hidden-mobile]="uiStore.isMobile() && hasActiveConversation()">
        <app-chat-search (searchChange)="searchQuery.set($event)" />
        <app-conversation-list
          [conversations]="filteredConversations()"
          [activeId]="activeConversationId()"
          [currentUserId]="authStore.user()?.id ?? ''"
          (select)="onSelectConversation($event)" />
      </aside>

      <section class="chat-layout__main"
        [class.hidden-mobile]="uiStore.isMobile() && !hasActiveConversation()">
        <router-outlet />
      </section>
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; }

    .chat-layout {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    .chat-layout__sidebar {
      width: 340px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
    }

    .chat-layout__main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .chat-layout.mobile .chat-layout__sidebar {
      width: 100%;
    }

    .chat-layout.mobile .chat-layout__main {
      width: 100%;
    }

    .hidden-mobile {
      display: none !important;
    }
  `,
})
export class ChatContainerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);
  readonly uiStore = inject(UiStore);
  private readonly chatRealtime = inject(ChatRealtimeService);

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

  readonly filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const convs = this.conversations();
    if (!query) return convs;

    const currentUserId = this.authStore.user()?.id ?? '';
    return convs.filter(c => {
      const other = c.participants.find(p => p.userId !== currentUserId) ?? c.participants[0];
      return other?.displayName?.toLowerCase().includes(query)
        || c.lastMessage?.content?.toLowerCase().includes(query);
    });
  });

  readonly hasActiveConversation = computed(() => !!this.activeConversationId());

  ngOnInit(): void {
    this.chatRealtime.connect();

    // Refresh conversations when new messages arrive
    this.realtimeSub = this.chatRealtime.onMessage().subscribe(() => {
      this.conversationsResource.reload();
    });

    // Extract active conversation from child route
    const childRoute = this.route.firstChild;
    if (childRoute) {
      const params = childRoute.snapshot.params;
      if (params['conversationId']) {
        this.activeConversationId.set(params['conversationId']);
      }
    }
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
