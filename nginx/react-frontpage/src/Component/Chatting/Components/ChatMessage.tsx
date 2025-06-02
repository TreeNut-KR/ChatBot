import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../Types';

interface ChatMessageProps extends Message {
  onRetry?: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, className, user, retry, type, onRetry }) => {
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

  if (isIntroMessage) {
    // 환영 메시지는 별도 레이아웃으로 분리 (배경색 제거)
    return (
      <div className="w-full flex justify-center my-6">
        <div className="text-white rounded-xl px-6 py-4 text-center text-[1rem] max-sm:text-[0.9rem] leading-relaxed shadow-none max-w-xl mx-auto bg-transparent">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      className={`
        relative p-3 rounded-lg
        max-w-[70%] max-sm:max-w-[80%]
        break-words mb-6
        text-[1rem] max-sm:text-[0.95rem]
        ${className}
      `}
    >
      {/* 유저 메시지면 메시지 외부 좌측에 재전송 버튼 항상 표시 */}
      {user === "나" && onRetry && (
        <button
          className="absolute top-2 -left-8 px-2 py-1 rounded transition text-lg z-10 text-white"
          title="다시 전송"
          onClick={() => onRetry({ text, className, user, retry, type })}
        >
          ↻
        </button>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // 모바일에서 마크다운 요소들의 텍스트 크기를 더 작게
          p: ({ node, ...props }) => <p className="text-[1.05rem] max-sm:text-[0.8rem]" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-[1.5rem] max-sm:text-[1.05rem] font-bold my-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-[1.3rem] max-sm:text-[1rem] font-bold my-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-[1.1rem] max-sm:text-[0.95rem] font-bold my-1" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-[1rem] max-sm:text-[0.9rem] font-bold my-1" {...props} />,
          ul: ({ node, ...props }) => <ul className="pl-5 max-sm:text-[0.8rem] list-disc my-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="pl-5 max-sm:text-[0.8rem] list-decimal my-2" {...props} />,
          li: ({ node, ...props }) => <li className="my-1 max-sm:my-[0.15rem]" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 pl-3 italic border-gray-400 max-sm:text-[0.8rem]" {...props} />,
          code: ({ node, children, className, ...props }) => {
            const isInline = !(className && className.includes("language-"));
            const codeString = String(children).trim();
            const language = className?.replace("language-", "") || "javascript";
            if (isInline) {
              return (
                <code className="bg-[#222] px-1 py-[0.5px] rounded-sm max-sm:text-[0.7rem]" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="relative my-2">
                <div
                  className="rounded-lg"
                  style={{
                    overflowX: 'auto',
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  <SyntaxHighlighter
                    language={language}
                    style={atomDark}
                    customStyle={{
                      borderRadius: 8,
                      fontSize: window.innerWidth <= 640 ? '0.92rem' : '0.98rem',
                      padding: window.innerWidth <= 640 ? '0.8em 0.7em' : '0.7em 0.8em',
                      margin: 0,
                      background: window.innerWidth <= 640 ? '#23232b' : '#18181b',
                      overflowX: 'auto',
                      minWidth: 600, // 코드블럭이 컨테이너보다 넓게
                      width: 'fit-content', // 코드 길이에 따라 넓이 결정
                      maxWidth: 'none',     // 최대 넓이 제한 해제
                    }}
                    className="whitespace-pre break-normal"
                    wrapLongLines={false}
                    showLineNumbers={window.innerWidth <= 640}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(codeString)}
                  className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded-md hover:bg-gray-600 transition"
                  style={{
                    fontSize: window.innerWidth <= 640 ? '0.7rem' : '0.8rem',
                    padding: window.innerWidth <= 640 ? '2px 6px' : undefined,
                  }}
                >
                  {copied ? "✅ 복사됨" : "📋 복사"}
                </button>
              </div>
            );
          },
          a: ({ node, ...props }) => (
            <a
              style={{ color: "lightblue" }}
              target="_blank"
              rel="noopener noreferrer"
              className="max-sm:text-[0.8rem]"
              {...props}
            />
          ),
          img: ({ node, ...props }) => <img style={{ maxWidth: "100%", borderRadius: "8px" }} {...props} />,
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
