FROM node:14-buster-slim

ARG BUILD_DIR="/usr/app"
ARG CONTAINER_USER="node"
ARG CONTAINER_EXPOSE_PORT="8083"

WORKDIR $BUILD_DIR
RUN chown -R $CONTAINER_USER:$CONTAINER_USER $BUILD_DIR
USER $CONTAINER_USER

COPY --chown=${CONTAINER_USER} . .

RUN npm install
RUN npm run build

ENTRYPOINT ["node", "dist/index.js"]
