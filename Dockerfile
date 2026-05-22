FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY public ./public
COPY index.html ./
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY .eslintrc.js ./
COPY .prettier* ./

# Build frontend and backend
RUN npm run build:production

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:production"]
