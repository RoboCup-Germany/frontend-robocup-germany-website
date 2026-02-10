# Build Stage 1

FROM node:22-alpine AS build
WORKDIR /app

ENV CI=true
RUN corepack enable

# Copy package.json and your lockfile, here we add pnpm-lock.yaml for illustration
#COPY src/package.json pnpm-lock.yaml .npmrc ./
COPY src/package.json src/.npmrc src/pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# Copy the entire project
COPY /src ./

# Install dependencies
RUN pnpm install --offline

# Build the project
RUN npm run build

# Build Stage 2

FROM node:22-alpine
WORKDIR /app

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output/ ./

# Change the port and host
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]