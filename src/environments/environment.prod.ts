// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://collab-u.udenar.edu.co/api/v1',
  wsUrl: 'wss://collab-u.udenar.edu.co',
  wsNotificationsPath: '/ws/notifications',
  wsChatPath: '/ws/chat',
  defaultLanguage: 'es',
  tokenKey: 'collabu_access_token',
  refreshTokenKey: 'collabu_refresh_token',
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};
