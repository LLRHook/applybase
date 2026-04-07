FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci

COPY . .
RUN npm run build -w @jobsearch/client

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app .
RUN npm install --ignore-scripts
RUN mkdir -p /app/data

EXPOSE 44455

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/jobsearch.db

CMD ["sh", "-c", "npx tsx packages/server/src/db/migrate.ts && npx tsx scripts/seed.ts && npx tsx packages/server/src/index.ts"]
