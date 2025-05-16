import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [Id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [idError, setIdError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username.length > 50) {
      window.alert('이름은 50글자 이상 들어갈 수 없습니다');
      return;
    }
    if (Id.length > 50) {
      window.alert('아이디는 50글자 이상 들어갈 수 없습니다');
      return;
    }
    if (password.length > 50) {
      window.alert('비밀번호는 50글자 이상 들어갈 수 없습니다');
      return;
    }
    if (email.length > 50) {
      window.alert('이메일은 50글자 이상 들어갈 수 없습니다');
      return;
    }
    if (!agreePrivacy) {
      window.alert('개인정보 사용 동의에 체크해 주세요.');
      return;
    }
    if (!agreeAge) {
      window.alert('14세 이상임에 체크해 주세요.');
      return;
    }
    if (!Id || !email || !password || !username || idError || emailError) {
      window.alert('입력된 값에 오류가 있습니다. 다시 확인해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/server/user/register', {
        id: Id,
        pw: password,
        name: username,
        email: email,
        privacy_policy: agreePrivacy,
        terms_of_service: agreeAge,
      });

      if (response.status === 200) {
        window.alert('회원가입 성공!');
        navigate('/home');
      }
    } catch (error) {
      window.alert('회원가입 실패. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
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

  const handleShowPrivacy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowPrivacyModal(true);
  };

  const handleClosePrivacy = () => {
    setShowPrivacyModal(false);
  };

  return (
    <div className="login-container">
      <form
        className="bg-white py-14 px-10 rounded-lg text-left w-full max-w-xl md:max-w-2xl lg:max-w-3xl shadow-lg relative"
        onSubmit={handleSubmit}
      >
        {/* X 버튼 */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
          aria-label="닫기"
        >
          ×
        </button>
        <div className="flex justify-center items-center mb-1">
          <h2 className="text-green-600 text-2xl whitespace-nowrap">회원가입</h2>
        </div>
        <h2 className="text-center text-sm mb-3 text-gray-600">
          아래 정보를 입력하고 회원가입을 완료하세요
        </h2>
        <div className="mb-2 sm:mb-1">
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 sm:px-4 border text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300"
            autoComplete="off"
            aria-label="이름"
            placeholder="이름"
          />
        </div>
        <div className="mb-2 sm:mb-1">
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={handleIdChange}
            required
            placeholder="아이디"
            aria-label="아이디"
            className="w-full p-2 sm:px-4 border text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300"
          />
          {idError && <p className="text-red-600 text-sm mt-2">{idError}</p>}
        </div>
        <div className="mb-2 sm:mb-1">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="비밀번호"
            aria-label="비밀번호"
            className="w-full p-2 sm:px-4 border text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300"
          />
        </div>
        <div className="mb-2 sm:mb-1">
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            placeholder="이메일"
            aria-label="이메일"
            className="w-full p-2 sm:px-4 border text-gray-700 border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300"
          />
          {emailError && <p className="text-red-600 text-sm mt-2">{emailError}</p>}
        </div>
        <div className="mb-3 flex items-center">
          <input
            type="checkbox"
            id="agreePrivacy"
            checked={agreePrivacy}
            onChange={(e) => setAgreePrivacy(e.target.checked)}
            className="mr-2"
            required
          />
          <label htmlFor="agreePrivacy" className="text-sm text-gray-800">
            개인정보 사용 동의
          </label>
          <button
            type="button"
            onClick={handleShowPrivacy}
            className="ml-2 text-blue-600 underline text-xs"
            tabIndex={-1}
          >
            약관보기
          </button>
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="agreeAge"
            checked={agreeAge}
            onChange={(e) => setAgreeAge(e.target.checked)}
            className="mr-2"
            required
          />
          <label htmlFor="agreeAge" className="text-sm text-gray-800">
            14세 이상입니다
          </label>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full font-semibold tracking-wider py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-green-400"
        >
          {isLoading ? '가입 중...' : '회원가입'}
        </button>
      </form>
      {/* 약관 모달 */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          style={{ overflow: 'hidden' }}
        >
          <div
            className="bg-transparent p-0 w-[90vw] max-w-2xl relative shadow-none flex justify-center items-center"
            style={{ boxShadow: 'none', background: 'none' }}
          >
            <div
              className="bg-white rounded-lg w-full h-[60vh] relative overflow-hidden"
              style={{ boxShadow: '0 0 0 0', padding: 0, background: 'none' }}
            >
              <button
                onClick={handleClosePrivacy}
                className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl z-10"
                aria-label="닫기"
              >
                ×
              </button>
              <iframe
                src="/privacy?modal=1"
                title="개인정보 처리방침"
                className="w-full h-full border-none"
                style={{
                  background: '#1A1918',
                  colorScheme: 'dark',
                  minHeight: '60vh',
                  overflow: 'auto',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;