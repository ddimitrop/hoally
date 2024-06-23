#!/usr/bin/bash

if [ "$1" = "--clean" ]
then
  echo "Cleaning up all database files? (y/n)"
  read clean
  if [ "$clean" = "y" ]
  then
    rm -rf /run/data/hoally/pgdata
    mkdir /run/data/hoally/pgdata
    chmod 744 /run/data/hoally/pgdata
  fi
fi
 
# uid 1004 is user hoa
docker run --name hoally-db -d --rm \
  -e POSTGRES_PASSWORD_FILE=/var/lib/postgresql/secrets/postgres-passwd \
  -v /run/secrets/hoally/:/var/lib/postgresql/secrets/ \
  --user 1004:1004 \
  -v /etc/passwd:/etc/passwd \
  -p 5432:5432 \
  -e PGDATA=/var/lib/postgresql/data/ \
  -v /run/data/hoally/pgdata:/var/lib/postgresql/data/ \
  postgres:16.3-alpine