@echo off
chcp 65001
SETLOCAL

:: pip 최신 버전으로 업그레이드 (가상 환경 내부)
python.exe -m pip install --upgrade pip

:: requirements.txt 파일에 있는 모든 패키지 설치
pip install -r .\fastapi\requirements.txt

echo 가상 환경이 성공적으로 설정되었습니다.
echo 가상 환경을 활성화하려면 다음 명령을 사용하세요:
echo CALL %ENV_DIR%\Scripts\activate.bat

ENDLOCAL
 