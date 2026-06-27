# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx build api

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist/apps/api ./dist
COPY --from=build /app/node_modules ./node_modules

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
