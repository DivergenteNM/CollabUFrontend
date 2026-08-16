import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthStore } from '../../../state/auth.store';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Conversation,
  ChatMessage,
  ChatMessageAttachment,
} from '../../../core/models';
import { StorageService } from '../../../core/services/storage.service';
import { forkJoin, of, switchMap, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService extends BaseApiService {
  protected readonly basePath = '/chat';

  private readonly storageService = inject(StorageService);
  private readonly authStore = inject(AuthStore);

  getConversations(): Observable<ApiResponse<Conversation[]>> {
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations`);
  }

  getConversation(conversationId: string): Observable<ApiResponse<Conversation>> {
    return this.http.get<ApiResponse<Conversation>>(
      `${this.apiUrl}/conversations/${conversationId}`,
    );
  }

  getMessages(conversationId: string, params: PaginationParams): Observable<PaginatedResponse<ChatMessage>> {
    return this.http.get<PaginatedResponse<ChatMessage>>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      { params: this.buildParams(params) }
    );
  }

  createConversation(
    participantIds: string[],
    type: 'direct' | 'group' | 'project' = 'direct',
    projectId?: string,
    initialMessage?: string
  ): Observable<ApiResponse<Conversation>> {
    // Filtramos UUIDs válidos y dropeamos campos undefined/null:
    // el DTO backend rechaza participantIds vacíos, projectId no-UUID y
    // initialMessage vacío. Enviar el body limpio evita 400s.
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const currentUserId = this.authStore.user()?.id ?? null;
    // Backend rechaza si el creador está en participantIds (duplica participant).
    // Se filtra por si acaso el caller no lo excluyó.
    const cleanIds = Array.from(new Set(
      (participantIds ?? [])
        .filter((id) => uuidRe.test(id))
        .filter((id) => id !== currentUserId),
    ));
    const body: Record<string, any> = { participantIds: cleanIds, type };
    if (projectId && uuidRe.test(projectId)) body['projectId'] = projectId;
    if (initialMessage && initialMessage.trim()) body['initialMessage'] = initialMessage.trim();
    return this.http.post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations`, body);
  }

  archiveConversation(conversationId: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/conversations/${conversationId}/archive`, {},
    );
  }

  markAsRead(conversationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/conversations/${conversationId}/read`, {});
  }

  sendMessage(
    conversationId: string,
    content: string,
    attachments?: ChatMessageAttachment[],
  ): Observable<ApiResponse<ChatMessage>> {
    const body: any = { content };
    if (attachments && attachments.length > 0) {
      body.attachments = attachments;
      body.type = attachments[0].mimeType?.startsWith('image/') ? 'image' : 'file';
    }
    return this.http.post<ApiResponse<ChatMessage>>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      body,
    );
  }

  /**
   * Sube los archivos a Storage Service con categoría `chat_attachment` y
   * envía un único mensaje que los referencia. Storage devuelve un fileId +
   * URL por archivo; se transforman a `ChatMessageAttachment` antes del POST.
   */
  sendMessageWithFiles(
    conversationId: string,
    content: string,
    files: File[],
  ): Observable<ApiResponse<ChatMessage>> {
    if (files.length === 0) {
      return this.sendMessage(conversationId, content);
    }
    const uploads = files.map((f) => this.storageService.upload(f, 'chat_attachment', false));
    return forkJoin(uploads).pipe(
      switchMap((results) => {
        const attachments: ChatMessageAttachment[] = results.map((r, i) => ({
          fileUrl: r.data!.fileId,      // Storage expone la descarga vía fileId
          fileName: files[i].name,
          fileSizeBytes: files[i].size,
          mimeType: files[i].type || undefined,
        }));
        return this.sendMessage(conversationId, content, attachments);
      }),
    );
  }

  editMessage(messageId: string, content: string): Observable<ApiResponse<ChatMessage>> {
    return this.http.put<ApiResponse<ChatMessage>>(
      `${this.apiUrl}/messages/${messageId}`,
      { content },
    );
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/messages/${messageId}`);
  }

  addReaction(messageId: string, emoji: string): Observable<ApiResponse<ChatMessage>> {
    return this.http.post<ApiResponse<ChatMessage>>(
      `${this.apiUrl}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {},
    );
  }

  removeReaction(messageId: string, emoji: string): Observable<ApiResponse<ChatMessage>> {
    return this.http.delete<ApiResponse<ChatMessage>>(
      `${this.apiUrl}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    );
  }

  searchMessages(query: string): Observable<PaginatedResponse<ChatMessage>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<PaginatedResponse<ChatMessage>>(
      `${this.apiUrl}/search`, { params },
    );
  }
}
