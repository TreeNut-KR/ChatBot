@echo off
chcp 65001
SETLOCAL

echo Docker Compose off...
docker-compose down -v
echo.

echo docker images remove...
FOR /F "tokens=1" %%i IN ('docker images -q --filter "dangling=false"') DO (
    docker rmi %%i
)
echo.

echo folder remove...
rmdir /s /q .\fastapi\logs
rmdir /s /q .\mysql\data
rmdir /s /q .\mysql\logs
rmdir /s /q .\mongo\data
rmdir /s /q .\mongo\log
echo.

echo Docker Compose on...
docker-compose up
ENDLOCAL