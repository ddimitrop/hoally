#!/usr/bin/bash

version=$1

if [ ! $version ]
then 
  version=1.0
fi

docker build -t hoally:$version .
docker image prune -f