# Stage 1 - Build React
# Use Debian-based image for better compatibility with native/optional deps in CI
FROM node:20-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=development
ENV CI=true

COPY package.json package-lock.json ./
RUN set -eux; \
		npm ci --include=dev --no-audit --no-fund; \
		ROLLUP_VERSION="$(node -p "require('./package-lock.json').packages['node_modules/rollup']?.version || ''")"; \
		if [ -n "$ROLLUP_VERSION" ]; then \
			ARCH="$(node -p "process.arch")"; \
			if [ "$ARCH" = "x64" ]; then \
				if [ ! -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then \
					npm i --no-save --no-audit --no-fund "@rollup/rollup-linux-x64-gnu@${ROLLUP_VERSION}"; \
				fi; \
			elif [ "$ARCH" = "arm64" ]; then \
				if [ ! -d "node_modules/@rollup/rollup-linux-arm64-gnu" ]; then \
					npm i --no-save --no-audit --no-fund "@rollup/rollup-linux-arm64-gnu@${ROLLUP_VERSION}"; \
				fi; \
			fi; \
		fi

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