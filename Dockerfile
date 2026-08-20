# Build de producción real: Angular SSR (Angular 21) + servidor Express.
# NO es "ng serve". Sirve dist/frontend/server/server.mjs (Node + Express), con
# browser bundle prerenderizado servido como estáticos desde dist/frontend/browser.
ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:${NODE_VERSION} AS production
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app
COPY --from=builder /app/dist/frontend ./dist/frontend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||4000)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "dist/frontend/server/server.mjs"]
