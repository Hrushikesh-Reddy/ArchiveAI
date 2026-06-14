FROM node:25-alpine3.22

WORKDIR /rp1_frontend

COPY ./package.json /rp1_frontend/package.json

RUN npm install -g pnpm@latest-10 

RUN pnpm install

COPY ./ /rp1_frontend/

RUN pnpm build

CMD ["pnpm", "start"]

EXPOSE 3000
