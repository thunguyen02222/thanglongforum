import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { Send, Trash2, Bot, User, Loader2, Sparkles, Plus, MessageSquare, X } from 'lucide-react';
import { chatbotService } from '@services/chatbot.service';
import { useCurrentUserStore } from 'src/stores';

interface IMessage {
  role: 'user' | 'model';
  content: string;
  createdAt?: string;
}

interface ISession {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser } = useCurrentUserStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = useCallback(async () => {
    try {
      const response: any = await chatbotService.getSessions();
      if (response?.data) {
        setSessions(response.data);
      }
    } catch {
      // silent
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadSessionMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    setActiveSessionId(sessionId);
    setShowSidebar(false);
    try {
      const response: any = await chatbotService.getSessionMessages(sessionId);
      if (response?.data?.messages) {
        setMessages(response.data.messages);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const response: any = await chatbotService.sendMessage(msg, activeSessionId || undefined);
      if (response?.data?.reply) {
        setMessages((prev) => [...prev, { role: 'model', content: response.data.reply }]);
        // Cập nhật activeSessionId nếu là chat mới
        if (!activeSessionId && response.data.sessionId) {
          setActiveSessionId(response.data.sessionId);
        }
        // Reload danh sách sessions
        loadSessions();
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'model', content: 'Có lỗi xảy ra, vui lòng thử lại.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    try {
      await chatbotService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {
      // silent
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  const getTimeDiff = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}p trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h trước`;
    const days = Math.floor(hours / 24);
    return `${days}d trước`;
  };

  return (
    <>
      <Head>
        <title>Trợ lý AI | Thăng Long Forum</title>
      </Head>

      <div className="flex h-[calc(100vh-120px)] max-w-5xl mx-auto gap-0">
        {/* Sidebar - Lịch sử chat */}
        {/* Mobile overlay */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
        )}
        <div className={`${
          showSidebar ? 'fixed inset-y-0 left-0 z-50 w-[280px]' : 'hidden'
        } lg:relative lg:block lg:w-[280px] bg-white border-r border-gray-100 rounded-l-2xl flex-shrink-0 flex flex-col shadow-sm lg:shadow-none`}>
          {/* Sidebar Header */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Cuộc trò chuyện mới
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có cuộc trò chuyện</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => loadSessionMessages(session._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition group flex items-start gap-2 ${
                    activeSessionId === session._id
                      ? 'bg-blue-50 border border-blue-100'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${
                    activeSessionId === session._id ? 'text-blue-600' : 'text-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      activeSessionId === session._id ? 'text-blue-700' : 'text-slate-700'
                    }`}>
                      {session.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{getTimeDiff(session.updatedAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, session._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-md transition shrink-0"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white rounded-tr-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">Trợ lý AI</h1>
                <p className="text-[11px] text-slate-500">Hỏi đáp thông minh</p>
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Chat mới
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Xin chào! 👋</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Mình là trợ lý AI của diễn đàn. Hãy hỏi mình bất cứ điều gì về học tập, cuộc sống đại học nhé!
                </p>
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {['Cách học hiệu quả?', 'Tư vấn môn học', 'Tips thi cử'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100 hover:bg-blue-100 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-slate-50 text-slate-800 border border-gray-100 rounded-bl-md'
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg shrink-0 mt-0.5 overflow-hidden">
                      {currentUser?.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                          {currentUser?.name?.substring(0, 2).toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-100 bg-white rounded-br-2xl">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi của bạn..."
                  rows={1}
                  className="w-full resize-none bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  style={{ maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
