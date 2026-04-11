# Production resilient lightweight Node.js image
FROM node:18-alpine

# Set secure working directory
WORKDIR /usr/src/app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install exactly what is specified in package-lock.json
RUN npm ci --only=production

# Copy application logic
COPY . .

# Expose standard API port
EXPOSE 3000

# We use an edge script to run migrations fully before server execution
RUN echo "npm run migrate && node server.js" > start.sh
RUN chmod +x start.sh

# Run as an unprivileged user for security
USER node

# Execute server
CMD ["sh", "start.sh"]
