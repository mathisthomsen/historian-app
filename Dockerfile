# Use the official Node.js runtime as the base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Set environment variable to ignore Prisma checksum errors
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Install dependencies with memory optimizations
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Generate Prisma client
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Add build arguments for database URLs
ARG DATABASE_URL
ARG DATABASE_URL_UNPOOLED
ARG RESEND_API_KEY

# Set environment variables for build
ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_URL_UNPOOLED=$DATABASE_URL_UNPOOLED
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Set default values if not provided
ENV DATABASE_URL=${DATABASE_URL:-postgresql://historian:historian@postgres:5432/historian}
ENV DATABASE_URL_UNPOOLED=${DATABASE_URL_UNPOOLED:-postgresql://historian:historian@postgres:5432/historian}

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY app ./app
COPY public ./public
COPY next.config.mjs ./
COPY tsconfig.json ./

# Build the application with memory optimizations
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build:no-db

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"] 