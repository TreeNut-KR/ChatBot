-- users 테이블의 userid 컬럼 타입 변경
ALTER TABLE users
MODIFY COLUMN userid VARCHAR(50) NOT NULL UNIQUE;

-- chatroom 테이블의 외래키 제약조건 삭제
ALTER TABLE chatroom DROP FOREIGN KEY chatroom_ibfk_1;

-- chatroom 테이블의 userid 컬럼 타입 변경
ALTER TABLE chatroom MODIFY COLUMN userid VARCHAR(50) NOT NULL;

-- chatroom 테이블의 외래키 제약조건 다시 추가
ALTER TABLE chatroom
    ADD CONSTRAINT chatroom_ibfk_1 FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE;

-- officeroom 테이블의 외래키 제약조건 삭제
ALTER TABLE officeroom DROP FOREIGN KEY officeroom_ibfk_1;

-- officeroom 테이블의 userid 컬럼 타입 변경
ALTER TABLE officeroom MODIFY COLUMN userid VARCHAR(50) NOT NULL;

-- officeroom 테이블의 외래키 제약조건 다시 추가
ALTER TABLE officeroom
    ADD CONSTRAINT officeroom_ibfk_1 FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE;