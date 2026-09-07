FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
ARG GIT_SHA=local
ENV NODE_ENV=production
ENV GIT_SHA=$GIT_SHA
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
