'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CharacterSwiper.css';

interface Character {
  characterName: string;
  description: string;
  image: string;
  creator: string; // 만든 사람 이름
}

interface ApiResponse {
  status: number;
  message: string;
  data: Character[];
}

const CharacterSwiper: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await axios.get<ApiResponse>('/server/character/public');
        
        if (response.data && response.data.data) {
          setCharacters(response.data.data);
        } else {
          setCharacters([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('캐릭터 정보를 불러오는데 실패했습니다:', err);
        setError('캐릭터 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  const handleCharacterClick = (characterName: string) => {
    navigate(`/chat/${characterName}`);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  if (loading) {
    return <div className="text-white text-center py-10">캐릭터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  if (characters.length === 0) {
    return <div className="text-white text-center py-10">사용 가능한 캐릭터가 없습니다.</div>;
  }

  return (
    <div className="character-grid-container">
      {characters.map((character, index) => (
        <div
          key={index}
          className="character-card"
          onClick={() => handleCharacterClick(character.characterName)} // 카드 클릭 시 이동
        >
          <div className="character-image-container">
            <img
              src={character.image || '/default-character.png'}
              alt={character.characterName}
              className="character-image"
            />
          </div>
          <div className="character-info">
            <p className="character-name">{character.characterName}</p>
            <p className="character-description">
              {truncateText(character.description, 30)}
            </p>
            <p className="character-creator">@{character.creator}</p> {/* 만든 사람 이름 */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CharacterSwiper;
