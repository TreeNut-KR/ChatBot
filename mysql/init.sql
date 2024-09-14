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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx)
) ENGINE=InnoDB CHARSET=utf8mb4;


-- 캐릭터
CREATE TABLE characters (
    idx INT AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    useridx INT,
    character_name VARCHAR(30) NOT NULL,
    character_setting VARCHAR(255),
    description VARCHAR(255),
    greeting TEXT,
    accesslevel BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (idx),
    FOREIGN KEY (useridx) REFERENCES users(idx) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 채팅방
CREATE TABLE chatroom (
    chatroom_pk INT AUTO_INCREMENT,
    users_idx INT,
    characters_pk INT,
    mongo_chatlog VARCHAR(100),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    
    PRIMARY KEY(chatroom_pk),
    FOREIGN KEY (users_idx) REFERENCES users(idx) ON DELETE CASCADE, /*외부키 설정*/
    FOREIGN KEY (characters_pk) REFERENCES characters(idx) ON DELETE CASCADE /*외부키 설정*/
) ENGINE=InnoDB CHARSET=utf8mb4;