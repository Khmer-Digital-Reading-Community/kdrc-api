## Development stage used by docker-compose (hot reload and full dev dependencies)
FROM node:22-alpine AS development

WORKDIR /app

# Install all dependencies (including dev dependencies)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source for local development container
COPY . .
RUN npm run build

EXPOSE 3000

# Start Nest in watch mode for local development
CMD ["npm", "run", "start:dev"]

## Builder stage compiles TypeScript into dist
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

## Runtime stage contains only production dependencies and built artifacts
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install production-only dependencies for a smaller runtime image
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Run the app as a non-root user for better container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
