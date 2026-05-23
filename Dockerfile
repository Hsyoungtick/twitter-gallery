# 阶段1：构建前端
FROM node:22-alpine AS frontend-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# 阶段2：安装后端依赖
FROM node:22-alpine AS backend-deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/backend

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 阶段3：生产镜像
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

COPY --from=frontend-builder /app/dist ./dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5173
ENV AUTO_REFRESH_INTERVAL=3600000

EXPOSE 5173

VOLUME ["/app/data"]

CMD ["node", "backend/index.js"]
