FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY . .
ENV PORT=3002
ENV DB_PATH=/data/booking.sqlite
EXPOSE 3002
CMD ["node", "index.mjs"]
