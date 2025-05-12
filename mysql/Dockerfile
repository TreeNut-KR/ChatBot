FROM mysql/mysql-server:5.7

ENV TZ=Asia/Seoul

COPY ./init.sql /docker-entrypoint-initdb.d/

ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

# Flyway 설치 (gzip 추가)
RUN yum install -y wget unzip gzip && \
    wget -O flyway-commandline.tar.gz https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.22.3/flyway-commandline-9.22.3-linux-x64.tar.gz && \
    tar -xzf flyway-commandline.tar.gz && \
    mv flyway-9.22.3 /flyway && \
    ln -s /flyway/flyway /usr/local/bin/flyway

COPY ./migrations /flyway/sql

CMD ["sh", "-c", "/usr/local/bin/docker-entrypoint.sh mysqld & sleep 30 && flyway -url=jdbc:mysql://localhost:3306/chatbot -user=root -password=1234 migrate && tail -f /dev/null"]
