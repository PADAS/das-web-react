FROM node:14.21.0-alpine as build
WORKDIR /app

RUN apk add --no-cache git alpine-sdk python3

COPY package.json .
COPY yarn.lock .
RUN yarn --ignore-scripts && \
    npm rebuild node-sass

COPY . .
RUN ls && yarn build


FROM nginx:1.25-alpine

RUN rm -R /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html
COPY mt-nginx.conf /etc/nginx/conf.d/default.conf
