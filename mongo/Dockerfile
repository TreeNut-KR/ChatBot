# mongo/Dockerfile
FROM mongo:latest

# 유지관리자를 설정합니다.
LABEL maintainer="sjmbee04@gmail.com"

# MongoDB 설정 파일을 컨테이너 내 적절한 위치로 복사합니다.
COPY mongod.conf /etc/mongod.conf

# 초기화 스크립트를 복사합니다.
COPY init_db.py /docker-entrypoint-initdb.d/init_db.py

# 환경 변수 파일을 복사합니다.
COPY .env /docker-entrypoint-initdb.d/.env

# 필요한 Python 라이브러리 설치
RUN apt-get update && \
    apt-get install -y python3-pip && \
    pip3 install pymongo

# MongoDB 포트를 오픈합니다.
EXPOSE 27017

# 컨테이너 시작 시 MongoDB를 실행하도록 설정합니다.
CMD ["mongod", "--config", "/etc/mongod.conf"]
