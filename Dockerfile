FROM oven/bun:1 AS base
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y bash curl && curl -1sLf \
'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
&& apt-get update && apt-get install -y infisical
RUN apt-get install -y python3 make
RUN apt install build-essential -y --no-install-recommends

ARG PORT

ENV PORT=${PORT}

FROM base AS install
COPY package*.json ./
COPY bun.lockb ./
RUN bun install

COPY ./src ./src
COPY ./entrypoint.sh ./
COPY ./tsconfig.json ./
COPY ./tsconfig.build.json ./
COPY ./nest-cli.json ./
COPY ./assets ./assets

EXPOSE ${PORT}

CMD ["bash","./entrypoint.sh"]
