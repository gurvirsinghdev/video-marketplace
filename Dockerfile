# State 1: Building the project.
# Using Node v22.X.X
FROM node:22-alpine AS builder

# Installing 'pnpm'
RUN corepack enable && corepack prepare pnpm@latest --activate

# Setting the working directory for the project.
WORKDIR /app

# Installing dependencies.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copying the source code to the container.
COPY . . 
COPY docker.env ./.env

# Building the project.
RUN pnpm build


# Stage 2: Starting the webserver.
FROM node:22-alpine

# Setting the working directory for the container.
WORKDIR /app

# Copying the build to the container.
COPY --from=builder ./app/.next/standalone ./
COPY --from=builder ./app/.next/static ./.next/static
COPY --from=builder ./app/public ./public 
COPY --from=builder ./app/.env ./.env

# Exposing the application PORT
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Starting the server.
CMD [ "node", "server.js" ]