# check=skip=InvalidDefaultArgInFrom
ARG NODE_VERSION
FROM europe-west3-docker.pkg.dev/serca-artifact-registry/virtual-docker/node:${NODE_VERSION}-alpine AS build
ARG ENV_FILE=.env.production
# Node 26 images no longer ship Yarn, so Corepack provides the one we pin.
RUN npm install --global corepack@0.36.0 && corepack enable
COPY . /app
WORKDIR /app
RUN yarn install --immutable
RUN test -f "$ENV_FILE" && cp "$ENV_FILE" .env.production.local
RUN ls -la && yarn build

FROM europe-west3-docker.pkg.dev/serca-artifact-registry/virtual-docker/nginx:1.29-alpine
RUN rm -R /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html
COPY mt-nginx.conf /etc/nginx/conf.d/default.conf
