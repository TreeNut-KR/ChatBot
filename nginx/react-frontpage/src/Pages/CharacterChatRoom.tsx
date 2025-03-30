import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../Component/Header/Header';

interface Character {
  id: number;
  uuid: string;
  characterName: string;
  description: string;
  greeting: string;
  image: string;
  characterSetting: string;
}

interface Message {
  id: number;
  sender: 'user' | 'character';
  content: string;
  timestamp: string;
}

const CharacterChatRoom: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`/server/character/${characterId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCharacter(response.data);
        // 인사말 메시지를 초기 메시지로 추가
        if (response.data.greeting) {
          setMessages([
            {
              id: 1,
              sender: 'character',
              content: response.data.greeting,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        setLoading(false);
      } catch (err) {
        console.error('캐릭터 정보를 불러오는데 실패했습니다:', err);
        setError('캐릭터 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchCharacterDetails();
  }, [characterId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !character) return;

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      // 서버로 메시지 전송 및 응답 받기
      const response = await axios.post(
        '/server/chat/message',
        {
          characterId,
          message: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 캐릭터 응답 메시지 추가
      const characterMessage: Message = {
        id: Date.now() + 1,
        sender: 'character',
        content: response.data.response || '응답을 받지 못했습니다.',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, characterMessage]);
    } catch (err) {
      console.error('메시지 전송 중 오류가 발생했습니다:', err);
      // 오류 메시지 추가
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'character',
        content: '메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
        <Header />
        <div className="flex w-full max-w-[1280px] justify-center p-4 text-white text-center py-10">
          로딩 중...
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
        <Header />
        <div className="flex w-full max-w-[1280px] justify-center p-4 text-red-500 text-center py-10">
          {error || '캐릭터 정보를 불러올 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <Header />
      <div className="flex w-full max-w-[1280px] justify-center p-4">
        <div className="w-full h-[calc(100vh-120px)] flex flex-col">
          <div className="flex items-center mb-6 p-4 bg-[#2a2928] rounded-lg">
            <img 
              src={character.image || '/default-character.png'}
              alt={character.characterName}
              className="w-12 h-12 rounded-full object-cover mr-4"
            />
            <div>
              <h2 className="text-xl font-bold text-white">{character.characterName}</h2>
              <p className="text-gray-400 text-sm">{character.description}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-[#2a2928] rounded-lg mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'character' && (
                  <img
                    src={character.image || '/default-character.png'}
                    alt={character.characterName}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                  />
                )}
                <div
                  className={`p-3 rounded-lg max-w-[70%] ${
                    message.sender === 'user'
                      ? 'bg-[#3b7cc9] text-white'
                      : 'bg-[#3f3f3f] text-white'
                  }`}
                >
                  {message.content}
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {message.sender === 'user' && (
                  <img
                    src="/user-avatar.png"
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover ml-2"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#2a2928] rounded-lg">
            <div className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 p-3 rounded-l-lg bg-[#3f3f3f] text-white border-none focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-3 bg-[#3b7cc9] text-white rounded-r-lg hover:bg-[#2d62a0]"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterChatRoom;
