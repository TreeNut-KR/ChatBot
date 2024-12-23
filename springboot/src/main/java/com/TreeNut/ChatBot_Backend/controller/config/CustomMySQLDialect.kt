package com.TreeNut.ChatBot_Backend.config

import org.hibernate.dialect.MySQLDialect

class CustomMySQLDialect : MySQLDialect() {
    init {
        // MySQL 5.7에 맞는 설정 추가
        registerColumnType(java.sql.Types.BOOLEAN, "bit")
        registerColumnType(java.sql.Types.BLOB, "longblob")
    }
}
