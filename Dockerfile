# Stage 1 - Build React
# Use Debian-based image for better compatibility with native/optional deps in CI
FROM node:20-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=development
ENV CI=true

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

COPY . .
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm run build

# Stage 2 - Production Image
FROM nginx:alpine

# Hapus config default
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy hasil build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]