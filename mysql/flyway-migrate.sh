#!/bin/bash
# filepath: ./mysql/flyway-migrate.sh

# Flyway 실행 함수
run_flyway() {
  local db_name=$1
  echo "Running Flyway migration for database: $db_name"
  flyway -url=jdbc:mysql://mysql:3306/$db_name \
         -user=root \
         -password=${MYSQL_ROOT_PASSWORD} \
         -baselineOnMigrate=true \
         migrate
}

# TEST DB 마이그레이션
run_flyway "TEST"
if [ $? -ne 0 ]; then
  echo "TEST database migration failed. Aborting chatbot migration."
  exit 1
fi

# 실제 DB 마이그레이션
run_flyway ${MYSQL_DATABASE}
if [ $? -ne 0 ]; then
  echo "chatbot database migration failed."
  exit 1
fi

echo "Both TEST and chatbot migrations completed successfully."