import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie, setCookie } from '../Cookies';
import Chatting from '../Component/Chatting/Chatting';
import { Message } from '../Component/Chatting/Types';

const WELCOME_MESSAGE: Message = {
  user: '',
  className: 'self-start',
  text: '안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다.',
  type: 'client',
};

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [showGuestAlert, setShowGuestAlert] = useState(false);
  const [membership, setMembership] = useState('BASIC');
  const navigate = useNavigate();

  useEffect(() => {
    const jwt = getCookie('jwt-token');
    const dismissed = localStorage.getItem('guestAlertDismissed');
    if (jwt && !dismissed) {
      // 멤버십 정보 가져오기
      fetch('/server/user/membership', {
        method: 'GET',
        headers: { Authorization: jwt },
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.membership === 'VIP') {
            setShowGuestAlert(false);
          } else if (data.membership === 'BASIC') {
            setMembership('BASIC');
            setShowGuestAlert(true);
          }
        })
        .catch(() => setShowGuestAlert(true));
    }
  }, []);

  const handleLater = () => {
    setShowGuestAlert(false);
    localStorage.setItem('guestAlertDismissed', '1');
  };

  const handleNow = () => {
    setShowGuestAlert(false);
    navigate('/profile');
  };

  const handleSendMessage = (message: Message) => {
    if (message.type === 'clear_messages') {
      setMessages([WELCOME_MESSAGE]);
    } else {
      setMessages((prevMessages) => [...prevMessages, message]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center w-full justify-center">
        <div className="relative w-full h-[calc(100vh)]">
          <Chatting
            messages={messages}
            setMessages={setMessages}
            onSend={handleSendMessage}
          />
        </div>
      </div>
      {showGuestAlert && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center">
            <h2 className="text-lg font-bold mb-2 text-gray-800">
              게스트 맴버쉽은 {membership}입니다.
            </h2>
            <p className="mb-4 text-gray-700">
              사용 가능한 AI 모델은 Llama 뿐이며,
              <br/>
              GPT, VENICE 모델 사용을 원한다면 
              <br/>
              프로필에서 이메일 인증을 해주십쇼.
              <br/><br/><br/>
              ⚠️ 이메일 인증을 하더라도 게스트 계정은 유지되지 않습니다.
              <br/>
              지속적인 사용을 원하신다면 회원가입을 권장합니다.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                onClick={handleLater}
              >
                나중에 하기
              </button>
              <button
                className="px-4 py-2 bg-[#3b7cc9] text-white rounded hover:bg-[#2d62a0]"
                onClick={handleNow}
              >
                지금하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
