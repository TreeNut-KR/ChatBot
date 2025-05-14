#!/bin/bash

# healthcheck 통과 후 5초 대기
sleep 5

run_flyway() {
  local db_name=$1
  echo "Running Flyway migration for database: $db_name"
  flyway -url=jdbc:mysql://mysql:3306/$db_name \
         -user=root \
         -password=${MYSQL_ROOT_PASSWORD} \
         -baselineOnMigrate=true \
         migrate
}

run_flyway "TEST"
if [ $? -ne 0 ]; then
  echo "TEST database migration failed. Aborting chatbot migration."
  exit 1
fi

run_flyway ${MYSQL_DATABASE}
if [ $? -ne 0 ]; then
  echo "chatbot database migration failed."
  exit 1
fi

echo "Both TEST and chatbot migrations completed successfully."