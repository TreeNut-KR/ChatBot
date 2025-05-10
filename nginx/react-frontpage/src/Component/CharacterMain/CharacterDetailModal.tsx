import React from 'react';

interface Character {
    idx: number;
    uuid: string;
    characterName: string;
    description: string;
    image: string;
    greeting?: string;
    creator?: string;
}

interface Props {
    character: Character;
    onClose: () => void;
    onChat: (uuid: string) => void;
}

const CharacterDetailModal: React.FC<Props> = ({ character, onClose, onChat }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="relative w-full max-w-xl bg-[#2a2928] rounded-lg p-8 shadow-lg text-white">
            <button
                className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl"
                onClick={onClose}
                aria-label="닫기"
            >
                ×
            </button>
            <img
                src={character.image || '/images/default-character.png'}
                alt={character.characterName}
                className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-center mb-2">{character.characterName}</h2>
            <p className="text-gray-400 text-center mb-4">@{character.creator}</p>
            <p className="mb-4">{character.description}</p>
            {character.greeting && (
                <div className="bg-gray-700 rounded p-4 mb-4">
                    <span className="font-semibold">인사말:</span> {character.greeting}
                </div>
            )}
            <button
                className="w-full py-3 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0] mt-4"
                onClick={() => onChat(character.uuid)}
            >
                이 캐릭터와 채팅하기
            </button>
        </div>
    </div>
);

export default CharacterDetailModal;