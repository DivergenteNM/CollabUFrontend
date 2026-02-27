import { Routes } from '@angular/router';

export const CHAT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/chat-container/chat-container.component').then(
        (m) => m.ChatContainerComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/chat-empty/chat-empty.component').then(
            (m) => m.ChatEmptyComponent
          ),
      },
      {
        path: ':conversationId',
        loadComponent: () =>
          import('./pages/chat-room/chat-room.component').then(
            (m) => m.ChatRoomComponent
          ),
      },
    ],
  },
];
