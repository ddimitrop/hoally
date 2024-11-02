#!/usr/bin/bash

version=$1
environment=$2

if [ ! $version ]
then 
  version=1.07
fi

if [ ! $environment ]
then 
  environment=dev
fi

LOCAL_RUN=/home/hoa/hoally-run/
RUN=/usr/lib/hoally/run/
SECRETS=${RUN}secrets/
DATA=${RUN}/dev/data/
IMAGES=${RUN}/dev/images/

docker stop hoally-$environment 2>/dev/null
docker run --rm -t \
  -v ${LOCAL_RUN}:${RUN} \
  -v /etc/letsencrypt/:/etc/letsencrypt/ \
  -e POSTGRES_PASSWORD_FILE=${SECRETS}postgres-passwd \
  -e PGDATA=${DATA} \
  -p 8080:443 \
  --stop-signal SIGINT \
  --stop-timeout 30 \
  --name hoally-$environment hoally:$version \
  --cert '/etc/letsencrypt/live/lacroix.mynetgear.com/' \
  --forcedomain lacroix.mynetgear.com \
  --images ${IMAGES}
