FROM node:22.17.0-alpine

RUN apk update && apk upgrade

WORKDIR /usr/src/cubos_bank_api

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 80

CMD ["npm", "run", "start:prod"]