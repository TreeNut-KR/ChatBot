FROM mysql/mysql-server:5.7

ENV TZ=Asia/Seoul

COPY ./init.sql /docker-entrypoint-initdb.d/

ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

# docker-compose.yml에 command가 이미 있으므로 제거
# CMD [ "mysqld" ]

# 호스트에서 볼륨으로 마운트된 파일에 쓰기 권한 부여를 위한 설정
# CMD에서 직접 권한 설정은 어려우므로 ENTRYPOINT 스크립트 생성

# SOURCE var/lib/mysql/first_setting.sql