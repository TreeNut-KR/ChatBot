@echo off
chcp 65001
SETLOCAL

echo Docker Compose off...
docker-compose down -v
echo.

echo docker images remove...
FOR /F "tokens=*" %%i IN ('docker images -q --filter "dangling=false"') DO (
    docker rmi %%i
)
echo.

echo folder remove...
IF EXIST .\fastapi\logs rmdir /s /q .\fastapi\logs
IF EXIST .\mysql\data rmdir /s /q .\mysql\data
IF EXIST .\mysql\logs rmdir /s /q .\mysql\logs
IF EXIST .\mongo\data rmdir /s /q .\mongo\data
IF EXIST .\mongo\log rmdir /s /q .\mongo\log
echo.

echo Docker Compose on...
docker-compose up -d
ENDLOCAL