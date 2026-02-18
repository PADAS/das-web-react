FROM europe-west3-docker.pkg.dev/serca-artifact-registry/virtual-docker/node:22-alpine AS build
ARG ENV_FILE=.env.production
ARG REACT_APP_GA4_TRACKING_ID
ENV REACT_APP_GA4_TRACKING_ID=$REACT_APP_GA4_TRACKING_ID
COPY . /app
WORKDIR /app
RUN yarn install --immutable
RUN test -f "$ENV_FILE" && cp "$ENV_FILE" .env.production.local
RUN ls -la && yarn build

FROM europe-west3-docker.pkg.dev/serca-artifact-registry/virtual-docker/nginx:1.29-alpine
RUN rm -R /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html
COPY mt-nginx.conf /etc/nginx/conf.d/default.conf
