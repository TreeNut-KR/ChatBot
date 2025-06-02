import React, { useRef, useEffect, useState } from 'react';
import { ChatFooterProps } from '../Types';

interface ChatFooterWithModelProps extends ChatFooterProps {
  model: string;
  setModel: (model: string) => void;
}

// 쿠키에서 값을 읽어오는 함수
const getCookieValue = (name: string): string => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return '';
};

const ChatFooter: React.FC<ChatFooterWithModelProps> = ({
  userInput,
  setUserInput,
  handleSubmit,
  isLoading,
  scrollToBottom,
  model,
  setModel,
}) => {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [membership, setMembership] = useState<'BASIC' | 'VIP'>('BASIC');

  // 멤버십 정보 가져오기
  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const jwtToken = getCookieValue('jwt-token');
        const res = await fetch('/server/user/membership', {
          method: 'GET',
          headers: {
            'Authorization': jwtToken || ''
          },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.membership) {
            setMembership(data.membership);
          }
        }
      } catch (e) {
        // 실패 시 기본 BASIC 유지
      }
    };
    fetchMembership();
  }, []);

  // BASIC 사용자가 리스트박스 클릭 시 안내
  const handleSelectClick = (e: React.MouseEvent<HTMLSelectElement>) => {
    if (membership === 'BASIC') {
      alert('이메일 인증을 완료해야 다양한 모델을 사용할 수 있습니다.');
    }
    // VIP일 때는 아무 동작 없음 (alert 없음)
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        fixed bottom-0 left-0 w-full z-[100]
        sm:static sm:z-auto
        bg-[#191924] border-t border-gray-800 flex items-center justify-center
        px-0 py-3 sm:px-0 sm:py-2 gap-2
        shadow-[0_-2px_12px_0_rgba(0,0,0,0.10)]
        sm:bg-transparent sm:border-0 sm:shadow-none
      "
      style={{ maxWidth: '100vw' }}
    >
      <div
        className="
          flex items-center gap-2 w-full max-w-2xl
          sm:gap-4 sm:px-0 sm:py-0 sm:bg-transparent sm:rounded-none sm:border-0 sm:w-full
          px-2
        "
      >
        <select
          ref={selectRef}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          onClick={handleSelectClick}
          className="
            bg-gray-800 text-white px-2 py-1 rounded-lg border border-gray-700 focus:border-indigo-500 cursor-pointer text-sm min-w-[80px] max-w-[100px] h-9 transition
            sm:min-w-[120px] sm:max-w-[140px] sm:text-base sm:py-1 sm:h-9
          "
          aria-label="모델 선택"
        >
          <option value="Llama">Llama</option>
          <option value="gpt4o_mini" disabled={membership !== 'VIP'}>gpt4o_mini</option>
          <option value="gpt4.1" disabled={membership !== 'VIP'}>gpt4.1</option>
          <option value="gpt4.1_mini" disabled={membership !== 'VIP'}>gpt4.1_mini</option>
        </select>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          autoComplete="off"
          className="
            flex-1 px-3 py-1 rounded-lg bg-gray-900 text-white outline-none caret-white h-9 border border-gray-700 focus:border-indigo-500 transition text-base
            sm:px-4 sm:py-1 sm:h-9
          "
          style={{ minWidth: 0 }}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-4 py-1 rounded-lg text-white font-semibold h-9 transition-colors shadow
            ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}
            sm:px-6 sm:py-1 sm:h-9 sm:text-base
          `}
          style={{ minWidth: '60px' }}
        >
          전송
        </button>
      </div>
    </form>
  );
};

export default ChatFooter;