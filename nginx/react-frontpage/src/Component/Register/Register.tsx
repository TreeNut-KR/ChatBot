import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Resister: React.FC = () => {
  const navigate = useNavigate();
  const [Id, setId] = useState<string>(''); 
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>(''); 
  const [email, setEmail] = useState<string>(''); 
  const [idError, setIdError] = useState<string>(''); 
  const [emailError, setEmailError] = useState<string>(''); 

  // 약관 동의 체크박스 상태 추가
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);

  // 약관 페이지 모달 상태
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 50자 제한 검사
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

    // 약관 동의 체크
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

    try {
      const response = await axios.post('/server/user/register', {
        id: Id,
        pw: password,
        name: username,
        email: email,
        chatlog_agree: true,
        user_setting_agree: true,
      });

      if (response.status === 200) {
        window.alert('회원가입 성공!');
        console.log('회원가입 성공:', response.data);

        navigate('/login');
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

  const handleShowPrivacy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowPrivacyModal(true);
  };

  const handleClosePrivacy = () => {
    setShowPrivacyModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-w-0 h-screen bg-[#1A1918]">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white p-8 rounded-lg text-left w-[352px] max-w-xl shadow-lg min-h-[100px] flex flex-col justify-center"
      >
        {/* 우상단 X 버튼 */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
          aria-label="닫기"
        >
          ×
        </button>
        <h2 className="text-black tracking-wide font-bold text-2xl text-center flex justify-center h-[8px] mb-9">
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
            aria-label="이름"
            placeholder="이름을 입력하세요"
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
            placeholder="아이디를 입력하세요"
            aria-label="아이디"
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
            placeholder="비밀번호를 입력하세요"
            aria-label="비밀번호"
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
            placeholder="이메일을 입력하세요"
            aria-label="이메일"
            className="w-full p-2 border-b-2 text-gray-700 border-gray-300 focus:outline-none focus:border-blue-500"
          />
          {emailError && <p className="text-red-600 text-sm mt-2">{emailError}</p>}
        </div>

        {/* 약관 동의 체크박스 */}
        <div className="mb-2 flex items-center">
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
          className="w-full p-2 font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition mt-4"
          disabled={!agreePrivacy || !agreeAge}
        >
          회원가입
        </button>
      </form>

      {/* 약관 모달 */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          style={{ overflow: 'hidden' }} // 외부 스크롤 방지
        >
          <div
            className="bg-transparent p-0 w-[90vw] max-w-2xl relative shadow-none flex justify-center items-center"
            style={{ boxShadow: 'none', background: 'none' }} // 테두리/배경 제거
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

export default Resister;
