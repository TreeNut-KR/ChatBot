@echo off
chcp 65001
SETLOCAL

:: Python 설치 경로 설정
SET PYTHON_PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe

:: 가상 환경 디렉토리 이름 설정
SET ENV_DIR=.venv

:: Python 가상 환경 생성
"%PYTHON_PATH%" -m venv %ENV_DIR%

echo 가상 환경 활성화 중...
CALL %ENV_DIR%\Scripts\activate.ps1
ENDLOCAL