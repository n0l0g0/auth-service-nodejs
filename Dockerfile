FROM node:22-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (ไม่ใช้ npm ci เพราะไม่มี package-lock.json)
RUN npm install --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1000890000 -S nodejs && \
    adduser -S nodejs -u 1000890000

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8085

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8085/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"] 