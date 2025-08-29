FROM node:22-alpine AS build
ARG REACT_APP_GA4_TRACKING_ID
ENV REACT_APP_GA4_TRACKING_ID=$REACT_APP_GA4_TRACKING_ID
COPY . /app
WORKDIR /app
RUN yarn install --immutable
RUN ls -la && yarn build

FROM nginx:1.29-alpine
RUN rm -R /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html
COPY mt-nginx.conf /etc/nginx/conf.d/default.conf
