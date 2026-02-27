export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  timezone: string;
  language: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  chatNotifications: boolean;
  weeklyDigest: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}
