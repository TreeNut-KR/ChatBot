# Node.js 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사 및 서버 의존성 설치
COPY server/package*.json ./
RUN npm install

# 서버 코드 복사
COPY server ./server

# 빌드된 클라이언트 파일만 복사
COPY client/build ./client/build

# 포트 설정
EXPOSE 5785

# 서버 실행
CMD ["node", "server/server.js"]