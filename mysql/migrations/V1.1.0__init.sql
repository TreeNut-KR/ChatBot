-- characters 테이블에 character_setting 컬럼의 데이터 타입을 LONGTEXT로 변경
ALTER TABLE characters
MODIFY character_setting LONGTEXT
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 유저의 EULA 동의 여부를 저장하는 테이블 추가
CREATE TABLE user_eula_agreements (
    id INT AUTO_INCREMENT,
    userid VARCHAR(50) NOT NULL UNIQUE,
    privacy_policy BOOLEAN DEFAULT TRUE,
    terms_of_service BOOLEAN DEFAULT TRUE,
    agreedat DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 기존 users 테이블의 모든 유저에 대해 user_eula_agreements에 동의 데이터 삽입
INSERT INTO user_eula_agreements (userid, privacy_policy, terms_of_service, agreedat)
SELECT userid, TRUE, TRUE, created_at
FROM users
ORDER BY idx ASC;