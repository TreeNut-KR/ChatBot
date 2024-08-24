# 베이스 이미지 설정
FROM python:3.12.1

# wait-for-it.sh 복사 및 실행 권한 부여
COPY wait-for-it.sh /usr/local/bin/wait-for-it
RUN sed -i 's/\r$//' /usr/local/bin/wait-for-it && chmod +x /usr/local/bin/wait-for-it

# 필요한 패키지 설치 및 로케일 설정
RUN apt-get update && apt-get install -y locales \
    && localedef -f UTF-8 -i ko_KR ko_KR.UTF-8 \
    && echo "LANG=ko_KR.UTF-8" > /etc/default/locale \
    && echo "LC_ALL=ko_KR.UTF-8" >> /etc/default/locale

# 필요한 패키지 설치
RUN apt-get update && apt-get install -y netcat-openbsd

# 환경 변수 설정
ENV LANG ko_KR.UTF-8
ENV LC_ALL ko_KR.UTF-8
ENV TZ=Asia/Seoul

# 작업 디렉토리 설정
WORKDIR /app/sources

# 의존성 파일 복사 및 설치
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 및 .env 파일 복사
COPY sources /app/sources
COPY sources/.env /app/sources/.env

# 어플리케이션 실행 (MySQL 준비 대기)
CMD ["/usr/local/bin/wait-for-it", "mysql:3306", "--", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
