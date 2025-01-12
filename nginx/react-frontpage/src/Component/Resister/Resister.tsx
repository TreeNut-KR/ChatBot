import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './resister.css';

const Resister: React.FC = () => {
  const [Id, setId] = useState<string>(''); // 아이디
  const [password, setPassword] = useState<string>(''); // 비밀번호
  const [username, setUsername] = useState<string>(''); // 이름
  const [email, setEmail] = useState<string>(''); // 이메일
  const [idError, setIdError] = useState<string>(''); // 아이디 경고 메시지
  const [emailError, setEmailError] = useState<string>(''); // 이메일 경고 메시지

  useEffect(() => {
    setId('');
    setPassword('');
    setUsername('');
    setEmail('');
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!Id || !email || idError || emailError) {
      window.alert('입력된 값에 오류가 있습니다. 다시 확인해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/server/user/register', {
        id: Id,
        pw: password,
        name: username,
        email: email,
      });

      if (response.status === 200) {
        window.alert('회원가입 성공!');
        console.log('회원가입 성공:', response.data);
      }
    } catch (error) {
      window.alert('회원가입 실패. 다시 시도해 주세요.');
      console.error('Error:', error);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value)) {
      setIdError('아이디에 한글을 입력할 수 없습니다.');
    } else {
      setIdError('');
      setId(value); // 한글이 아닌 경우에만 상태 업데이트
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value)) {
      setEmailError('이메일에 한글을 입력할 수 없습니다.');
    } else {
      setEmailError('');
      setEmail(value); // 한글이 아닌 경우에만 상태 업데이트
    }
  };

  return (
    <div className="resister-container">
      <form onSubmit={handleSubmit} className="resister-form">
        <h2 className="title_text">회원가입</h2>
        <div className="inputGroup">
          <div className="input-label">이름</div>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="resister-input"
            autoComplete="off"
          />
        </div>

        <div className="inputGroup">
          <div className="input-label">아이디</div>
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={handleIdChange}
            required
            className="resister-input"
            autoComplete="off"
          />
          {idError && <p className="error-message">{idError}</p>}
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
            autoComplete="off"
          />
        </div>

        <div className="inputGroup">
          <div className="input-label">이메일</div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="resister-input"
            autoComplete="off"
          />
          {emailError && <p className="error-message">{emailError}</p>}
        </div>

        <button type="submit" className="resister-button">회원가입</button>
      </form>
    </div>
  );
};

export default Resister;
