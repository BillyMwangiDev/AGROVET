# ── Stage 1: Build React App ────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Pass API URL at build time so Vite can embed it
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_WHATSAPP_PHONE
ENV VITE_WHATSAPP_PHONE=$VITE_WHATSAPP_PHONE

# Install dependencies first (better layer caching)
COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the app source and build
COPY app/ ./
RUN pnpm run build

# ── Stage 2: Serve with NGINX ───────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy custom NGINX configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from Stage 1
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
