FROM node:lts as base

COPY package*.json ./

RUN apt-get update && apt-get install -y bash curl && curl -1sLf \
'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
&& apt-get update && apt-get install -y infisical

ARG PORT

ENV PORT=${PORT}

FROM base AS install
RUN npm install

COPY ./src ./src
COPY ./entrypoint.sh ./
COPY ./tsconfig.json ./
COPY ./tsconfig.build.json ./
COPY ./nest-cli.json ./

EXPOSE ${PORT}

CMD ["bash","./entrypoint.sh"]
