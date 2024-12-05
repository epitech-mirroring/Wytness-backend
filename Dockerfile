FROM node:lts

COPY package*.json ./

ARG PORT

ENV PORT=${PORT}

RUN npm install

COPY ./prisma ./prisma
COPY ./src ./src
COPY ./entrypoint.sh ./
COPY ./tsconfig.json ./
COPY ./tsconfig.build.json ./
COPY ./nest-cli.json ./

RUN npx prisma generate

EXPOSE ${PORT}

CMD ["bash","./entrypoint.sh"]
