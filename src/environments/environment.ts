// environments/environment.ts
// El proyecto no tiene configurado `fileReplacements` en angular.json, así que
// este archivo es el único que se usa siempre (también en el build de producción)
// — environment.prod.ts no se aplica nunca. Por eso apiUrl/wsUrl se calculan en
// runtime a partir del host real desde el que se sirve la app (en vez de dejar
// un host fijo hardcodeado, que rompía el acceso desde cualquier IP/dominio
// distinto al usado durante el build).
const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';
const httpProtocol = isBrowser && window.location.protocol === 'https:' ? 'https:' : 'http:';
const wsProtocol = httpProtocol === 'https:' ? 'wss:' : 'ws:';
// El api-gateway se publica siempre en el puerto 3000 del mismo host que sirve el frontend.
const gatewayPort = 3000;

export const environment = {
  production: false,
  apiUrl: `${httpProtocol}//${host}:${gatewayPort}/api/v1`,
  wsUrl: `${wsProtocol}//${host}:${gatewayPort}`,
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
