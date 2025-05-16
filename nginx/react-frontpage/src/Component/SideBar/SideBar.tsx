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

  // 슬라이드 핸들 관련 상태
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // 슬라이드 핸들 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // 필요시 슬라이드 진행 중 UI 효과 추가 가능
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      // 40px 이상 오른쪽으로 슬라이드하면 오픈
      if (touchEndX - touchStartX > 40) {
        setIsMobileSidebarOpen(true);
      }
    }
    setTouchStartX(null);
  };

  // 현재 경로가 '/'(디폴트페이지) 또는 '/register'(회원가입)인지 확인
  const isDefaultPage = location.pathname === '/' || location.pathname === '/register';

  return (
    <>
      {/* 모바일에서만 좌측 슬라이드 핸들 및 터치 인식: 디폴트페이지('/') 또는 '/register'에서는 숨김 */}
      {!isDefaultPage && (
        <>
          <div
            className="fixed top-0 left-0 h-full w-1.5 z-40 sm:hidden opacity-80 shadow-[4px_0_8px_0_rgba(0,0,0,0.10)] bg-[#RC0057]"
            style={{ touchAction: 'pan-y' }}
          >
            {/* 화살표 아이콘을 항상 중앙에 고정 */}
            <div className="fixed top-1/2 left-0 -translate-y-1/2 z-50 pointer-events-none select-none">
              <i className="fas fa-angle-right text-white opacity-80 text-lg"></i>
            </div>
          </div>
          <div
            className="fixed top-0 left-0 h-full w-1/2 z-30 sm:hidden"
            style={{ touchAction: 'pan-y', background: 'transparent' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="사이드바 열기"
          />
        </>
      )}

      {/* 데스크탑 사이드바 */}
      <aside className="h-screen max-w-[80px] min-w-[60px] px-2 py-5 bg-[#161514] hidden sm:flex flex-col justify-between">
        {sidebarContent}
      </aside>

      {/* 모바일 오버레이 사이드바: 디폴트페이지('/') 또는 '/register'에서는 숨김 */}
      {!isDefaultPage && isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 sm:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-[72px] bg-[#161514] z-50 flex flex-col justify-between items-center px-0 py-5 sm:hidden animate-slideIn transition-all duration-300">
            {/* 상단: 로고 및 메뉴 */}
            <div className="flex flex-col items-center w-full">
              <div className="mb-8 cursor-pointer flex justify-center w-full" onClick={() => handleNavigation('/home')}>
                <img src="/images/logo.png" alt="Logo" className="w-14 h-auto" />
              </div>
              <button
                onClick={() => handleNavigation('/home')}
                className="flex flex-col items-center text-white py-2 w-full"
              >
                <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
                  <i className="fas fa-search fa-lg"></i>
                </span>
              </button>
              <button
                onClick={() => handleNavigation('/CharacterChat')}
                className="flex flex-col items-center text-white py-2 w-full"
              >
                <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
                  <i className="fas fa-comments fa-lg"></i>
                </span>
              </button>
            </div>
            {/* 하단: 프로필 */}
            <div className="mb-2 w-full flex justify-center">
              <button
                className="flex flex-col items-center text-white py-2 w-full"
                onClick={() => handleNavigation('/profile')}
              >
                <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
                  <i className="fas fa-user-shield fa-lg"></i>
                </span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;