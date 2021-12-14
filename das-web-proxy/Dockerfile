FROM node:14.15.0-alpine
WORKDIR /app
COPY ./package.json ./
RUN yarn --ignore-scripts
COPY ./ ./


EXPOSE 3030

CMD ["yarn", "start-api"]