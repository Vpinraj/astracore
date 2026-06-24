import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeAgentChat, toggleAgentChatFullScreen, openAgentChat, closeAgentChatTab } from '../store/slices/agentSlice';
import { Mic, MicOff, Send, X, Maximize2, Minimize2, Sparkles, User, Loader2, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { api } from '../api';
import { ConversationMessage } from '../types';

export const AgentChatWindow: React.FC = () => {
  const dispatch = useAppDispatch();
  const agents = useAppSelector(state => state.agents.items);
  const activeChatAgentId = useAppSelector(state => state.agents.activeChatAgentId);
  const openChatIds = useAppSelector(state => state.agents.openChatIds);
  const isFullScreen = useAppSelector(state => state.agents.isChatFullScreen);

  const [chatHistories, setChatHistories] = useState<Record<string, ConversationMessage[]>>({});
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const activeAgent = agents.find(a => a.id === activeChatAgentId);

  useEffect(() => {
    if (activeAgent && !chatHistories[activeAgent.id]) {
      // Initialize with a greeting if empty
      setChatHistories(prev => ({
        ...prev,
        [activeAgent.id]: [{
          role: 'assistant',
          content: `Hello. I am ${activeAgent.name}, serving as ${activeAgent.role}. How can I assist you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      }));
    }
  }, [activeAgent?.id, chatHistories]);

  const currentMessages = activeAgent ? (chatHistories[activeAgent.id] || []) : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isFullScreen]);

  // Handle clicking outside add menu (simplified for now by just toggling, in a real app use an outside click hook)

  if (openChatIds.length === 0) return null;

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !activeAgent) return;
    
    const agentId = activeAgent.id;

    const userMessage: ConversationMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistories((prev) => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), userMessage]
    }));
    setInputText('');
    setIsLoading(true);

    try {
      const historyToSend = chatHistories[agentId] || [];
      const res = await api.chatWithAgent(agentId, text, historyToSend);
      
      if (res.messages && Array.isArray(res.messages)) {
        const newMessages = res.messages.map((m: any) => ({
          role: m.role || 'assistant',
          content: m.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setChatHistories((prev) => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []), ...newMessages]
        }));
      } else {
        setChatHistories((prev) => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []), {
            role: 'assistant',
            content: res.content || 'Error: Empty response from AI.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        }));
      }
    } catch (error) {
      console.error(error);
      setChatHistories((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] || []), {
          role: 'system',
          content: 'Failed to connect to the agent network. Is the backend running?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const windowClasses = isFullScreen
    ? "fixed inset-0 z-50 flex flex-col bg-zinc-950"
    : "fixed right-0 top-0 h-screen w-full sm:w-[400px] z-50 border-l border-zinc-800 bg-zinc-950 flex flex-col shadow-2xl glass-panel-glow animate-in slide-in-from-right duration-300";

  return (
    <div className={windowClasses}>
      
      {/* Tabs Header */}
      <div className="flex items-center gap-1 overflow-x-auto p-2 bg-zinc-950 border-b border-zinc-800 shrink-0 custom-scrollbar">
        {openChatIds.map(id => {
          const tabAgent = agents.find(a => a.id === id);
          if (!tabAgent) return null;
          const isActive = activeChatAgentId === id;
          return (
            <div 
              key={id}
              onClick={() => dispatch(openAgentChat({ agentId: id }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer shrink-0 transition-colors ${isActive ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
            >
              <span className="truncate max-w-[100px]">{tabAgent.name}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(closeAgentChatTab(id));
                }}
                className="text-zinc-500 hover:text-red-400 ml-1"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        
        {/* Add Chat Dropdown */}
        <div className="relative ml-auto">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            title="Start new chat"
          >
            <Plus size={16} />
          </button>
          {showAddMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 text-xs font-semibold text-zinc-400 border-b border-zinc-700 uppercase tracking-wider">Available Agents</div>
                <div className="max-h-60 overflow-y-auto">
                  {agents.filter(a => !openChatIds.includes(a.id)).map(a => (
                    <div 
                      key={a.id}
                      onClick={() => {
                        dispatch(openAgentChat({ agentId: a.id }));
                        setShowAddMenu(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 cursor-pointer text-sm transition-colors"
                    >
                      <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-xs">
                        {a.avatar}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-zinc-200 font-medium">{a.name}</span>
                        <span className="text-[10px] text-zinc-400">{a.role}</span>
                      </div>
                    </div>
                  ))}
                  {agents.filter(a => !openChatIds.includes(a.id)).length === 0 && (
                    <div className="px-3 py-4 text-xs text-zinc-500 text-center italic">No other agents available</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <button 
          onClick={() => dispatch(closeAgentChat())}
          className="p-1.5 ml-2 rounded-md text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          title="Close all"
        >
          <X size={16} />
        </button>
      </div>

      {activeAgent ? (
        <>
          {/* Agent Header */}
          <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${activeAgent.role === 'CEO' ? 'from-amber-900/40 to-orange-900/40 border-amber-500/30' : 'from-indigo-950/60 to-purple-950/60 border-indigo-500/30'} border-b`}>
            <div className="flex items-center gap-3">
              <div className="text-xl w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner">
                {activeAgent.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-100 truncate">{activeAgent.name}</h3>
                  {activeAgent.role === 'CEO' && <Sparkles size={14} className="text-amber-400" />}
                </div>
                <span className="text-[11px] text-zinc-400 font-mono tracking-wide block truncate">{activeAgent.role} NODE</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => dispatch(toggleAgentChatFullScreen())}
                className="p-1.5 text-zinc-400 hover:text-zinc-100"
                title={isFullScreen ? 'Minimize' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className={`flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/80 select-text ${isFullScreen ? 'px-8 md:px-24' : ''}`}>
            {currentMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isSystem = msg.role === 'system';
              
              if (isSystem) {
                return (
                  <div key={idx} className="flex justify-center my-3">
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold tracking-wider">
                      {isUser ? 'You' : activeAgent.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                      isUser
                        ? 'bg-purple-600/20 text-purple-100 border-purple-500/40 rounded-tr-none shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                        : 'bg-zinc-900 text-zinc-200 border-zinc-700/50 rounded-tl-none whitespace-pre-wrap shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex flex-col items-start mt-2">
                 <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold tracking-wider">
                      {activeAgent.name} is thinking...
                    </span>
                  </div>
                <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                   <Loader2 size={18} className="text-purple-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Panel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className={`p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-end gap-3 ${isFullScreen ? 'px-8 md:px-24 py-6' : ''}`}
          >
            <div className="flex-1 bg-zinc-950 border border-zinc-700 hover:border-zinc-600 focus-within:border-purple-500/60 rounded-xl overflow-hidden transition-colors shadow-inner flex">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }
                }}
                placeholder={`Message ${activeAgent.name}...`}
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-32 min-h-[44px]"
                style={{ height: 'auto' }}
              />
            </div>
            <Button
              type="submit"
              variant="purple"
              disabled={!inputText.trim() || isLoading}
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-900/20"
            >
              <Send size={20} className={!inputText.trim() || isLoading ? 'opacity-50' : 'opacity-100'} />
            </Button>
          </form>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 bg-zinc-950/80">
          <User size={48} className="mb-4 text-zinc-800" />
          <p className="text-sm">Select an agent from the tabs above or use the + button to start a new conversation.</p>
        </div>
      )}
    </div>
  );
};
