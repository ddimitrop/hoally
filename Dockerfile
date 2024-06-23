FROM node:18.20.3-alpine

COPY src/ /usr/lib/hoally/src/
COPY package.json /usr/lib/hoally/

WORKDIR /usr/lib/hoally/
RUN npm install --omit=dev

ENTRYPOINT ["node", "src/hoally.mjs"] CMD