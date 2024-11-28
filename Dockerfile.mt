FROM node:20-alpine as build
WORKDIR /app

RUN apk add --no-cache git alpine-sdk python3

COPY package.json .
COPY yarn.lock .
RUN yarn --ignore-scripts

COPY . .
RUN ls -la && yarn build


FROM nginx:1.25-alpine

RUN rm -R /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html
COPY mt-nginx.conf /etc/nginx/conf.d/default.conf
