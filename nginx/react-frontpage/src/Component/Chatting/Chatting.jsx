import React, { useState } from 'react';
import './chatting.css';

const ChatHeader = ({ model, setModel }) => (
    <div className="chat-header">
        <h1>TreeNut ChatBot</h1>
        <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="모델 선택">
            <option value="Llama">Llama</option>
            <option value="Bllossom">Bllossom</option>
        </select>
    </div>
);

const ChatMessage = ({ user, text, className }) => (
    <div className={`message ${className}`}>
        {text}
    </div>
);

const ChatContainer = ({ messages, isLoading }) => (
    <div className="chat-container">
        {messages.map((msg, index) => (
            <ChatMessage key={index} user={msg.user} text={msg.text} className={msg.className} />
        ))}
        {isLoading && <ChatMessage user="AI" text="로딩 중..." className="ai-message" />}
    </div>
);

const ChatFooter = ({ userInput, setUserInput, handleSubmit, isLoading }) => (
    <form onSubmit={handleSubmit} className="chat-footer">
        <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            autoComplete="off"
        />
        <button type="submit" disabled={isLoading}>전송</button>
    </form>
);

const Chatting = () => {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [model, setModel] = useState('Llama');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userInput.trim() === '') return;

        appendMessage('나', userInput, 'user-message');
        setUserInput('');
        setIsLoading(true);
        await sendToServer(model, userInput);
        setIsLoading(false);
    };

    const appendMessage = (user, text, className) => {
        setMessages((prevMessages) => [...prevMessages, { user, text, className }]);
    };

    const sendToServer = async (model, inputText) => {
        try {
            const requestBody = model === 'Bllossom'
                ? {
                    input_data: inputText,
                    character_name: "KindBot",
                    description: "친절한 도우미 봇",
                    greeting: "안녕하세요! 무엇을 도와드릴까요?",
                    image: "https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim",
                    character_setting: "친절하고 공손한 봇",
                    tone: "공손한",
                    energy_level: 8,
                    politeness: 10,
                    humor: 5,
                    assertiveness: 3,
                    access_level: true
                }
                : { input_data: inputText };

            const response = await fetch(`http://localhost:8000/${model}_stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error('서버 요청 실패');

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let aiMessage = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                aiMessage += decoder.decode(value);
            }
            appendMessage('AI', aiMessage, 'ai-message');
        } catch (error) {
            appendMessage('시스템', '서버와의 연결 중 문제가 발생했습니다.', 'ai-message');
        }
    };

    return (
        <div className="chatting">
            <ChatHeader model={model} setModel={setModel} />
            <main>
                <ChatContainer messages={messages} isLoading={isLoading} />
            </main>
            <ChatFooter 
                userInput={userInput} 
                setUserInput={setUserInput} 
                handleSubmit={handleSubmit} 
                isLoading={isLoading} 
            />
        </div>
    );
};

export default Chatting;
