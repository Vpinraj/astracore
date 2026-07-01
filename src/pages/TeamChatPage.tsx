import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';
import { GroupChat, GroupChatMessage, Agent, Employee } from '../types';
import { Send, Plus, Users, Search, MessageSquare, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export const TeamChatPage: React.FC = () => {
  const agents = useAppSelector((state) => state.agents.items) || [];
  const employees = useAppSelector((state) => state.crm.employees) || [];
  
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Polling for chats and active chat messages
  useEffect(() => {
    fetchChats();
    const interval = setInterval(() => {
      fetchChats();
      if (activeChatId) fetchMessages(activeChatId);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChatId]);

  const fetchChats = async () => {
    try {
      const data = await api.fetchTeamChats();
      setChats(data);
      if (data.length > 0 && !activeChatId) {
        setActiveChatId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const data = await api.fetchTeamChatMessages(chatId);
      setMessages(data);
      
      // If the last message is from an agent, turn off thinking loader
      if (data.length > 0 && data[data.length - 1].senderType === 'agent') {
        setIsThinking(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this group chat?')) return;
    try {
      await api.deleteTeamChat(chatId);
      setChats(chats.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      // Use a short timeout to ensure DOM has fully painted the new message content
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, isThinking]);

  const handleCreateChat = async () => {
    const name = prompt('Enter group chat name:');
    if (!name) return;
    try {
      const newChat = await api.createTeamChat({ name, participantIds: [] });
      setChats([...chats, newChat]);
      setActiveChatId(newChat.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChatId) return;
    try {
      const tempMsg = inputText;
      setInputText('');
      setIsThinking(true);
      await api.sendTeamChatMessage(activeChatId, {
        senderId: 'user',
        senderName: 'Director',
        senderType: 'user',
        content: tempMsg
      });
      fetchMessages(activeChatId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions) {
      const filtered = getFilteredMentions();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filtered[mentionIndex]) {
          insertMention(filtered[mentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
      return; // prevent handleSendMessage on enter when selecting mention
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Mention logic
    const lastAtMatch = val.match(/@(\w*)$/);
    if (lastAtMatch) {
      setShowMentions(true);
      setMentionFilter(lastAtMatch[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const getFilteredMentions = () => {
    const list = [
      ...agents.map(a => ({ id: a.id, name: a.name.replace(/ /g, ''), role: a.role, type: 'Agent' })),
      ...agents.map(a => ({ id: a.id, name: a.role.replace(/ /g, ''), role: a.role, type: 'Role' })),
      ...employees.map(e => ({ id: e.id, name: e.name.replace(/ /g, ''), role: e.designation, type: 'Employee' }))
    ];
    // deduplicate just in case
    const unique = Array.from(new Map(list.map(item => [item.name, item])).values());
    
    if (!mentionFilter) return unique;
    return unique.filter(m => m.name.toLowerCase().includes(mentionFilter));
  };

  const insertMention = (mention: any) => {
    const parts = inputText.split(/@\w*$/);
    const newText = parts[0] + '@' + mention.name + ' ';
    setInputText(newText);
    setShowMentions(false);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-full w-full bg-zinc-950/40 rounded-3xl border border-zinc-800/50 overflow-hidden shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-300">
      {/* Sidebar */}
      <div className="w-72 md:w-80 bg-zinc-900/40 border-r border-zinc-800/50 flex flex-col backdrop-blur-md relative z-10">
        <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/20">
              <MessageSquare size={16} className="text-white" />
            </div>
            Team Chat
          </h2>
          <button
            onClick={handleCreateChat}
            className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-all hover:scale-105 active:scale-95 border border-zinc-700/50"
            title="Create New Chat"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full text-left px-3 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 group cursor-pointer ${
                activeChatId === chat.id
                  ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-purple-100 border border-purple-500/30 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors duration-300 ${activeChatId === chat.id ? 'bg-purple-500/30 text-purple-200' : 'bg-zinc-800/60 text-zinc-500 group-hover:text-zinc-300 group-hover:bg-zinc-700'}`}>
                <Users size={18} />
              </div>
              <span className="font-semibold truncate flex-1">{chat.name}</span>
              <button
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400 ${activeChatId === chat.id ? 'text-purple-300' : 'text-zinc-500'}`}
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-950/60 relative min-h-0">
        {activeChat ? (
          <>
            <div className="p-5 border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl flex items-center shadow-sm z-10 shrink-0">
              <h3 className="text-xl font-bold text-zinc-100 tracking-wide">{activeChat.name}</h3>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950/40 to-zinc-950">
              {messages.map((msg) => {
                const isSystemUser = msg.senderType === 'user';
                return (
                  <div key={msg.id} className={`flex flex-col animate-in slide-in-from-bottom-2 duration-300 ${isSystemUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1.5 px-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        {msg.senderName} 
                        <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[9px] font-mono text-zinc-500 normal-case">{msg.senderType}</span>
                      </span>
                    </div>
                    <div
                      className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-xl text-[14px] leading-relaxed transition-transform hover:scale-[1.01] ${
                        isSystemUser
                          ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm border border-purple-500/20'
                          : 'bg-zinc-800/80 backdrop-blur-md text-zinc-200 border border-zinc-700/50 rounded-tl-sm'
                      }`}
                    >
                      {isSystemUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none text-zinc-200 prose-p:leading-relaxed prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-zinc-700/50">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex flex-col items-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-1.5 px-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      Agent <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[9px] font-mono text-zinc-500 normal-case">thinking</span>
                    </span>
                  </div>
                  <div className="max-w-[75%] px-5 py-4 rounded-2xl shadow-xl bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-tl-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Mentions */}
            <div className="p-4 md:p-6 border-t border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl relative shrink-0">
              {/* Mention Dropdown */}
              {showMentions && (
                <div className="absolute bottom-full mb-3 left-6 w-72 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="px-4 py-3 bg-zinc-950/50 text-xs font-bold text-zinc-400 flex items-center gap-2 border-b border-zinc-800/80">
                    <Search size={14} className="text-purple-400" /> Search network members
                  </div>
                  <div className="max-h-56 overflow-y-auto p-2 custom-scrollbar">
                    {getFilteredMentions().map((mention, i) => (
                      <button
                        key={i}
                        onClick={() => insertMention(mention)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                          i === mentionIndex ? 'bg-purple-600/20 text-purple-200' : 'text-zinc-300 hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="font-semibold text-[13px]">@{mention.name}</span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider px-2 py-0.5 bg-zinc-950 rounded-md">{mention.type}</span>
                      </button>
                    ))}
                    {getFilteredMentions().length === 0 && (
                      <div className="px-4 py-6 text-sm text-zinc-500 text-center font-medium">No matches found</div>
                    )}
                  </div>
                </div>
              )}

              <div className="relative flex items-center max-w-4xl mx-auto">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type a message... Use @ to mention agents or employees"
                  className="w-full bg-zinc-950/60 border border-zinc-700/50 text-zinc-100 rounded-full pl-6 pr-14 py-4 text-[14px] outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60 transition-all shadow-inner backdrop-blur-md"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="absolute right-2 p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95"
                >
                  <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/30">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-center shadow-2xl">
              <MessageSquare size={40} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">Team Communication</h3>
            <p className="text-sm max-w-xs text-center">Select an existing conversation from the sidebar or create a new group chat to begin collaborating.</p>
          </div>
        )}
      </div>
    </div>
  );
};
