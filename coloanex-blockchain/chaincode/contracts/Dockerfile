FROM --platform=linux/amd64 node:18-alpine AS builder
WORKDIR /chaincode
COPY package*.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM --platform=linux/amd64 node:18-alpine
WORKDIR /chaincode
COPY package*.json ./
RUN npm install --production
COPY --from=builder /chaincode/dist ./dist
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:10000
CMD ["npm", "start"]
