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
        ${user === "나" 
          ? "relative p-3 rounded-lg max-w-[80%] max-sm:max-w-[85%] break-words mb-6 text-[1rem] max-sm:text-[0.95rem]"
          : "relative p-0 max-w-[90%] max-sm:max-w-[95%] break-words mb-6 text-[1rem] max-sm:text-[0.95rem] bg-transparent border-none"
        }
        ${user === "나" ? className : ""}
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
      
      {/* AI 답변용 아바타 및 컨테이너 */}
      {user !== "나" && (
        <div className="flex items-start gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            AI
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-300 text-sm font-medium mb-1">Assistant</div>
          </div>
        </div>
      )}
      
      <div className={user === "나" ? "" : "ml-11"}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // 모바일에서 마크다운 요소들의 텍스트 크기를 더 작게
            p: ({ node, ...props }) => <p className={`${user === "나" ? "text-[1.05rem] max-sm:text-[0.8rem]" : "text-gray-100 text-[1rem] max-sm:text-[0.9rem] leading-relaxed mb-3"}`} {...props} />,
            h1: ({ node, ...props }) => <h1 className={`${user === "나" ? "text-[1.5rem] max-sm:text-[1.05rem] font-bold my-2" : "text-gray-100 text-[1.4rem] max-sm:text-[1.2rem] font-bold my-3"}`} {...props} />,
            h2: ({ node, ...props }) => <h2 className={`${user === "나" ? "text-[1.3rem] max-sm:text-[1rem] font-bold my-2" : "text-gray-100 text-[1.2rem] max-sm:text-[1.1rem] font-bold my-3"}`} {...props} />,
            h3: ({ node, ...props }) => <h3 className={`${user === "나" ? "text-[1.1rem] max-sm:text-[0.95rem] font-bold my-1" : "text-gray-100 text-[1.1rem] max-sm:text-[1rem] font-bold my-2"}`} {...props} />,
            h4: ({ node, ...props }) => <h4 className={`${user === "나" ? "text-[1rem] max-sm:text-[0.9rem] font-bold my-1" : "text-gray-100 text-[1rem] max-sm:text-[0.95rem] font-bold my-2"}`} {...props} />,
            ul: ({ node, ...props }) => <ul className={`pl-5 list-disc my-2 ${user === "나" ? "max-sm:text-[0.8rem]" : "text-gray-100 max-sm:text-[0.9rem]"}`} {...props} />,
            ol: ({ node, ...props }) => <ol className={`pl-5 list-decimal my-2 ${user === "나" ? "max-sm:text-[0.8rem]" : "text-gray-100 max-sm:text-[0.9rem]"}`} {...props} />,
            li: ({ node, ...props }) => <li className={`my-1 max-sm:my-[0.15rem] ${user !== "나" ? "text-gray-100" : ""}`} {...props} />,
            blockquote: ({ node, ...props }) => <blockquote className={`border-l-4 pl-3 italic my-2 ${user === "나" ? "border-gray-400 max-sm:text-[0.8rem]" : "border-blue-400 text-gray-200 max-sm:text-[0.9rem]"}`} {...props} />,
            code: ({ node, children, className, ...props }) => {
              const isInline = !(className && className.includes("language-"));
              const codeString = String(children).trim();
              const language = className?.replace("language-", "") || "javascript";
              if (isInline) {
                return (
                  <code className={`px-1 py-[0.5px] rounded-sm max-sm:text-[0.7rem] ${user === "나" ? "bg-[#222]" : "bg-gray-700 text-gray-100"}`} {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <div className="relative my-4">
                  <div
                    className="rounded-lg overflow-hidden"
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
                        background: '#1a1a1a',
                        overflowX: 'auto',
                        minWidth: 600,
                        width: 'fit-content',
                        maxWidth: 'none',
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
                className={`underline hover:no-underline transition-all max-sm:text-[0.8rem] ${user === "나" ? "text-blue-400" : "text-blue-300"}`}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            img: ({ node, ...props }) => <img className="max-w-full rounded-lg my-2" alt="" {...props} />,
          }}
        >
          {String(text)}
        </ReactMarkdown>
      </div>
      
      {/* 꼬리표를 유저 메시지에만 표시 */}
      {!isIntroMessage && user === "나" && (
        <div
          className="absolute right-[-12px] bottom-2 w-0 h-0 border-t-[12px] border-b-[12px] border-l-[14px]"
          style={{ 
            borderTopColor: "transparent", 
            borderBottomColor: "transparent",
            borderLeftColor: messageBgColor || "currentColor"
          }}
        ></div>
      )}
    </div>
  );
};

export default ChatMessage;
