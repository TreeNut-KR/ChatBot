FROM node:16

WORKDIR /app
COPY . .

# 서버 종속성 설치
WORKDIR /app/server
RUN npm install

# 클라이언트 종속성 설치 및 빌드
WORKDIR /app/client
RUN npm install
RUN npm run build

# 서버 디렉토리로 다시 이동
WORKDIR /app/server

EXPOSE 5785

CMD ["node", "server.js"]