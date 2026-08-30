import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
  OnInit, OnDestroy,
} from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
