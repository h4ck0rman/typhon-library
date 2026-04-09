FROM node:20-alpine

WORKDIR /app
COPY app/ .
RUN npm install --production

EXPOSE 80
CMD ["node", "server.js"]
