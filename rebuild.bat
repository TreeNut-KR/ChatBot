@echo off
chcp 65001
SETLOCAL

echo Checking Docker daemon status...
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker daemon is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    timeout /t 20 >nul
    echo Re-checking Docker daemon status...
    docker info >nul 2>&1
    if errorlevel 1 (
        echo Failed to start Docker daemon. Exiting...
        exit /b 1
    ) else (
        echo Docker daemon started successfully.
    )
) else (
    echo Docker daemon is already running.
)
echo.

echo Docker Compose down...
docker-compose down -v
if errorlevel 1 (
    echo Failed to execute docker-compose down. Exiting...
    exit /b 1
)
echo.

echo Removing old Docker images...
FOR /F "tokens=*" %%i IN ('docker images -q --filter "dangling=false"') DO (
    docker rmi %%i
)
echo.

echo Removing old folders...
IF EXIST .\fastapi\sources\logs rmdir /s /q .\fastapi\sources\logs
IF EXIST .\mysql\data rmdir /s /q .\mysql\data
IF EXIST .\mysql\logs rmdir /s /q .\mysql\logs
IF EXIST .\mongo\data rmdir /s /q .\mongo\data
IF EXIST .\mongo\log rmdir /s /q .\mongo\log
echo.

echo Removing __pycache__ folders in ./fastapi...
FOR /d /r .\fastapi\ %%i IN (__pycache__) DO (
    if exist "%%i" rmdir /s /q "%%i"
)
echo.

echo Starting Docker Compose...
docker-compose up -d
if errorlevel 1 (
    echo Failed to execute docker-compose up. Exiting...
    exit /b 1
)
ENDLOCAL