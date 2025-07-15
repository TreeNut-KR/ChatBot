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
        <div className="relative w-[90vw] max-w-4xl h-[90vh] max-h-[800px] bg-[#2a2928] rounded-lg p-4 sm:p-6 md:p-8 shadow-lg text-white overflow-y-auto flex flex-col">
            <button
                className="absolute top-4 right-4 text-gray-300 hover:text-white text-4xl w-10 h-10 flex items-center justify-center"
                onClick={onClose}
                aria-label="닫기"
            >
                ×
            </button>
            
            {/* 고정 높이 컨텐츠들 */}
            <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-center mb-2 mt-6">{character.characterName}</h2>
                <p className="text-gray-400 text-center mb-4">@{character.creator}</p>
            </div>
            
            {/* 이미지 영역 - 남는 공간 사용 */}
            <div className="flex-1 flex items-center justify-center mb-4 min-h-0">
                <img
                    src={character.image || '/images/default-character.png'}
                    alt={character.characterName}
                    className="max-w-full max-h-full w-auto h-auto rounded-lg object-contain"
                    style={{ aspectRatio: '1/1' }}
                />
            </div>
            
            {/* 고정 높이 컨텐츠들 */}
            <div className="flex-shrink-0">
                <p className="mb-4">{character.description}</p>
                <button
                    className="w-full py-3 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0]"
                    onClick={() => onChat(character.uuid)}
                >
                    이 캐릭터와 채팅하기
                </button>
            </div>
        </div>
    </div>
);

export default CharacterDetailModal;