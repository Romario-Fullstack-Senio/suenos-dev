# ============================================================
# Stage 1: Install ALL workspace dependencies (cached layer)
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy every package.json so npm can resolve the workspace graph
COPY package.json ./
COPY shared-kernel/package.json ./shared-kernel/
COPY apps/api/package.json ./apps/api/

# Install ALL dependencies across every workspace (devDeps included for build)
RUN npm install

# ============================================================
# Stage 2: Build shared-kernel then API
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Reuse the full node_modules tree from the install stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source for both workspaces + root package.json (workspaces field)
COPY package.json ./
COPY shared-kernel/ ./shared-kernel/
COPY apps/api/ ./apps/api/

# Build shared-kernel first (the API imports @suenos-dev/shared-kernel)
RUN npm run build --workspace=shared-kernel

# Build the API (nest build)
RUN npm run build --workspace=apps/api

# ============================================================
# Stage 3: Production image (minimal, non-root)
# ============================================================
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 suenos \
 && adduser --system  --uid 1001 suenos

WORKDIR /app

# --- API dist + package.json ---
COPY --from=builder --chown=suenos:suenos /app/apps/api/dist  ./dist
COPY --from=builder --chown=suenos:suenos /app/apps/api/package.json ./

# --- Production node_modules (full workspace, then prune devDeps) ---
COPY --from=builder --chown=suenos:suenos /app/node_modules ./node_modules

# --- Shared-kernel build output (required at runtime) ---
RUN mkdir -p node_modules/@suenos-dev/shared-kernel
COPY --from=builder --chown=suenos:suenos /app/shared-kernel/dist    ./node_modules/@suenos-dev/shared-kernel/dist
COPY --from=builder --chown=suenos:suenos /app/shared-kernel/package.json ./node_modules/@suenos-dev/shared-kernel/

# Strip devDependencies from the final image
RUN npm prune --omit=dev 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

EXPOSE 3001
USER suenos
CMD ["node", "dist/main.js"]
