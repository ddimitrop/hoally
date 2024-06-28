FROM node:18.20.3-alpine

COPY src/ /usr/lib/hoally/src/
COPY package.json /usr/lib/hoally/

WORKDIR /usr/lib/hoally/
RUN npm install --omit=dev

COPY app/public/ /usr/lib/hoally/app/public/
COPY app/src/ /usr/lib/hoally/app/src/
COPY app/package.json /usr/lib/hoally/app/

WORKDIR /usr/lib/hoally/app/
RUN npm install --omit=dev
RUN npm run build

WORKDIR /usr/lib/hoally/
ENTRYPOINT ["node", "src/hoally.mjs"] CMD