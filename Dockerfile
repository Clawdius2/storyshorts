FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma/ ./prisma/
RUN npm ci --omit=dev

# Generate Prisma client
FROM base AS builder
WORKDIR /app
COPY prisma/ ./prisma/
COPY package.json package-lock.json ./
RUN npm ci
RUN npx prisma generate

# Build Next.js
COPY next.config.ts tsconfig.json ./
COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
COPY public/ ./public/
COPY middleware.ts ./
RUN npm run build

# Final runtime image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/.next/ ./.next/
COPY --from=builder /app/public/ ./public/
COPY --from=deps /app/node_modules/ ./node_modules/
COPY prisma/ ./prisma/

# Expose port
EXPOSE 3000

# Migration + start
CMD ["sh", "-c", "npx prisma db push --skip-generate && next start"]
