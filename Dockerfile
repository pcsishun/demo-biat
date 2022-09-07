FROM node:17.8-alpine

RUN apk add --no-cache tini && mkdir -p /usr/src/app

WORKDIR  /usr/src/app
COPY package.json .
RUN npm i && npm i cache clean --force
COPY . .
EXPOSE 3000

CMD ["/sbin/tini", "--", "node", "index.js"]