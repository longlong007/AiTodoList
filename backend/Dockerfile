# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
# 复制字体文件（nest-cli.json 应该已经复制到 dist/src/assets/fonts/）
# 但为了确保，我们也直接复制源文件
COPY --from=builder /app/src/assets ./src/assets

EXPOSE 3000

CMD ["node", "dist/main"]

