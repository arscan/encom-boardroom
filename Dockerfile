from node:boron

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

COPY . .

ENV PORT 8000

EXPOSE 8000

CMD [ "node", "stream-server.js" ]
