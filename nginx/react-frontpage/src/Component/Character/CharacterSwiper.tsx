import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Character {
  character_name: string;
  userid: string;
  description: string;
  image: string;
}

const CharacterSwiper: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/server/character/public');
        if (response.data?.data) {
          setCharacters(response.data.data);
        } else {
          setError('응답 데이터 형식이 올바르지 않습니다');
        }
      } catch (error) {
        setError('캐릭터 정보를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  if (loading) return <div className="text-center p-4">캐릭터 정보를 불러오는 중...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
  if (characters.length === 0) return <div className="text-center p-4">표시할 캐릭터가 없습니다</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {characters.map((character, index) => (
        <div
          key={index}
          className="border rounded-lg shadow-md p-4 flex flex-col items-center"
        >
          <img
            src={character.image || '/default_character.png'}
            alt={character.character_name}
            className="w-32 h-32 object-cover rounded-full mb-4"
            onError={(e) => { (e.target as HTMLImageElement).src = '/default_character.png'; }}
          />
          <h3 className="text-lg font-semibold">{character.character_name}</h3>
          <p className="text-sm text-gray-600">{character.description || '설명이 없습니다.'}</p>
        </div>
      ))}
    </div>
  );
};

export default CharacterSwiper;
