FROM node:16@sha256:5d256e870e277b6e5533c8fdb007345657ad9e5cd95c6f710e8d0c60fed5dfc4

ENV NODE_ENV=production

COPY . /src
WORKDIR /src

ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG COGNITO_REGION="ca-central-1"
ARG COGNITO_APP_CLIENT_ID
ARG COGNITO_USER_POOL_ID

RUN yarn install --silent --production=false
RUN yarn build
RUN yarn install --production

FROM node:16@sha256:5d256e870e277b6e5533c8fdb007345657ad9e5cd95c6f710e8d0c60fed5dfc4

COPY migrations /src
WORKDIR /src
RUN yarn install --silent 

FROM node:16@sha256:5d256e870e277b6e5533c8fdb007345657ad9e5cd95c6f710e8d0c60fed5dfc4

COPY flag_initialization /src
WORKDIR /src
RUN yarn install --silent 

FROM node:16@sha256:5d256e870e277b6e5533c8fdb007345657ad9e5cd95c6f710e8d0c60fed5dfc4
LABEL maintainer="-"

ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

ARG GITHUB_SHA_ARG
ENV GITHUB_SHA=$GITHUB_SHA_ARG

ARG COGNITO_REGION="ca-central-1"
ENV COGNITO_REGION=$COGNITO_REGION

ARG COGNITO_APP_CLIENT_ID
ENV COGNITO_APP_CLIENT_ID=$COGNITO_APP_CLIENT_ID

ARG COGNITO_USER_POOL_ID
ENV COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID

ARG TAG_VERSION
ENV TAG_VERSION=$TAG_VERSION

WORKDIR /src

COPY package.json yarn.lock ./

COPY --from=0 /src/node_modules ./node_modules
COPY --from=0 /src/.next ./.next
COPY public ./public
COPY next.config.js .
COPY next-i18next.config.js .
COPY migrations ./migrations
COPY prisma ./prisma
COPY form-builder-templates ./form-builder-templates
COPY flag_initialization ./flag_initialization
COPY --from=1 /src/node_modules ./migrations/node_modules
COPY --from=2 /src/node_modules ./flag_initialization/node_modules


ENV PORT 3000

EXPOSE 3000

ENTRYPOINT [ "yarn", "start"]