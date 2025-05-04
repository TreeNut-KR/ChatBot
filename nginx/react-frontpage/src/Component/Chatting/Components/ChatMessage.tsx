import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessageProps } from '../Types';

const ChatMessage: React.FC<ChatMessageProps> = ({ text, className, user }) => {
  const isIntroMessage =
    text.includes("안녕하세요, 반갑습니다.") && text.includes("TreeNut 챗봇");

  const [copied, setCopied] = useState(false);
  const [messageBgColor, setMessageBgColor] = useState("");
  const messageRef = useRef<HTMLDivElement>(null);

  // 메시지 배경색 가져오기
  useEffect(() => {
    if (messageRef.current) {
      const computedStyle = window.getComputedStyle(messageRef.current);
      setMessageBgColor(computedStyle.backgroundColor);
    }
  }, [className]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2초 후 원래대로
    });
  };

  // 꼬리표 색상 추출 함수
  const getTailColorClass = (className: string | undefined, direction: 'left' | 'right') => {
    if (!className) return '';
    const bgClass = className.split(' ').find(c => c.startsWith('bg-'));
    if (!bgClass) return '';
    // bg-indigo-500 -> border-l-indigo-500 또는 border-r-indigo-500
    return direction === 'left'
      ? bgClass.replace('bg-', 'border-r-')
      : bgClass.replace('bg-', 'border-l-');
  };

  // 꼬리표 색상 추출 함수 (bg- 색상값을 실제 hex로 변환)
  const getTailColorStyle = (className: string | undefined) => {
    if (!className) return {};
    const bgClass = className.split(' ').find(c => c.startsWith('bg-'));
    if (!bgClass) return {};
    // Tailwind의 주요 색상만 매핑 (필요시 추가)
    const colorMap: { [key: string]: string } = {
      'bg-indigo-500': '#4F46E5',
      'bg-blue-500': '#3b82f6',
      'bg-gray-600': '#4b5563',
      'bg-purple-500': '#a21caf',
      'bg-green-500': '#22c55e',
      // 필요시 추가
    };
    return { borderLeftColor: colorMap[bgClass] || '#6366f1', borderRightColor: colorMap[bgClass] || '#6366f1' };
  };

  return (
    <div ref={messageRef} className={`relative p-3 rounded-lg max-w-[70%] break-words ${className} mb-6`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ node, ...props }) => (
            <a 
              style={{ color: "lightblue" }} 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ), 
          img: ({ node, ...props }) => <img style={{ maxWidth: "100%", borderRadius: "8px" }} {...props} />, 
          code: ({ node, children, className, ...props }) => {
            const isInline = !(className && className.includes("language-"));
            const codeString = String(children).trim();
            const language = className?.replace("language-", "") || "javascript"; // 기본값 JavaScript

            return isInline ? (
              <code style={{ backgroundColor: "#222", padding: "2px 5px", borderRadius: "4px" }} {...props}>
                {children}
              </code>
            ) : (
              <div className="relative">
                <SyntaxHighlighter language={language} style={atomDark} className="rounded-lg p-4">
                  {codeString}
                </SyntaxHighlighter>
                {/* 복사 버튼 */}
                <button
                  onClick={() => copyToClipboard(codeString)}
                  className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded-md hover:bg-gray-600 transition"
                >
                  {copied ? "✅ Copied!" : "📋 Copy"}
                </button>
              </div>
            );
          },
        }}
      >
        {String(text)}
      </ReactMarkdown>
      {/* 꼬리표를 메시지 박스 뒤에 출력 */}
      {!isIntroMessage && (
        user === "나" ? (
          <div
            className="absolute right-[-12px] bottom-2 w-0 h-0 border-t-[12px] border-b-[12px] border-l-[14px]"
            style={{ 
              borderTopColor: "transparent", 
              borderBottomColor: "transparent",
              borderLeftColor: messageBgColor || "currentColor"
            }}
          ></div>
        ) : (
          <div
            className="absolute left-[-12px] bottom-2 w-0 h-0 border-t-[12px] border-b-[12px] border-r-[14px]"
            style={{ 
              borderTopColor: "transparent", 
              borderBottomColor: "transparent",
              borderRightColor: messageBgColor || "currentColor"
            }}
          ></div>
        )
      )}
    </div>
  );
};

export default ChatMessage;