-- 사용자 권한 및 기본 설정
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '1234' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- 데이터베이스 생성 및 사용
CREATE DATABASE IF NOT EXISTS chatbot;
USE chatbot;

-- 유저 테이블
CREATE TABLE users (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(50) UNIQUE NOT NULL,  -- 소셜 플랫폼 ID와 플랫폼 정보 포함
    login_type VARCHAR(50) NOT NULL,     -- 로그인 플랫폼 (KAKAO, GOOGLE 등)
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    password VARCHAR(255) NULL,          -- 소셜 로그인 사용자는 NULL 허용
    access_token TEXT,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 캐릭터 테이블
CREATE TABLE characters (
    idx INT AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    userid VARCHAR(50) NOT NULL,                 -- 유저와 연관
    character_name VARCHAR(30) NOT NULL,
    character_setting VARCHAR(255),
    description VARCHAR(255),
    greeting TEXT,
    image VARCHAR(255),
    accesslevel BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE  -- 유저 삭제 시 연쇄 삭제
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 채팅방 테이블 (캐릭터 채팅)
CREATE TABLE chatroom (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(50) NOT NULL,                 -- 유저와 연관
    characters_idx INT NOT NULL,                 -- 캐릭터와 연관
    mongo_chatroomid VARCHAR(100) NOT NULL,      -- MongoDB에서 관리하는 채팅방 ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,  -- 유저 삭제 시 연쇄 삭제
    FOREIGN KEY (characters_idx) REFERENCES characters(idx) ON DELETE CASCADE -- 캐릭터 삭제 시 연쇄 삭제
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 채팅방 테이블 (GPT 채팅)
CREATE TABLE officeroom (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(50) NOT NULL,                 -- 유저와 연관
    mongo_chatroomid VARCHAR(100) NOT NULL,      -- MongoDB에서 관리하는 채팅방 ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE  -- 유저 삭제 시 연쇄 삭제
) ENGINE=InnoDB CHARSET=utf8mb4;