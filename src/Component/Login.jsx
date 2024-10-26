import React, { useState } from 'react';
import './login.css'; // CSS 파일 임포트r

const Login = () => {
  const [Id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    /*try {
      const response = await axios.post('https://localhost')
    } catch (error) {
      
    }*/

    console.log('Id:', Id);
    console.log('Password:', password);
  };

  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form onSubmit={handleSubmit} className="login-form">
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
        <button type="submit" className="login-button">로그인</button>
        <button type="submit" className="login-button">회원가입</button>
      </form>
    </div>
  );
};

export default Login;
