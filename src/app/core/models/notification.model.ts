import { NotificationType } from '../enums';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  chatNotifications: boolean;
  applicationUpdates: boolean;
  projectRecommendations: boolean;
  evaluationAlerts: boolean;
  weeklyDigest: boolean;
}
