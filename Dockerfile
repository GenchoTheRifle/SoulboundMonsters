FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
