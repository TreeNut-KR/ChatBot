'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.css';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt-token');
    setIsAuthenticated(!!token);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    // JWT 토큰 삭제
    localStorage.removeItem('jwt-token');
    setIsAuthenticated(false);
    // 로그인 페이지로 리다이렉트
    navigate('/login');
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowAuthOptions(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowAuthOptions(false);
    }, 300);
    setHoverTimeout(timeout);
  };

  return (
    <aside className="h-screen max-w-[80px] min-w-[60px] px-2 py-5 bg-[#161514] flex flex-col justify-between">
      <div>
        <div className="mb-4 cursor-pointer" onClick={() => handleNavigation('/')}>
          <img src="/images/logo.png" alt="Logo" className="w-full h-auto" />
        </div>
        <div className="mt-4 flex flex-col gap-5">
          <button
            onClick={() => handleNavigation('/')}
            className="flex flex-col items-center text-white py-2"
          >
            <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
              <i className="fas fa-search fa-lg"></i>
            </span>
            <span className="mt-1 text-[14px] font-semibold">홈</span>
          </button>

          <button
            onClick={() => handleNavigation('/CharacterChat')}
            className="flex flex-col items-center text-white py-2"
          >
            <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
              <i className="fas fa-comments fa-lg"></i>
            </span>
            <span className="mt-1 text-[14px] font-semibold">캐릭터 챗</span>
          </button>
        </div>
      </div>
      <div className="relative flex flex-col items-center mt-auto py-4">
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex flex-col items-center text-white py-2"
        >
          <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
            <i className="fas fa-user-shield fa-lg"></i>
          </span>
          <span className="mt-1 text-[14px] font-semibold whitespace-nowrap">프로필</span>
        </button>
        {showAuthOptions && (
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-[#161514] p-3 rounded-md shadow-lg z-50 border border-[#2A2927] flex gap-2"
          >
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="flex flex-col items-center text-white hover:bg-[#2A2927] rounded-md transition-transform duration-200 transform hover:scale-105 w-[60px] h-[60px]"
                >
                  <span className="flex justify-center items-center w-full h-full">
                    <i className="fas fa-user fa-lg text-[#FFA500]"></i>
                  </span>
                  <span className="mt-1 text-[14px] font-semibold whitespace-nowrap">개인정보</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center text-white hover:bg-[#2A2927] rounded-md transition-transform duration-200 transform hover:scale-105 w-[60px] h-[60px]"
                >
                  <span className="flex justify-center items-center w-full h-full">
                    <i className="fas fa-sign-out-alt fa-lg text-[#FFA500]"></i>
                  </span>
                  <span className="mt-1 text-[14px] font-semibold whitespace-nowrap">로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation('/login')}
                  className="flex flex-col items-center text-white hover:bg-[#2A2927] rounded-md transition-transform duration-200 transform hover:scale-105 w-[60px] h-[60px]"
                >
                  <span className="flex justify-center items-center w-full h-full">
                    <i className="fas fa-sign-in-alt fa-lg text-[#FFA500]"></i>
                  </span>
                  <span className="mt-1 text-[14px] font-semibold whitespace-nowrap">로그인</span>
                </button>
                <button
                  onClick={() => handleNavigation('/resister')}
                  className="flex flex-col items-center text-white hover:bg-[#2A2927] rounded-md transition-transform duration-200 transform hover:scale-105 w-[60px] h-[60px]"
                >
                  <span className="flex justify-center items-center w-full h-full">
                    <i className="fas fa-user-plus fa-lg text-[#FFA500]"></i>
                  </span>
                  <span className="mt-1 text-[14px] font-semibold whitespace-nowrap">회원가입</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
