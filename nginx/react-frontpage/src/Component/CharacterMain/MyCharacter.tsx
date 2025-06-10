import React, { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "../../Cookies";
import CharacterDetailModal from "./CharacterDetailModal"; // 모달 import

interface Character {
  characterName: string;
  description: string;
  image: string;
  creator: string;
  uuid: string;
  idx: number;
}

const MyCharacter: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const fetchMyCharacters = async () => {
      const token = getCookie("jwt-token");
      if (!token) {
        setLoading(false);
        setError("로그인이 필요합니다.");
        setCharacters([]);
        return;
      }
      try {
        const res = await axios.get<any[]>(
          "/server/character/mycharacter",
          {
            headers: { Authorization: token },
          }
        );
        if (Array.isArray(res.data)) {
          const mapped = res.data.map((item, idx) => ({
            characterName: item.character_name ?? "",
            description: item.description ?? "",
            image: item.image ?? "",
            creator: item.username ?? "",
            uuid: item.uuid ?? String(idx),
            idx: idx,
          }));
          setCharacters(mapped);
          setError("");
        } else {
          setCharacters([]);
          setError("캐릭터 정보를 불러오지 못했습니다.");
        }
      } catch (e) {
        setCharacters([]);
        setError("캐릭터 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyCharacters();
  }, []);

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleCloseModal = () => {
    setSelectedCharacter(null);
  };

  const handleChat = (uuid: string) => {
    // 원하는 채팅 이동 로직 작성
    // 예: window.location.href = `/chat/${uuid}`;
    setSelectedCharacter(null);
  };

  if (loading)
    return (
      <div className="text-center py-10 text-lg font-semibold text-gray-500">
        로딩 중...
      </div>
    );
  if (error)
    return (
      <div className="text-center py-10 text-red-500">{error}</div>
    );
  if (!characters.length)
    return (
      <div className="text-center py-10 text-gray-400">
        내 캐릭터가 없습니다.
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-14">
      <div className="flex flex-col items-start mb-12">
        <h2 className="text-white text-4xl sm:text-5xl font-extrabold mb-2">
          내 캐릭터
        </h2>
        <p className="text-gray-400 text-lg">대화하고 싶은 캐릭터를 선택하세요</p>
      </div>
      <div className="character-grid-container">
        {characters.map((c) => (
          <div
            className="character-card flex flex-col items-center cursor-pointer"
            key={c.uuid}
            onClick={() => handleCardClick(c)}
          >
            <div className="character-image-container mb-4">
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.characterName}
                  className="character-image"
                />
              ) : (
                <span className="text-5xl text-blue-200 font-extrabold flex items-center justify-center w-full h-full">?</span>
              )}
            </div>
            <p className="character-name text-white font-extrabold text-xl text-center mb-2">{c.characterName}</p>
            <p className="character-description text-gray-300 text-center mb-1">
              {c.description.length > 30 ? c.description.slice(0, 30) + '...' : c.description}
            </p>
            <p className="character-creator text-gray-400 text-center">@{c.creator}</p>
          </div>
        ))}
      </div>
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={handleCloseModal}
          onChat={handleChat}
        />
      )}
    </div>
  );
};

export default MyCharacter;