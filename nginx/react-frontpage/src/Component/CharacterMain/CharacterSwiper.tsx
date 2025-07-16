'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CharacterSwiper.css';

interface Character {
  characterName: string;
  description: string;
  image: string;
  creator: string;
  uuid: string;
  idx: number;
}

interface ApiResponse {
  status: number;
  message: string;
  data: Character[];
}

interface CharacterSwiperProps {
  onCharacterClick?: (character: Character) => void;
}

const CharacterSwiper: React.FC<CharacterSwiperProps> = ({ onCharacterClick }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 이미지 URL 변환 함수 추가
  const getImageUrl = (image: string) => {
    if (!image) return '/images/default-character.png';
    // 이미지id만 남기고 변환
    // const match = image.match(/([a-zA-Z0-9_-]{20,})$/);
    // if (match) {
    //   return `https://lh3.googleusercontent.com/d/${match[1]}`;
    // }
    return image;
  };

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await axios.get<ApiResponse>('/server/character/public');
        
        if (response.data && response.data.data) {
          const charactersWithCreator = response.data.data.map((char) => ({
            ...char,
            creator: typeof char.creator === 'string' ? char.creator : '',
          }));
          setCharacters(charactersWithCreator);
          console.log('Fetched characters:', charactersWithCreator);
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

  const handleCharacterClick = (character: Character) => {
    if (onCharacterClick) {
      onCharacterClick(character);
    }
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
          onClick={() => handleCharacterClick(character)}
        >
          <div className="character-image-container">
            <img
              src={getImageUrl(character.image)}
              alt={character.characterName}
              className="character-image"
            />
          </div>
          <div className="character-info">
            <p className="character-name">{character.characterName}</p>
            <p className="character-description">
              {truncateText(character.description, 30)}
            </p>
            <p className="character-creator">@{character.creator}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CharacterSwiper;