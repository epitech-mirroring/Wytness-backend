FROM node:lts

COPY package*.json ./

RUN npm install

COPY ./prisma ./prisma
COPY ./src ./src
COPY ./entrypoint.sh ./
COPY ./tsconfig.json ./
COPY ./tsconfig.build.json ./
COPY ./nest-cli.json ./

RUN npx prisma generate

EXPOSE 3000

CMD ["bash","./entrypoint.sh"]
