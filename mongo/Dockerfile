# mongo/Dockerfile
FROM mongo:latest

# 유지관리자를 설정합니다.
LABEL maintainer="sjmbee04@gmail.com"

# MongoDB 설정 파일을 컨테이너 내 적절한 위치로 복사합니다.
COPY mongod.conf /etc/mongod.conf

# # 작업 디렉토리 설정
# WORKDIR /mongo

# # 초기화 스크립트를 복사합니다.
# COPY init.py /mongo/init.py

# # 환경 변수 파일을 복사합니다.
# COPY .env /mongo/.env

# RUN apt-get update && \
#     apt-get install -y --no-install-recommends python3-pip && \
#     pip3 install --no-cache-dir motor python-dotenv && \
#     apt-get purge -y --auto-remove && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# MongoDB 포트를 오픈합니다.
EXPOSE 27017

# 컨테이너 시작 시 MongoDB를 실행하도록 설정합니다.
CMD ["mongod", "--config", "/etc/mongod.conf"]

# # MongoDB를 백그라운드에서 실행하고, 초기화 스크립트를 실행합니다.
# CMD ["bash", "-c", "mongod --config /mongo/mongod.conf & sleep 5 && python3 /mongo/init.py && wait"]