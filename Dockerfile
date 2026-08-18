# Multi-stage production build for the Investment Property Analyzer.
# Builds a self-contained image — no Node/Postgres needs to be installed
# on the host, which matches a Docker-Compose-based VPS setup.

FROM node:20-alpine AS deps
WORKDIR /app
# node:20-alpine ships no OpenSSL at all, which breaks Prisma's engine
# auto-detection (it silently falls back to a guess that may not match
# the binary it downloaded) — install it explicitly, the fix Prisma's
# own docs recommend for Alpine-based images.
RUN apk add --no-cache openssl
COPY package.json package-lock.json .npmrc ./
# --ignore-scripts: package.json's postinstall runs `prisma generate`,
# which needs prisma/schema.prisma — not copied in yet at this layer
# (deliberately, so this layer caches across source changes). The
# builder stage runs `prisma generate` explicitly after the full
# COPY . ., so skipping it here is correct, not just a workaround.
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL only needs to be a syntactically valid Postgres URL at
# build time — Prisma's client generation and `next build` don't
# actually connect to a database, they just need the env var present.
# See DEPLOYMENT.md for why this is safe.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/build_placeholder"
ENV NEXTAUTH_SECRET="build-placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Needed here too: docker-entrypoint.sh runs `prisma migrate deploy` at
# container startup, which needs OpenSSL just as much as build time did.
RUN apk add --no-cache openssl

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
