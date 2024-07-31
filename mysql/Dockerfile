FROM mysql/mysql-server:5.7

ENV TZ=Asia/Seoul

COPY ./init.sql /docker-entrypoint-initdb.d/

ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

CMD [ "mysqld" ]

# SOURCE var/lib/mysql/first_setting.sql