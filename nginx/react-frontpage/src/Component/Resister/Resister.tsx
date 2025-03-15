import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Resister: React.FC = () => {
  const [Id, setId] = useState<string>(''); 
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>(''); 
  const [email, setEmail] = useState<string>(''); 
  const [idError, setIdError] = useState<string>(''); 
  const [emailError, setEmailError] = useState<string>(''); 

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
      setId(value);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value)) {
      setEmailError('이메일에 한글을 입력할 수 없습니다.');
    } else {
      setEmailError('');
      setEmail(value);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-[93vw] h-screen bg-[#1A1918]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-12 rounded-md text-left w-[400px]"
      >
        <h2 className="text-black tracking-wide font-bold text-2xl text-center flex  justify-center h-[60px] mb-9">
          회원가입
        </h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">이름</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 border-b-2 border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500"
            autoComplete="off"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">아이디</label>
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={handleIdChange}
            required
            className="w-full p-2 border-b-2 text-gray-700 border-gray-300 focus:outline-none focus:border-blue-500"
          />
          {idError && <p className="text-red-600 text-sm mt-2">{idError}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border-b-2 border-gray-300 focus:outline-none text-gray-700 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">이메일</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="w-full p-2 border-b-2 text-gray-700 border-gray-300 focus:outline-none focus:border-blue-500"
          />
          {emailError && <p className="text-red-600 text-sm mt-2">{emailError}</p>}
        </div>

        <button
          type="submit"
          className="w-full p-2 font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition mt-4"
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

export default Resister;
