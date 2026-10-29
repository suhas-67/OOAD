# Multi-stage Dockerfile for TransitBook Full-Stack System
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /app/backend/dist ./dist

WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/dist ./dist

WORKDIR /app/backend
EXPOSE 5000

CMD ["node", "dist/server.js"]
