#!/usr/bin/bash

# See: https://hub.docker.com/_/postgres

RUN=$HOME/hoally-run/
DATA=${RUN}data/
PG_DATA=${DATA}pgdata/
SECRETS=$HOME/hoally-run//secrets/

D_POSTGRESS=/var/lib/postgresql/
D_SECRETS=${D_POSTGRESS}secrets/
D_DATA=${D_POSTGRESS}data/

if [ "$1" = "--clean" ]
then
  echo "Cleaning up all database files? (y/n)"
  read clean
  if [ "$clean" = "y" ]
  then
    rm -rf $PG_DATA
    mkdir $PG_DATA
    chmod 744 $PG_DATA
    docker container rm hoally-db
  fi
fi

# uid 1004 is user hoa
docker run --name hoally-db -d \
  -e POSTGRES_PASSWORD_FILE=${D_SECRETS}postgres-passwd \
  -v ${SECRETS}:${D_SECRETS} \
  --user 1004:1004 \
  -v /etc/passwd:/etc/passwd \
  -p 5432:5432 \
  -e PGDATA=${D_DATA} \
  -v ${PG_DATA}:${D_DATA} \
  postgres:16.3-alpine