@echo off
chcp 65001
SETLOCAL

echo Navigating to React Frontend directory...
cd .\nginx\react-frontpage

echo Checking if build directory exists...
IF EXIST .\build\ (
    echo Build directory already exists. Skipping build process.
) ELSE (
    echo Installing NPM packages...
    npm i
    echo.

    echo Building React project...
    CD ./nginx\react-frontpage
    npm run build
    if errorlevel 1 (
        echo npm run build failed. Exiting...
        exit /b 1
    )
    echo.
)
ENDLOCAL