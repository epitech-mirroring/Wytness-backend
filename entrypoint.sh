#!/usr/bin/env bash

npx prisma db push

if [ "$NODE_ENV" = "production" ]; then
  INFISICAL_ENV="prod"
else
  INFISICAL_ENV="staging"
fi

infisical run --projectId 6c28db9c-c9bd-413d-b76b-2c6245b201e8 --path "/backend" --recursive --env $INFISICAL_ENV --token="$INFISICAL_TOKEN" --domain https://secrets.place2die.com -- npm run start