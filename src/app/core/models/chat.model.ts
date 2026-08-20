import { UserRole } from '../enums';

export interface Conversation {
  id: string;
  type?: 'direct' | 'group' | 'project';
  name?: string;
  description?: string;
  projectId?: string;
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

export interface ChatMessageAttachment {
  id?: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  thumbnailUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system' | 'link';
  fileUrl?: string;
  fileName?: string;
  attachments?: ChatMessageAttachment[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
