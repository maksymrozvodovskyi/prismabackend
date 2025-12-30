FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3000

CMD ["node", "dist/server.js"]