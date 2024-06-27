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

docker stop hoally-$environment 2>/dev/null
docker container rm hoally-$environment 2>/dev/null
docker run -d --rm -p 8080:8080 --name  hoally-$environment hoally:$version