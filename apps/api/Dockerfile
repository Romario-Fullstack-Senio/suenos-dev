FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared-kernel/package*.json ./shared-kernel/
RUN npm ci
COPY shared-kernel/ ./shared-kernel/
COPY apps/api/ ./apps/api/
RUN cd shared-kernel && npm run build
RUN cd apps/api && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared-kernel/dist ./shared-kernel/dist
COPY --from=builder /app/shared-kernel/package.json ./shared-kernel/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]