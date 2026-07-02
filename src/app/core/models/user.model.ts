export interface UserProfile {
  id: string;
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneCountryCode?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  department?: string;
  country?: string;
  address?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  profileCompleteness: number;
  isOnboardingComplete: boolean;
  lastLoginAt?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  chatNotifications: boolean;
  weeklyDigest: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}
