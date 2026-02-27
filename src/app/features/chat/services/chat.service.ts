import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Conversation,
  ChatMessage,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ChatService extends BaseApiService {
  protected readonly basePath = '/chat';

  getConversations(): Observable<ApiResponse<Conversation[]>> {
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations`);
  }

  getMessages(conversationId: string, params: PaginationParams): Observable<PaginatedResponse<ChatMessage>> {
    return this.http.get<PaginatedResponse<ChatMessage>>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      { params: this.buildParams(params) }
    );
  }

  createConversation(participantId: string, applicationId?: string): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations`, {
      participantId, applicationId
    });
  }

  markAsRead(conversationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/conversations/${conversationId}/read`, {});
  }
}
