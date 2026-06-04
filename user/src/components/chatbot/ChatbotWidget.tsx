import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Plus, Trash2, MessageCircle, Loader2, ChevronLeft } from 'lucide-react';
import { chatbotService } from '@services/chatbot.service';
import { useCurrentUserStore } from 'src/stores';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface Session {
  _id: string;
  title: string;
  updatedAt: string;
}

export default function ChatbotWidget() {
  const { currentUser } = useCurrentUserStore();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Không hiển thị nếu chưa đăng nhập
  if (!currentUser) return null;

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await chatbotService.getSessions();
      setSessions((res as any)?.data || (res as any) || []);
    } catch {}
    setSessionsLoading(false);
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const res = await chatbotService.getSessionMessages(sessionId);
      const data = (res as any)?.data || (res as any);
      const msgs: Message[] = (data?.messages || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'bot',
        content: m.content
      }));
      setMessages(msgs);
      setActiveSessionId(sessionId);
      setShowHistory(false);
      scrollToBottom();
    } catch {}
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setShowHistory(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await chatbotService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        setMessages([]);
        setActiveSessionId(null);
      }
    } catch {}
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    scrollToBottom();
    setLoading(true);
    try {
      const res = await chatbotService.sendMessage(text, activeSessionId || undefined);
      const data = (res as any)?.data || (res as any);
      if (!activeSessionId && data?.sessionId) {
        setActiveSessionId(data.sessionId);
      }
      setMessages(prev => [...prev, { role: 'bot', content: data?.reply || 'Không có phản hồi' }]);
      scrollToBottom();
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: '⚠️ Lỗi khi gửi tin nhắn. Thử lại sau.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    try {
      const res = await chatbotService.getSessions();
      const list = (res as any)?.data || (res as any) || [];
      setSessions(list);
      if (list.length > 0 && messages.length === 0 && !activeSessionId) {
        await loadSessionMessages(list[0]._id);
      }
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-white border-[3px] border-blue-500 shadow-2xl hover:shadow-blue-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center group chatbot-float-btn"
          title="Trợ lý AI"
        >
          <img src="/iconchatbot.png" alt="AI" className="w-11 h-11 object-contain drop-shadow-lg chatbot-icon-shake" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[400px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {showHistory && (
                <button onClick={() => setShowHistory(false)} className="text-white/80 hover:text-white transition mr-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-9 h-9 rounded-full bg-white border-2 border-blue-400 flex items-center justify-center overflow-hidden">
                <img src="/iconchatbot.png" alt="AI" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-white font-bold text-[15px] leading-tight">Trợ lý AI</h3>
                <p className="text-blue-200 text-[11px] font-medium">Thăng Long Forum</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setShowHistory(true); loadSessions(); }} className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition" title="Lịch sử">
                <MessageCircle className="w-4 h-4" />
              </button>
              <button onClick={handleNewChat} className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition" title="Chat mới">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition" title="Đóng">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {showHistory ? (
            /* Session History */
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lịch sử trò chuyện</h4>
              {sessionsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Chưa có cuộc trò chuyện nào</p>
              ) : (
                <div className="space-y-1.5">
                  {sessions.map(s => (
                    <div
                      key={s._id}
                      onClick={() => loadSessionMessages(s._id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition group ${
                        activeSessionId === s._id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{s.title || 'Cuộc trò chuyện'}</p>
                        <p className="text-[11px] text-slate-400">{new Date(s.updatedAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, s._id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Chat Messages */
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-20 h-20 rounded-full bg-white border-[3px] border-blue-500 flex items-center justify-center mb-4 shadow-sm">
                    <img src="/iconchatbot.png" alt="AI" className="w-14 h-14 object-contain chatbot-robot-wave" />
                  </div>
                  <h4 className="text-base font-bold text-slate-700 mb-1">Xin chào! 👋</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Tôi là trợ lý AI. Hãy hỏi bất cứ điều gì về học tập nhé!</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {['Giải thích OOP', 'SQL cơ bản', 'React là gì?'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 100); }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-full text-xs font-semibold transition border border-slate-200 hover:border-blue-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-white border-[1.5px] border-blue-500 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                      <img src="/iconchatbot.png" alt="AI" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-700 rounded-bl-md'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden text-[10px] font-bold text-slate-500">
                      {currentUser?.avatarUrl
                        ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" alt="" />
                        : getInitials(currentUser?.name || '')
                      }
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white border-[1.5px] border-blue-500 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="/iconchatbot.png" alt="AI" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Bar */}
          {!showHistory && (
            <div className="px-4 pb-4 pt-2 shrink-0 border-t border-gray-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi..."
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white flex items-center justify-center transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <style jsx>{`
            .animate-in {
              animation: chatSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes chatSlideIn {
              from { opacity: 0; transform: translateY(16px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .chatbot-icon-shake {
              animation: iconBellShake 3s ease-in-out infinite;
              transform-origin: top center;
            }
            @keyframes iconBellShake {
              0% { transform: rotate(0deg); }
              2% { transform: rotate(15deg); }
              4% { transform: rotate(-13deg); }
              6% { transform: rotate(12deg); }
              8% { transform: rotate(-10deg); }
              10% { transform: rotate(8deg); }
              12% { transform: rotate(-5deg); }
              14% { transform: rotate(3deg); }
              16% { transform: rotate(0deg); }
              100% { transform: rotate(0deg); }
            }
            .chatbot-float-btn:hover .chatbot-icon-shake {
              animation: none;
              transform: scale(1.1);
            }
            .chatbot-robot-wave {
              animation: robotWave 2s ease-in-out infinite;
            }
            @keyframes robotWave {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(5deg); }
              75% { transform: rotate(-5deg); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
