'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.css';
import { getCookie, removeCookie } from '../../Cookies';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // props로 받은 isOpen 상태를 내부 상태와 동기화
  useEffect(() => {
    setIsMobileSidebarOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const token = getCookie('jwt-token');
    setIsAuthenticated(!!token);
  }, []);

  const handleNavigation = (path: string) => {
    setIsMobileSidebarOpen(false);
    if (onClose) onClose(); // 부모 컴포넌트에 닫기 알림
    navigate(path);
  };

  const handleLogout = () => {
    removeCookie('jwt-token');
    removeCookie('user_id');
    removeCookie('mongo_chatroomid');
    setIsAuthenticated(false);
    setIsMobileSidebarOpen(false);
    if (onClose) onClose(); // 부모 컴포넌트에 닫기 알림
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

  const isDefaultPage = location.pathname === '/' || location.pathname === '/register';

  // 모바일 사이드바 자체 열기 버튼 (기존 기능 유지)
  const handleMobileSidebarOpen = () => {
    setIsMobileSidebarOpen(true);
  };

  // 사이드바 닫기 핸들러
  const handleCloseSidebar = () => {
    setIsMobileSidebarOpen(false);
    if (onClose) onClose(); // 부모 컴포넌트에 닫기 알림
  };

  return (
    <>
      {/* 기존 모바일 사이드바 열기 버튼 (디폴트 페이지가 아닐 때만 표시) */}
      {!isDefaultPage && !isOpen && ( // isOpen이 false일 때만 표시 (Chatting에서 제어할 때는 숨김)
        <button
          className="fixed top-1/2 left-0 -translate-y-1/2 z-50 sm:hidden 
            bg-indigo-600 opacity-80 shadow-lg rounded-r-md px-2 py-3 
            flex items-center transition-all duration-200 hover:opacity-100
            focus:outline-none focus:ring-2 focus:ring-indigo-400"
          style={{ touchAction: 'manipulation' }}
          onClick={handleMobileSidebarOpen}
          aria-label="사이드바 열기"
          title="사이드바 열기"
        >
          <i className="fas fa-angle-right text-white opacity-90 text-2xl" aria-hidden="true"></i>
        </button>
      )}

      {/* PC 데스크탑 사이드바 (PC에서만 표시) */}
      <aside className="h-screen max-w-20 min-w-15 px-2 py-5 bg-gray-900 hidden sm:flex flex-col justify-between">
        <div className="flex flex-col justify-between h-full">
          <div>
            <div 
              className="mb-4 cursor-pointer hover:opacity-80 transition-opacity duration-200" 
              onClick={() => handleNavigation('/home')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNavigation('/home');
                }
              }}
              aria-label="홈으로 이동"
              title="홈으로 이동"
            >
              <img src="/images/logo.png" alt="TreeNut 로고" className="w-full h-auto" />
            </div>
            <div className="mt-4 flex flex-col gap-5">
              <button
                onClick={() => handleNavigation('/home')}
                className="flex flex-col items-center text-white py-2 
                  hover:bg-gray-700 rounded-md transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="홈으로 이동"
                title="홈으로 이동"
              >
                <span className="p-2 hover:bg-gray-700 hover:rounded-md hover:text-orange-500 
                  flex justify-center items-center w-10 h-10 transition-colors duration-200">
                  <i className="fas fa-search text-lg" aria-hidden="true"></i>
                </span>
                <span className="mt-1 text-sm font-semibold">홈</span>
              </button>
              <button
                onClick={() => handleNavigation('/CharacterChat')}
                className="flex flex-col items-center text-white py-2
                  hover:bg-gray-700 rounded-md transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="캐릭터 챗으로 이동"
                title="캐릭터 챗으로 이동"
              >
                <span className="p-2 hover:bg-gray-700 hover:rounded-md hover:text-orange-500 
                  flex justify-center items-center w-10 h-10 transition-colors duration-200">
                  <i className="fas fa-comments text-lg" aria-hidden="true"></i>
                </span>
                <span className="mt-1 text-sm font-semibold">캐릭터 챗</span>
              </button>
            </div>
          </div>
          <div className="relative flex flex-col items-center mt-auto py-4">
            <button
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="flex flex-col items-center text-white py-2
                hover:bg-gray-700 rounded-md transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="프로필 메뉴"
              title="프로필 메뉴"
              aria-expanded={showAuthOptions}
              aria-haspopup="menu"
            >
              <span className="p-2 hover:bg-gray-700 hover:rounded-md hover:text-orange-500 
                flex justify-center items-center w-10 h-10 transition-colors duration-200">
                <i className="fas fa-user-shield text-lg" aria-hidden="true"></i>
              </span>
              <span className="mt-1 text-sm font-semibold whitespace-nowrap">프로필</span>
            </button>
            {showAuthOptions && isAuthenticated && (
              <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 
                  bg-gray-900 p-3 rounded-md shadow-lg z-50 border border-gray-700 flex gap-2"
                role="menu"
                aria-label="프로필 옵션"
              >
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="flex flex-col items-center text-white hover:bg-gray-700 
                    rounded-md transition-all duration-200 transform hover:scale-105 
                    w-15 h-15 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  role="menuitem"
                  aria-label="개인정보 관리"
                  title="개인정보 관리"
                >
                  <span className="flex justify-center items-center w-full h-8">
                    <i className="fas fa-user text-lg text-orange-500" aria-hidden="true"></i>
                  </span>
                  <span className="mt-1 text-xs font-semibold whitespace-nowrap">개인정보</span>
                </button>
                <button
                  onClick={() => handleNavigation('/mycharacter')}
                  className="flex flex-col items-center text-white hover:bg-gray-700 
                    rounded-md transition-all duration-200 transform hover:scale-105 
                    w-15 h-15 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  role="menuitem"
                  aria-label="내 캐릭터 관리"
                  title="내 캐릭터 관리"
                >
                  <span className="flex justify-center items-center w-full h-8">
                    <i className="fas fa-id-badge text-lg text-orange-500" aria-hidden="true"></i>
                  </span>
                  <span className="mt-1 text-xs font-semibold whitespace-nowrap">내 캐릭터</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center text-white hover:bg-gray-700 
                    rounded-md transition-all duration-200 transform hover:scale-105 
                    w-15 h-15 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  role="menuitem"
                  aria-label="로그아웃"
                  title="로그아웃"
                >
                  <span className="flex justify-center items-center w-full h-8">
                    <i className="fas fa-sign-out-alt text-lg text-orange-500" aria-hidden="true"></i>
                  </span>
                  <span className="mt-1 text-xs font-semibold whitespace-nowrap">로그아웃</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 모바일 오버레이 사이드바 */}
      {!isDefaultPage && isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-[110]"
            onClick={handleCloseSidebar}
            aria-label="사이드바 닫기"
          />
          <aside className="fixed top-0 left-0 h-full w-20 bg-gray-900 z-[120] 
            flex flex-col justify-between items-center px-0 py-5 
            transform transition-all duration-300 ease-out animate-slide-in">
            {/* 상단: 로고 및 메뉴 */}
            <div className="flex flex-col items-center w-full">
              <div 
                className="mb-8 cursor-pointer flex justify-center w-full hover:opacity-80 transition-opacity duration-200" 
                onClick={() => handleNavigation('/home')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleNavigation('/home');
                  }
                }}
                aria-label="홈으로 이동"
                title="홈으로 이동"
              >
                <img src="/images/logo.png" alt="TreeNut 로고" className="w-16 h-auto" />
              </div>
              <button
                onClick={() => handleNavigation('/home')}
                className="flex flex-col items-center text-white py-2 w-full h-16 min-h-14
                  active:bg-gray-700 rounded-md transition-colors duration-200
                  hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="홈으로 이동"
                title="홈으로 이동"
              >
                <span className="p-3 hover:bg-gray-700 hover:rounded-md hover:text-orange-500 
                  flex justify-center items-center w-full h-full transition-colors duration-200">
                  <i className="fas fa-search text-xl" aria-hidden="true"></i>
                </span>
              </button>
              <button
                onClick={() => handleNavigation('/CharacterChat')}
                className="flex flex-col items-center text-white py-2 w-full h-16 min-h-14
                  active:bg-gray-700 rounded-md transition-colors duration-200
                  hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="캐릭터 챗으로 이동"
                title="캐릭터 챗으로 이동"
              >
                <span className="p-3 hover:bg-gray-700 hover:rounded-md hover:text-orange-500 
                  flex justify-center items-center w-full h-full transition-colors duration-200">
                  <i className="fas fa-comments text-xl" aria-hidden="true"></i>
                </span>
              </button>
            </div>
            {/* 하단: 프로필 */}
            <div className="mb-2 w-full flex justify-center relative">
              <button
                className="flex flex-col items-center text-white py-2 w-full h-16 min-h-14
                  active:bg-gray-700 rounded-md transition-colors duration-200
                  hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={() => setShowAuthOptions((prev) => !prev)}
                onMouseEnter={(e) => {
                  if (window.innerWidth >= 640) handleMouseEnter();
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth >= 640) handleMouseLeave();
                }}
                aria-label="프로필 메뉴"
                title="프로필 메뉴"
                aria-expanded={showAuthOptions}
                aria-haspopup="menu"
              >
                <span className="p-3 hover:bg-gray-700 hover:rounded-md hover:text-orange-500 
                  flex justify-center items-center w-full h-full transition-colors duration-200">
                  <i className="fas fa-user-shield text-xl" aria-hidden="true"></i>
                </span>
              </button>
              {showAuthOptions && isAuthenticated && (
                <div
                  className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 
                    bg-gray-900 p-3 rounded-md shadow-lg z-[130] border border-gray-700 
                    flex flex-row gap-2"
                  onMouseEnter={(e) => {
                    if (window.innerWidth >= 640) handleMouseEnter();
                  }}
                  onMouseLeave={(e) => {
                    if (window.innerWidth >= 640) handleMouseLeave();
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  role="menu"
                  aria-label="프로필 옵션"
                >
                  <button
                    onClick={() => {
                      setShowAuthOptions(false);
                      handleNavigation('/profile');
                    }}
                    className="flex flex-col items-center text-white hover:bg-gray-700 
                      rounded-md transition-all duration-200 transform hover:scale-105 
                      w-15 h-15 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    role="menuitem"
                    aria-label="개인정보 관리"
                    title="개인정보 관리"
                  >
                    <span className="flex justify-center items-center w-full h-8">
                      <i className="fas fa-user text-lg text-orange-500" aria-hidden="true"></i>
                    </span>
                    <span className="mt-1 text-xs font-semibold whitespace-nowrap">개인정보</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthOptions(false);
                      handleLogout();
                    }}
                    className="flex flex-col items-center text-white hover:bg-gray-700 
                      rounded-md transition-all duration-200 transform hover:scale-105 
                      w-15 h-15 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    role="menuitem"
                    aria-label="로그아웃"
                    title="로그아웃"
                  >
                    <span className="flex justify-center items-center w-full h-8">
                      <i className="fas fa-sign-out-alt text-lg text-orange-500" aria-hidden="true"></i>
                    </span>
                    <span className="mt-1 text-xs font-semibold whitespace-nowrap">로그아웃</span>
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