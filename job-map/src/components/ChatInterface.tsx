import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AIService } from '../services/aiService';
import type { FunctionCallResult } from '../services/aiService';

const StapplyLogo = ({ size = 36 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label="Stapply logo - stacked documents icon"
        style={{ display: 'block' }}
    >
        <rect x="3" y="6" width="14" height="16" rx="2" fill="#3b82f6" opacity="0.3"></rect>
        <rect x="4" y="4" width="14" height="16" rx="2" fill="#3b82f6" opacity="0.8"></rect>
        <rect x="5" y="2" width="14" height="16" rx="2" fill="#2563eb" opacity="0.9"></rect>
        <rect x="7" y="4" width="10" height="3" rx="1" fill="white"></rect>
        <line x1="7" y1="9" x2="17" y2="9" strokeWidth="0.5" stroke="white" opacity="0.6"></line>
        <line x1="7" y1="11" x2="15" y2="11" strokeWidth="0.5" stroke="white" opacity="0.6"></line>
        <line x1="7" y1="13" x2="16" y2="13" strokeWidth="0.5" stroke="white" opacity="0.6"></line>
    </svg>
);

interface ChatInterfaceProps {
    aiService: AIService;
    onClose?: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    functionCalls?: FunctionCallResult[];
    isLoading?: boolean;
}

export function ChatInterface({ aiService, onClose }: ChatInterfaceProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const loadingMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            isLoading: true,
        };
        setMessages(prev => [...prev, loadingMessage]);

        try {
            const response = await aiService.sendMessage(userMessage.content);

            // Remove loading message and add actual response
            setMessages(prev => {
                const filtered = prev.filter(msg => msg.id !== loadingMessage.id);
                return [
                    ...filtered,
                    {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: response.response,
                        functionCalls: response.functionCalls,
                    },
                ];
            });
        } catch (error) {
            // Remove loading message and add error
            setMessages(prev => {
                const filtered = prev.filter(msg => msg.id !== loadingMessage.id);
                return [
                    ...filtered,
                    {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'all 0.2s',
                    padding: '0',
                    overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
            >
                <StapplyLogo size={40} />
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '400px',
                maxWidth: 'calc(100vw - 48px)',
                height: '580px',
                maxHeight: 'calc(100vh - 48px)',
                backgroundColor: '#000000',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StapplyLogo size={24} />
                    <h3
                        style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: '500',
                            color: '#ffffff',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Assistant
                    </h3>
                </div>
                <button
                    onClick={() => {
                        setIsOpen(false);
                        onClose?.();
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '20px',
                        transition: 'all 0.15s',
                        lineHeight: '1',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                    }}
                >
                    ×
                </button>
            </div>

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    backgroundColor: '#000000',
                }}
            >
                {messages.length === 0 && (
                    <div
                        style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '13px',
                            textAlign: 'center',
                            padding: '40px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        <StapplyLogo size={32} />
                        <p style={{ margin: '0', fontWeight: '400', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.5' }}>
                            Ask about jobs or navigate the map
                        </p>
                        <div style={{
                            marginTop: '4px',
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.4)',
                            lineHeight: '1.6',
                        }}>
                            "Show jobs in San Francisco"<br />
                            "Zoom to New York"
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '85%',
                                padding: '10px 14px',
                                borderRadius: message.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                                backgroundColor:
                                    message.role === 'user'
                                        ? '#3b82f6'
                                        : 'rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                                fontSize: '13px',
                                lineHeight: '1.5',
                                wordWrap: 'break-word',
                            }}
                        >
                            {message.isLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            border: '1.5px solid rgba(59, 130, 246, 0.3)',
                                            borderTopColor: '#3b82f6',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                        }}
                                    />
                                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Thinking...</span>
                                </div>
                            ) : (
                                typeof message.content === 'string' ? (
                                    <div className="markdown-content">
                                        <ReactMarkdown
                                            components={{
                                                // Headings
                                                h1: ({ node, ...props }) => (
                                                    <h1 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 12px 0', color: '#ffffff', lineHeight: '1.4' }} {...props} />
                                                ),
                                                h2: ({ node, ...props }) => (
                                                    <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff', lineHeight: '1.4' }} {...props} />
                                                ),
                                                h3: ({ node, ...props }) => (
                                                    <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 8px 0', color: '#ffffff', lineHeight: '1.4' }} {...props} />
                                                ),
                                                // Paragraphs
                                                p: ({ node, ...props }) => (
                                                    <p style={{ margin: '0 0 12px 0', color: '#ffffff', lineHeight: '1.6', fontSize: '13px' }} {...props} />
                                                ),
                                                // Lists
                                                ul: ({ node, ...props }) => (
                                                    <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', color: '#ffffff', fontSize: '13px', lineHeight: '1.6' }} {...props} />
                                                ),
                                                ol: ({ node, ...props }) => (
                                                    <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px', color: '#ffffff', fontSize: '13px', lineHeight: '1.6' }} {...props} />
                                                ),
                                                li: ({ node, ...props }) => (
                                                    <li style={{ margin: '0 0 6px 0', color: '#ffffff', lineHeight: '1.6' }} {...props} />
                                                ),
                                                // Links
                                                a: ({ node, ...props }) => (
                                                    <a
                                                        {...props}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#3b82f6',
                                                            textDecoration: 'underline',
                                                            textDecorationColor: 'rgba(59, 130, 246, 0.4)',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.color = '#60a5fa';
                                                            e.currentTarget.style.textDecorationColor = '#60a5fa';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.color = '#3b82f6';
                                                            e.currentTarget.style.textDecorationColor = 'rgba(59, 130, 246, 0.4)';
                                                        }}
                                                    />
                                                ),
                                                // Code blocks
                                                code: ({ node, inline, ...props }: any) => {
                                                    if (inline) {
                                                        return (
                                                            <code
                                                                style={{
                                                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                                                    color: '#93c5fd',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                                                }}
                                                                {...props}
                                                            />
                                                        );
                                                    }
                                                    return (
                                                        <code
                                                            style={{
                                                                display: 'block',
                                                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                                color: '#e5e7eb',
                                                                padding: '12px',
                                                                borderRadius: '8px',
                                                                fontSize: '12px',
                                                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                                                overflow: 'auto',
                                                                margin: '0 0 12px 0',
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            }}
                                                            {...props}
                                                        />
                                                    );
                                                },
                                                // Pre blocks
                                                pre: ({ node, ...props }) => (
                                                    <pre style={{ margin: '0 0 12px 0', overflow: 'auto' }} {...props} />
                                                ),
                                                // Blockquotes
                                                blockquote: ({ node, ...props }) => (
                                                    <blockquote
                                                        style={{
                                                            margin: '0 0 12px 0',
                                                            paddingLeft: '16px',
                                                            borderLeft: '3px solid rgba(59, 130, 246, 0.5)',
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            fontStyle: 'italic',
                                                        }}
                                                        {...props}
                                                    />
                                                ),
                                                // Strong/Bold
                                                strong: ({ node, ...props }) => (
                                                    <strong style={{ fontWeight: '600', color: '#ffffff' }} {...props} />
                                                ),
                                                // Emphasis/Italic
                                                em: ({ node, ...props }) => (
                                                    <em style={{ fontStyle: 'italic', color: '#ffffff' }} {...props} />
                                                ),
                                                // Horizontal rule
                                                hr: ({ node, ...props }) => (
                                                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '16px 0' }} {...props} />
                                                ),
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    JSON.stringify(message.content)
                                )
                            )}
                        </div>

                        {message.functionCalls && message.functionCalls.length > 0 && (
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    borderRadius: '6px',
                                    marginTop: '4px',
                                }}
                            >
                                {message.functionCalls.map((fc, idx) => (
                                    <div key={idx}>
                                        {fc.name}: {fc.result.message}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
                style={{
                    padding: '14px 16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
            >
                <div style={{
                    display: 'flex',
                    gap: '0',
                    alignItems: 'stretch',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Message..."
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: 'inherit',
                        }}
                        onFocus={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) {
                                container.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                container.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            }
                        }}
                        onBlur={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) {
                                container.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                                container.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                            }
                        }}
                    />
                    <div style={{
                        width: '1px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        margin: '8px 0',
                    }} />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        style={{
                            padding: '0 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: isLoading || !input.trim() ? 'rgba(255, 255, 255, 0.25)' : '#3b82f6',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '60px',
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading && input.trim()) {
                                e.currentTarget.style.color = '#2563eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading && input.trim()) {
                                e.currentTarget.style.color = '#3b82f6';
                            }
                        }}
                    >
                        {isLoading ? (
                            <div style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(59, 130, 246, 0.3)',
                                borderTopColor: '#3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                        ) : (
                            'Send'
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .markdown-content > *:last-child {
          margin-bottom: 0 !important;
        }
      `}</style>
        </div>
    );
}

