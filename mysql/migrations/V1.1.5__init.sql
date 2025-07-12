-- 기존 소셜 로그인 사용자들을 VIP로 업데이트
UPDATE users 
SET membership = 'VIP' 
WHERE login_type IN ('KAKAO', 'GOOGLE', 'NAVER');

-- 새로 가입하는 소셜 로그인 사용자들을 자동으로 VIP로 설정하는 트리거
DELIMITER $$

CREATE TRIGGER update_membership_on_insert
    BEFORE INSERT ON users
    FOR EACH ROW
BEGIN
    IF NEW.login_type IN ('KAKAO', 'GOOGLE', 'NAVER') THEN
        SET NEW.membership = 'VIP';
    END IF;
END$$

CREATE TRIGGER update_membership_on_update
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    IF NEW.login_type IN ('KAKAO', 'GOOGLE', 'NAVER') THEN
        SET NEW.membership = 'VIP';
    ELSEIF NEW.login_type = 'LOCAL' AND OLD.login_type IN ('KAKAO', 'GOOGLE', 'NAVER') THEN
        SET NEW.membership = 'BASIC';
    END IF;
END$$

DELIMITER ;