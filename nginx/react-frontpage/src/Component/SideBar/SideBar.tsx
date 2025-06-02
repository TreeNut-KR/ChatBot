'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation 추가
import '@fortawesome/fontawesome-free/css/all.css';
import { getCookie, removeCookie } from '../../Cookies';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 추가
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getCookie('jwt-token');
    setIsAuthenticated(!!token);
  }, []);

  const handleNavigation = (path: string) => {
    setIsMobileSidebarOpen(false); // 모바일에서 메뉴 클릭 시 닫기
    navigate(path);
  };

  const handleLogout = () => {
    removeCookie('jwt-token');
    removeCookie('user_id');
    removeCookie('mongo_chatroomid');
    setIsAuthenticated(false);
    setIsMobileSidebarOpen(false);
    navigate('/home');
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

  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // 사이드바 내용 분리
  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="mb-4 cursor-pointer" onClick={() => handleNavigation('/home')}>
          <img src="/images/logo.png" alt="Logo" className="w-full h-auto" />
        </div>
        <div className="mt-4 flex flex-col gap-5">
          <button
            onClick={() => handleNavigation('/home')}
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
        {showAuthOptions && isAuthenticated && (
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-[#161514] p-3 rounded-md shadow-lg z-50 border border-[#2A2927] flex gap-2"
          >
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
          </div>
        )}
      </div>
    </div>
  );

  // 현재 경로가 '/'(디폴트페이지) 또는 '/register'(회원가입)인지 확인
  const isDefaultPage = location.pathname === '/' || location.pathname === '/register';

  // 모바일 사이드바 열기 버튼 추가
  const handleMobileSidebarOpen = () => {
    setIsMobileSidebarOpen(true);
  };

  return (
    <>
      {/* 모바일에서만 좌측 사이드바 열기 버튼: 디폴트페이지('/') 또는 '/register'에서는 숨김 */}
      {!isDefaultPage && (
        <button
          className="fixed top-1/2 left-0 -translate-y-1/2 z-50 sm:hidden bg-[#RC0057] opacity-80 shadow-[4px_0_8px_0_rgba(0,0,0,0.10)] rounded-r-md px-2 py-3 flex items-center"
          style={{ touchAction: 'manipulation' }}
          onClick={handleMobileSidebarOpen}
          aria-label="사이드바 열기"
        >
          <i className="fas fa-angle-right text-white opacity-90 text-2xl"></i>
        </button>
      )}

      {/* 데스크탑 사이드바 */}
      <aside className="h-screen max-w-[80px] min-w-[60px] px-2 py-5 bg-[#161514] hidden sm:flex flex-col justify-between">
        {sidebarContent}
      </aside>

      {/* 모바일 오버레이 사이드바: 디폴트페이지('/') 또는 '/register'에서는 숨김 */}
      {!isDefaultPage && isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-[110] sm:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-[80px] bg-[#161514] z-[120] flex flex-col justify-between items-center px-0 py-5 sm:hidden animate-slideIn transition-all duration-300"
          >
            {/* 상단: 로고 및 메뉴 */}
            <div className="flex flex-col items-center w-full">
              <div className="mb-8 cursor-pointer flex justify-center w-full" onClick={() => handleNavigation('/home')}>
                <img src="/images/logo.png" alt="Logo" className="w-16 h-auto" />
              </div>
              <button
                onClick={() => handleNavigation('/home')}
                className="flex flex-col items-center text-white py-2 w-full h-16 active:bg-[#2A2927] rounded-md transition"
                style={{ minHeight: 56 }}
              >
                <span className="p-3 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-full h-full">
                  <i className="fas fa-search fa-xl"></i>
                </span>
              </button>
              <button
                onClick={() => handleNavigation('/CharacterChat')}
                className="flex flex-col items-center text-white py-2 w-full h-16 active:bg-[#2A2927] rounded-md transition"
                style={{ minHeight: 56 }}
              >
                <span className="p-3 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-full h-full">
                  <i className="fas fa-comments fa-xl"></i>
                </span>
              </button>
            </div>
            {/* 하단: 프로필 */}
            <div className="mb-2 w-full flex justify-center relative">
              <button
                className="flex flex-col items-center text-white py-2 w-full h-16 active:bg-[#2A2927] rounded-md transition"
                onClick={() => setShowAuthOptions((prev) => !prev)}
                onMouseEnter={(e) => {
                  if (window.innerWidth >= 640) handleMouseEnter();
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth >= 640) handleMouseLeave();
                }}
                style={{ minHeight: 56 }}
              >
                <span className="p-3 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-full h-full">
                  <i className="fas fa-user-shield fa-xl"></i>
                </span>
              </button>
              {showAuthOptions && isAuthenticated && (
                <div
                  className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-[#161514] p-3 rounded-md shadow-lg z-[130] border border-[#2A2927] flex flex-row gap-2"
                  onMouseEnter={(e) => {
                    if (window.innerWidth >= 640) handleMouseEnter();
                  }}
                  onMouseLeave={(e) => {
                    if (window.innerWidth >= 640) handleMouseLeave();
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setShowAuthOptions(false);
                      handleNavigation('/profile');
                    }}
                    className="flex flex-col items-center text-white hover:bg-[#2A2927] rounded-md transition-transform duration-200 transform hover:scale-105 w-[60px] h-[60px]"
                  >
                    <span className="flex justify-center items-center w-full h-full">
                      <i className="fas fa-user fa-lg text-[#FFA500]"></i>
                    </span>
                    <span className="mt-1 text-[14px] font-semibold whitespace-nowrap">개인정보</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthOptions(false);
                      handleLogout();
                    }}
                    className="flex flex-col items-center text-white hover:bg-[#2A2927] rounded-md transition-transform duration-200 transform hover:scale-105 w-[60px] h-[60px]"
                  >
                    <span className="flex justify-center items-center w-full h-full">
                      <i className="fas fa-sign-out-alt fa-lg text-[#FFA500]"></i>
                    </span>
                    <span className="mt-1 text-[14px] font-semibold whitespace-nowrap">로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;