FROM node:16

# netcat 설치 추가
RUN apt-get update && apt-get install -y netcat

WORKDIR /app
COPY . .

# wait-for-it.sh 복사 및 실행 권한 부여 (server 디렉토리로 복사)
COPY wait-for-it.sh /app/server/wait-for-it.sh
RUN sed -i 's/\r$//' /app/server/wait-for-it.sh && chmod +x /app/server/wait-for-it.sh

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

CMD ["./wait-for-it.sh", "mysql:3306", "--", "node", "server.js"]