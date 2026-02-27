import { UserRole } from '../enums';

export interface Conversation {
  id: string;
  applicationId?: string;
  participants: ConversationParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
