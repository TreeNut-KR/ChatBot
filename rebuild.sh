#!/bin/bash

# 모든 컨테이너 중지
docker stop $(docker ps -aq)

# 모든 컨테이너 삭제
docker rm $(docker ps -aq)

# 모든 이미지 삭제
docker rmi $(docker images -q)

#리빌드
docker compose up -d

echo "도커 컨테이너 리빌드 완료"
