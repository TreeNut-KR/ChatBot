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
if [ "$(docker images -aq)" ]; then
    docker rmi $(docker images -aq)
fi

# 이미지 빌드
jenkins_docker-compose up -d --build

echo "jenkins_rebuild.sh is done"