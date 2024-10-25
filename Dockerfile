FROM node:18.18.0

ARG web=/opt/workspace/dapp
ARG NEXT_PUBLIC_APP_ENV
ARG BUILD_ENV
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}

WORKDIR ${web}

COPY . ${web}

RUN yarn cache clean

RUN yarn

RUN yarn list --depth=0

RUN yarn build:${BUILD_ENV}

ENTRYPOINT yarn start

EXPOSE 3000
