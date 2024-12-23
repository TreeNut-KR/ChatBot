GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '1234' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS chatbot;

USE chatbot;

-- 유저 테이블
CREATE TABLE users (
    idx BIGINT AUTO_INCREMENT,
    userid VARCHAR(50) UNIQUE,
    username VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    login_type ENUM('local', 'kakao', 'google') DEFAULT 'local',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 캐릭터 테이블
CREATE TABLE characters (
    idx BIGINT AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    userid VARCHAR(50),
    character_name VARCHAR(30) NOT NULL,
    character_setting VARCHAR(255),
    description VARCHAR(255),
    greeting TEXT,
    image VARCHAR(255),
    accesslevel BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 채팅방 테이블
CREATE TABLE chatroom (
    idx BIGINT AUTO_INCREMENT,
    userid VARCHAR(100),
    characters_idx BIGINT NOT NULL,
    mongo_chatroomid VARCHAR(100),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY (idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (characters_idx) REFERENCES characters(idx) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 오피스룸 테이블
CREATE TABLE officeroom (
    idx BIGINT AUTO_INCREMENT,
    userid VARCHAR(100),
    mongo_chatroomid VARCHAR(100),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY (idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;
