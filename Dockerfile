FROM node:24.11.1-alpine

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PORT=3001

WORKDIR /app
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

ENV NODE_ENV=production

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" >/dev/null || exit 1

USER node
CMD ["pnpm", "start"]
