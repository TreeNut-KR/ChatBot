GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '1234' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS chatbot;

USE chatbot;

-- 유저
CREATE TABLE users (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(50) UNIQUE,
    username VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    login_type ENUM('LOCAL', 'KAKAO', 'GOOGLE') DEFAULT 'LOCAL',
    manager_boolean BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx)
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 캐릭터
CREATE TABLE characters (
    idx INT AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    userid VARCHAR(50),
    character_name VARCHAR(30) NOT NULL,
    character_setting LONGTEXT,
    description LONGTEXT,
    greeting LONGTEXT,
    image TEXT,
    access_level BOOLEAN,
    like_count int DEFAULT 0,
    liked_users TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

ALTER TABLE characters MODIFY character_setting LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 채팅방 (캐릭터 채팅)
CREATE TABLE chatroom (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(100),
    characters_idx INT,
    mongo_chatroomid VARCHAR(512),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY(idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE, /*외부키 설정*/
    FOREIGN KEY (characters_idx) REFERENCES characters(idx) ON DELETE CASCADE /*외부키 설정*/
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 채팅방 (GPT 채팅)
CREATE TABLE IF NOT EXISTS officeroom (
    idx INT AUTO_INCREMENT,
    userid VARCHAR(100),
    mongo_chatroomid VARCHAR(512),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    PRIMARY KEY(idx),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE /*외부키 설정*/
) ENGINE=InnoDB CHARSET=utf8mb4;
