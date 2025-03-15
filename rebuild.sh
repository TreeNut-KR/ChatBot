#!/bin/bash

# 도커 데몬 상태 확인
echo "Checking Docker daemon status..."
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker daemon is not running. Please start Docker first."
    exit 1
else
    echo "Docker daemon is already running."
fi
echo ""

# 도커 컴포즈 다운
echo "Docker Compose down..."
docker-compose down -v
if [ $? -ne 0 ]; then
    echo "Failed to execute docker-compose down. Exiting..."
    exit 1
fi
echo ""

# 오래된 도커 이미지 제거
echo "Removing old Docker images..."
docker images -q --filter "dangling=false" | xargs -r docker rmi
echo ""

# 오래된 폴더 제거
echo "Removing old folders..."
if [ -d "./fastapi/sources/logs" ]; then
    rm -rf ./fastapi/sources/logs
fi
# 유지할 데이터 폴더는 삭제하지 않습니다.
# if [ -d "./mysql/data" ]; then rm -rf ./mysql/data; fi
# if [ -d "./mysql/logs" ]; then rm -rf ./mysql/logs; fi
# if [ -d "./mongo/data" ]; then rm -rf ./mongo/data; fi
# if [ -d "./mongo/log" ]; then rm -rf ./mongo/log; fi
echo ""

# __pycache__ 폴더 제거
echo "Removing __pycache__ folders in ./fastapi..."
find ./fastapi -type d -name "__pycache__" -exec rm -rf {} +
echo ""

# 도커 컴포즈 빌드
echo "Docker Compose build..."
docker-compose build --parallel
if [ $? -ne 0 ]; then
    echo "Failed to execute docker-compose build. Exiting..."
    exit 1
fi
echo ""

# 도커 컴포즈 시작
echo "Starting Docker Compose..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "Failed to execute docker-compose up. Exiting..."
    exit 1
fi

echo "Docker container rebuild completed successfully."