import React from 'react';

interface Room {
    roomid: string;
    Title: string;
    character_name: string;
    character_img: string;
}

interface Props {
    rooms: Room[];
    isOpen: boolean;
    onClose: () => void;
    onSelectRoom: (roomid: string) => void;
}

const CharacterChatSidebar: React.FC<Props> = ({ rooms, isOpen, onClose, onSelectRoom }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* 불투명 배경 */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
                aria-label="채팅방 목록 닫기"
            />
            {/* 사이드바 */}
            <div className="fixed top-0 right-0 h-full w-80 bg-[#232323] shadow-lg z-50 transition-transform duration-300 ease-in-out flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">내 채팅방</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl" aria-label="닫기">×</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {rooms.length === 0 ? (
                        <div className="text-gray-400 text-sm">채팅방이 없습니다.</div>
                    ) : (
                        <ul>
                            {rooms.map((room) => (
                                <li
                                    key={room.roomid}
                                    className="flex items-center gap-2 hover:bg-[#353535] rounded px-2 py-1 cursor-pointer mb-1"
                                    title={room.Title}
                                    onClick={() => onSelectRoom(room.roomid)}
                                >
                                    <img
                                        src={
                                            !room.character_img || room.character_img === '/images/default-character.png'
                                                ? '/images/default-character.png'
                                                : room.character_img
                                        }
                                        alt={room.character_name}
                                        className="w-8 h-8 rounded-full object-cover border border-gray-600"
                                        style={{ minWidth: 32, minHeight: 32 }}
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white font-semibold text-sm truncate">{room.character_name}</span>
                                        <span className="text-gray-300 text-xs truncate">
                                            {room.Title && room.Title.trim() !== "" ? room.Title : "대화 내용이 없습니다."}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

export default CharacterChatSidebar;