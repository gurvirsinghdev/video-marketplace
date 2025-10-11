# Stage 1: Builder
FROM oven/bun:1.3 AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy all source code and environment file
COPY . .
COPY docker.env ./.env

# Build the project
RUN --mount=type=secret,id=SST_RESOURCE_VidIDProAuthServer,env=SST_RESOURCE_VidIDProAuthServer \
  bun run build

# Stage 2: Production
FROM oven/bun:1.3

WORKDIR /app

# Copy build artifacts and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env ./.env

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "server.js"]
