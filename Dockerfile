# SAFISAUDE - Backend Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build NestJS application
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to nestjs user
RUN chown -R nestjs:nodejs /app

# Switch to nestjs user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Create startup script to disable IPv6 and start app
RUN echo '#!/bin/sh\n\
sysctl -w net.ipv6.conf.all.disable_ipv6=1 2>/dev/null || true\n\
sysctl -w net.ipv6.conf.default.disable_ipv6=1 2>/dev/null || true\n\
node --dns-result-order=ipv4first dist/main\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start NestJS application
CMD ["/app/entrypoint.sh"]
