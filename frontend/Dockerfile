FROM node:25-alpine3.22

WORKDIR /app
COPY . .
RUN npm install -g pnpm@latest-10
RUN pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
EXPOSE 3000
