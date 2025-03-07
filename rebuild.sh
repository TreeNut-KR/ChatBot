#!/bin/bash

# 모든 컨테이너 중지
if [ "$(docker ps -aq)" ]; then
    docker stop $(docker ps -aq)
fi

# 모든 컨테이너 삭제
if [ "$(docker ps -aq)" ]; then
    docker rm $(docker ps -aq)
fi

# 모든 이미지 삭제
if [ "$(docker images -q)" ]; then
    docker rmi $(docker images -q)
fi

# 리빌드
docker compose up -d

echo "도커 컨테이너 리빌드 완료"