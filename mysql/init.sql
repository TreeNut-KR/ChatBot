GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '1234' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS chatbot;

USE chatbot;

-- 유저 테이블 생성
CREATE TABLE users (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(50) UNIQUE,
    login_type VARCHAR(50),
    username VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 캐릭터 테이블 생성
CREATE TABLE characters (
    idx INT AUTO_INCREMENT,
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
    PRIMARY KEY(idx),
    FOREIGN KEY (userid) REFERENCES users(userid)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 채팅방 (캐릭터 채팅) 테이블 생성
CREATE TABLE chatroom (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(100),
    characters_idx INT,
    mongo_chatroomid VARCHAR(100),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY(idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (characters_idx) REFERENCES characters(idx) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 채팅방 (GPT 채팅) 테이블 생성
CREATE TABLE officeroom (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(100),
    mongo_chatroomid VARCHAR(100),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY(idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 외래 키 제약 조건을 제거하고 idx 컬럼 수정 후 다시 외래 키 설정
-- 1. chatroom 테이블의 외래 키 삭제
ALTER TABLE chatroom DROP FOREIGN KEY chatroom_ibfk_2;

-- 2. characters 테이블에서 idx 컬럼 수정 (AUTO_INCREMENT로 변경)
ALTER TABLE characters MODIFY COLUMN idx BIGINT NOT NULL AUTO_INCREMENT;

-- 3. chatroom 테이블에 다시 외래 키 설정
ALTER TABLE chatroom ADD CONSTRAINT chatroom_ibfk_2 FOREIGN KEY (characters_idx) REFERENCES characters(idx) ON DELETE CASCADE;
