import React, { useState } from 'react';

// onSend 함수가 문자열을 인수로 받는다는 타입 정의
interface ChattingMainProps {
  onSend: (message: string) => void;
}

const ChattingMain: React.FC<ChattingMainProps> = ({ onSend }) => {
  const [message, setMessage] = useState<string>('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="relative flex flex-col items-center bg-gray-500 bg-opacity-50 w-[55%] h-[10vh] max-h-[50vh] mt-[24vh] ml-[20%] p-5 overflow-y-auto rounded-[20px]">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder="무엇을 도와드릴까요?"
        className="w-full p-2 rounded-xl text-black outline-none mb-2"
      />
      <button onClick={handleSend} className="w-full p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 focus:outline-none">
        전송
      </button>
    </div>
  );
};

export default ChattingMain;
