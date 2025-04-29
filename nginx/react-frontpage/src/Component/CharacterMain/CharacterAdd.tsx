import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import { getCookie } from '../../Cookies';

const CharacterAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [characterData, setCharacterData] = useState({
    character_name: '',
    description: '',
    greeting: '',
    image: '',
    character_setting: '',
    accessLevel: false,
    tags: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCharacterData({
        ...characterData,
        [name]: checked
      });
    } else {
      setCharacterData({
        ...characterData,
        [name]: value
      });
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = value
      .split(",")
      .map(tag => tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`)
      .join(", ");
    setCharacterData({
      ...characterData,
      tags: formattedValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // JWT 토큰을 localStorage 대신 쿠키에서 가져옵니다.
      const token = getCookie('jwt-token');
      
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('/server/character/add', characterData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
      
      if (response.data.status >= 200 && response.data.status < 300) {
        setSuccess('캐릭터가 성공적으로 추가되었습니다.');
        // 폼 초기화
        setCharacterData({
          character_name: '',
          description: '',
          greeting: '',
          image: '',
          character_setting: '',
          accessLevel: false,
          tags: ''
        });
        
        // 성공 메시지 표시 후 캐릭터 목록 페이지로 리디렉션
        setTimeout(() => {
          navigate('/character');
        }, 2000);
      } else {
        setError('캐릭터 추가에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <Header />
      <div className="flex w-full max-w-[1280px] justify-center p-4">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-white mb-6">캐릭터 추가</h1>
          
          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500 text-white p-4 rounded-lg mb-6">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-[#2a2928] rounded-lg p-6">
            <div className="mb-4">
              <label htmlFor="character_name" className="block text-white font-medium mb-2">
                캐릭터 이름
              </label>
              <input
                type="text"
                id="character_name"
                name="character_name"
                value={characterData.character_name}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9]"
                placeholder="캐릭터 이름을 입력하세요"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-white font-medium mb-2">
                캐릭터 설명
              </label>
              <textarea
                id="description"
                name="description"
                value={characterData.description}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9] min-h-[100px]"
                placeholder="캐릭터에 대한 설명을 입력하세요"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="greeting" className="block text-white font-medium mb-2">
                시작 인사말
              </label>
              <textarea
                id="greeting"
                name="greeting"
                value={characterData.greeting}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9] min-h-[100px]"
                placeholder="캐릭터의 첫 인사말을 입력하세요"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="image" className="block text-white font-medium mb-2">
                캐릭터 이미지 URL
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={characterData.image}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9]"
                placeholder="이미지 URL을 입력하세요"
              />
              {characterData.image && (
                <div className="mt-2">
                  <img 
                    src={characterData.image} 
                    alt="캐릭터 미리보기" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#3b7cc9]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-character.png';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="character_setting" className="block text-white font-medium mb-2">
                캐릭터 성격 및 설정
              </label>
              <textarea
                id="character_setting"
                name="character_setting"
                value={characterData.character_setting}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9] min-h-[150px]"
                placeholder="캐릭터의 성격, 배경, 지식 등 상세한 설정을 입력하세요"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="tags" className="block text-white font-medium mb-2">
                태그 (콤마로 구분, 자동으로 # 추가)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={characterData.tags}
                onChange={handleTagChange}
                className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9]"
                placeholder="예: 모험, 판타지, 전사"
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  name="accessLevel"
                  checked={characterData.accessLevel}
                  onChange={handleChange}
                  className="mr-2 h-5 w-5 rounded accent-[#3b7cc9]"
                />
                비공개로 설정하기
              </label>
              <p className="text-gray-400 text-sm mt-1">
                체크하면 다른 사용자에게 공개되지 않습니다.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/character')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mr-3"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0] disabled:bg-gray-500"
              >
                {loading ? '처리 중...' : '캐릭터 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CharacterAdd;