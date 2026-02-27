// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'ws://localhost:3000',
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
