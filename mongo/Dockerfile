# 베이스 이미지로 MongoDB를 사용합니다.
FROM mongo:latest

# 유지관리자를 설정합니다.
LABEL maintainer="sjmbee04@gmail.com"

# MongoDB 설정 파일을 컨테이너 내 적절한 위치로 복사합니다.
COPY mongod.conf /etc/mongod.conf

# MongoDB 포트를 오픈합니다.
EXPOSE 27017

# 컨테이너 시작 시 MongoDB를 실행하도록 설정합니다.
CMD ["mongod", "--config", "/etc/mongod.conf"]
