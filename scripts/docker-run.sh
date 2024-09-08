#!/usr/bin/bash

version=$1
environment=$2

if [ ! $version ]
then 
  version=1.0
fi

if [ ! $environment ]
then 
  environment=dev
fi

RUN=/usr/lib/hoally/run/
SECRETS=${RUN}secrets/
DATA=${RUN}data/

docker stop hoally-$environment 2>/dev/null
docker run --rm -t \
  -v ${RUN}:${RUN} \
  -e POSTGRES_PASSWORD_FILE=${SECRETS}postgres-passwd \
  -e PGDATA=${DATA} \
  -p 8080:80 \
  --stop-signal SIGINT \
  --stop-timeout 90 \
  --name hoally-$environment hoally:$version