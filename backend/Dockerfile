FROM node:20-alpine

WORKDIR /app

COPY backend/package.json ./package.json
RUN npm install --omit=dev

COPY backend/src ./src
COPY backend/db ./db
COPY src/libs/api.json ./data/api.json

ENV NODE_ENV=production
ENV PORT=8080
ENV PIZZA_SEED_FILE=/app/data/api.json

EXPOSE 8080

CMD ["node", "src/server.js"]
