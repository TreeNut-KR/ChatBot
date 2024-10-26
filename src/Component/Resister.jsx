import React, { useState } from 'react';
import './resister.css'; // CSS 파일 임포트

const Resister = () => {
  const [Id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
    

  const handleSubmit = (e) => {
    e.preventDefault();
    // 로그인 처리 로직을 여기에 추가
    console.log('Id:', Id);
    console.log('Password:', password);
    console.log('UserName:', username);
    console.log('E-mail:', email);
  };

  return (
    <div className="login-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit} className="login-form">

      <div className="inputGroup">
          <label htmlFor="username">이름:</label>
          <input
            type="username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="login-input"
          />
        </div>

        <div className="inputGroup">
          <label htmlFor="Id">아이디:</label>
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={(e) => setId(e.target.value)}
            required
            className="login-input"
          />
        </div>

        
        <div className="inputGroup">
          <label htmlFor="password">비밀번호:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>



        <div className="inputGroup">
          <label htmlFor="email">이메일:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </div>

        <button type="submit" className="login-button">회원가입</button>
      </form>
    </div>
  );
};

export default Resister;
