FROM postgres:16-alpine

COPY scripts/docker-start.sh  /usr/local/bin/

RUN apk add nodejs
RUN apk add npm

COPY src/ /usr/lib/hoally/src/
COPY package.json /usr/lib/hoally/
COPY database/ /usr/lib/hoally/database/

WORKDIR /usr/lib/hoally/
RUN npm install --omit=dev

COPY app/public/ /usr/lib/hoally/app/public/
COPY app/src/ /usr/lib/hoally/app/src/
COPY app/package.json /usr/lib/hoally/app/

WORKDIR /usr/lib/hoally/app/
RUN npm install --omit=dev
RUN npm run build

WORKDIR /usr/lib/hoally/

EXPOSE 80/tcp

ENTRYPOINT ["docker-start.sh"] CMD

STOPSIGNAL SIGINT