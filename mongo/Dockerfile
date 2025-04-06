FROM mongo:4.4

# 유지관리자를 설정합니다.
LABEL maintainer="sjmbee04@gmail.com"

ENV TZ=Asia/Seoul

# MongoDB 설정 파일을 컨테이너 내 적절한 위치로 복사합니다.
COPY mongod.conf /etc/mongod.conf

# 로그 디렉토리 생성 및 권한 설정
RUN mkdir -p /var/log/mongodb && \
    chown -R mongodb:mongodb /var/log/mongodb && \
    chmod 755 /var/log/mongodb

# MongoDB 포트를 오픈합니다.
EXPOSE 27017

# 컨테이너 시작 시 MongoDB를 실행하도록 설정합니다.
CMD ["mongod", "--config", "/etc/mongod.conf"]