#!/usr/bin/env bash


docker-entrypoint.sh postgres &

sleep 10

echo "Will check hoadb schema"

CHECK_ROLE=$(echo "SET ROLE hoadb" | psql --username=postgres 2>&1)

if [[ $CHECK_ROLE == ERROR* ]]
then
  echo "Will install hoadb schema"
  psql --username=postgres < /usr/lib/hoally/database/schema.sql
fi


node src/hoally.mjs --prod --https "$@"
