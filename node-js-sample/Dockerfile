FROM node:10-alpine
EXPOSE 8000
WORKDIR /src
COPY . .
RUN npm install
CMD ls -lrt && pwd && node app.js