import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './resister.css';

const Resister: React.FC = () => {
  // 상태 변수 타입 지정
  const [Id, setId] = useState<string>(''); // 아이디
  const [password, setPassword] = useState<string>(''); // 비밀번호
  const [username, setUsername] = useState<string>(''); // 이름
  const [email, setEmail] = useState<string>(''); // 이메일
  const [error, setError] = useState<string>(''); // 에러 메시지
  const [success, setSuccess] = useState<boolean>(false); // 성공 여부

  // 컴포넌트가 마운트될 때 입력 필드를 초기화
  useEffect(() => {
    setId('');
    setPassword('');
    setUsername('');
    setEmail('');
  }, []);

  // 폼 제출 시 호출되는 함수
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post('http://localhost:8080/server/user/register', {
        id: Id,
        pw: password,
        name: username,
        email: email,
      });

      if (response.status === 200) {
        setSuccess(true);
        console.log('회원가입 성공:', response.data);
      }
    } catch (error) {
      setError('회원가입 실패. 다시 시도해 주세요.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="resister-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit} className="resister-form">
        
        <div className="inputGroup">
          <div className="input-label">이름</div>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="resister-input"
            autoComplete="off" // 자동 완성 비활성화
          />
        </div>

        <div className="inputGroup">
          <div className="input-label">아이디</div>
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={(e) => setId(e.target.value)}
            required
            className="resister-input"
            autoComplete="off" // 자동 완성 비활성화
          />
        </div>

        <div className="inputGroup">
          <div className="input-label">비밀번호</div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="resister-input"
            autoComplete="off" // 자동 완성 비활성화
          />
        </div>

        <div className="inputGroup">
          <div className="input-label">이메일</div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="resister-input"
            autoComplete="off" // 자동 완성 비활성화
          />
        </div>

        <button type="submit" className="resister-button">회원가입</button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">회원가입 성공!</p>}
    </div>
  );
};

export default Resister;
