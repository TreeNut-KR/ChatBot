import React, { useState } from 'react';

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
    onDeleteRooms?: (roomIds: string[]) => void; // 일괄 삭제 콜백 추가
}

const CharacterChatSidebar: React.FC<Props> = ({
    rooms,
    isOpen,
    onClose,
    onSelectRoom,
    onDeleteRooms,
}) => {
    const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

    if (!isOpen) return null;

    const toggleRoom = (roomid: string) => {
        setSelectedRooms((prev) =>
            prev.includes(roomid)
                ? prev.filter((id) => id !== roomid)
                : [...prev, roomid]
        );
    };

    const handleDelete = () => {
        if (selectedRooms.length === 0) return;
        if (
            window.confirm(
                `선택한 ${selectedRooms.length}개의 채팅방을 삭제하시겠습니까?`
            )
        ) {
            onDeleteRooms?.(selectedRooms);
            setSelectedRooms([]);
        }
    };

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
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {rooms.length === 0 ? (
                        <div className="text-gray-400 text-sm">채팅방이 없습니다.</div>
                    ) : (
                        <ul>
                            {rooms.map((room) => (
                                <li
                                    key={room.roomid}
                                    className={`flex items-center gap-2 rounded px-2 py-1 cursor-pointer mb-1 ${
                                        selectedRooms.includes(room.roomid)
                                            ? 'bg-[#3b7cc9]/30'
                                            : 'hover:bg-[#353535]'
                                    }`}
                                    title={room.Title}
                                    onClick={() => toggleRoom(room.roomid)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedRooms.includes(room.roomid)}
                                        onChange={() => toggleRoom(room.roomid)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="accent-[#3b7cc9]"
                                    />
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
                                    <div className="flex flex-col min-w-0 flex-1" onClick={() => onSelectRoom(room.roomid)}>
                                        <span className="text-white font-semibold text-sm truncate">{room.character_name}</span>
                                        <span className="text-gray-300 text-xs truncate">
                                            {room.Title && room.Title.trim() !== "" ? room.Title : "대화 내용이 없습니다."
                                            }
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* 일괄 삭제 버튼 */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        className="w-full text-gray-500 hover:text-red-500 text-lg px-2 py-2 rounded transition-colors border border-gray-600 hover:border-red-500"
                        aria-label="선택한 채팅방 삭제"
                        disabled={selectedRooms.length === 0}
                        onClick={handleDelete}
                    >
                        × 선택한 채팅방 삭제
                    </button>
                </div>
            </div>
        </>
    );
};

export default CharacterChatSidebar;