-- characters 테이블 내 liked_users 컬럼 삭제
ALTER TABLE characters DROP COLUMN liked_users;

-- character 좋아요 저장을 위한 테이블 추가
CREATE TABLE liked_characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    userid VARCHAR(50) NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(idx) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    UNIQUE KEY unique_like (character_id, userid)
) ENGINE=InnoDB CHARSET=utf8mb4;