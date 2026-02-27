import { Routes } from '@angular/router';

export const CHAT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/chat-container/chat-container.component').then(
        (m) => m.ChatContainerComponent
      ),
  },
];
