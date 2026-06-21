import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, MicOff, Send, MessageSquare, X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface Message {
  sender: 'director' | 'ai';
  text: string;
  timestamp: string;
}

export const DirectorAgent: React.FC = () => {
  const { parseDirectorCommand } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Greetings, Director. I am your neural operations assistant. Speak or type to execute global commands.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setMicError('Microphone permission blocked. Please enable it in your browser settings.');
        } else {
          setMicError('Speech recognition error. Using text input fallback.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          await handleSendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }
  }, []);

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any active speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    
    // Choose a high-quality female/synthetic voice if available
    const voices = window.speechSynthesis.getVoices();
    const synthVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (synthVoice) {
      utterance.voice = synthVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      sender: 'director',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Wait a brief simulated calculation time
    const res = await parseDirectorCommand(text);

    const botMessage: Message = {
      sender: 'ai',
      text: res.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, botMessage]);
    speakText(res.text);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        // Fallback demo simulator for voice if Web Speech API isn't supported or blocked
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          const sampleCommands = [
            'status of CyberCore AI',
            'create subsidiary AstroCorp with 75000',
            'hire Developer named Jarvis for CyberCore AI',
            'allocate 15000 to Nexus Media'
          ];
          const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
          handleSendMessage(randomCommand);
        }, 3000);
      }
    }
  };

  return (
    <div className="fixed bottom-5 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Widget */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[360px] h-[440px] sm:h-[480px] rounded-xl border border-purple-500/40 bg-zinc-950/95 shadow-2xl flex flex-col overflow-hidden mb-4 glass-panel-glow animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border-b border-purple-950/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-xs font-bold text-zinc-100 tracking-wider font-mono">DIRECTOR_AGENT.AI</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="p-1 text-zinc-400 hover:text-zinc-100"
                title={voiceEnabled ? 'Mute Speech Voice' : 'Unmute Speech Voice'}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-100"
              >
                <X size={15} />
              </Button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-950/70 select-text">
            {messages.map((msg, idx) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={idx} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {isAi && <Sparkles size={11} className="text-purple-400" />}
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {isAi ? 'Operations Agent' : 'Director'}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed border ${
                      isAi
                        ? 'bg-zinc-900/90 text-zinc-200 border-zinc-800/80 rounded-tl-none'
                        : 'bg-purple-950/30 text-purple-200 border-purple-500/20 rounded-tr-none shadow-[0_0_10px_rgba(168,85,247,0.05)]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Listening Overlay */}
          {isListening && (
            <div className="px-4 py-2 border-t border-purple-950/40 bg-purple-950/20 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 h-4">
                  <div className="w-1 h-2 bg-purple-400 rounded animate-waveform" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-4 bg-purple-400 rounded animate-waveform" style={{ animationDelay: '0.3s' }} />
                  <div className="w-1 h-3 bg-purple-400 rounded animate-waveform" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-4.5 bg-purple-400 rounded animate-waveform" style={{ animationDelay: '0.4s' }} />
                  <div className="w-1 h-2 bg-purple-400 rounded animate-waveform" style={{ animationDelay: '0.1s' }} />
                </div>
                <span className="text-[10px] font-mono text-purple-300">Listening to voice command...</span>
              </div>
              {!recognitionRef.current && (
                <span className="text-[8px] font-mono text-zinc-500 uppercase italic">Simulation</span>
              )}
            </div>
          )}

          {/* Micro Error Text */}
          {micError && (
            <div className="px-4 py-1 text-[10px] bg-red-950/30 border-t border-red-900/30 text-red-400 font-mono">
              {micError}
            </div>
          )}

          {/* Input Panel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center gap-2"
          >
            <Button
              type="button"
              variant={isListening ? 'danger' : 'secondary'}
              onClick={toggleListening}
              className="p-2 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border border-zinc-700/50"
              title="Voice Input (Mic)"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </Button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Speak your command...' : 'Type "overall status" or commands...'}
              disabled={isListening}
              className="flex-1 bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700/90 focus:border-purple-500/50 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <Button
              type="submit"
              variant="purple"
              disabled={!inputText.trim() || isListening}
              className="p-2 h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
            >
              <Send size={15} />
            </Button>
          </form>
        </div>
      )}

      {/* Floating Holographic Orb Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-500/50 hover:border-purple-400 bg-gradient-to-tr from-indigo-900 via-purple-950 to-pink-950 hover:scale-105 transition-all duration-300 relative group animate-pulse-glow"
        title="Director Command Center"
      >
        <div className="absolute inset-0.5 rounded-full bg-zinc-950 group-hover:opacity-40 opacity-70 transition-opacity" />
        <MessageSquare className="text-purple-400 w-6 h-6 z-10 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-200" />
        
        {/* Radar Ring */}
        <span className="absolute -inset-1 rounded-full border border-purple-500/30 animate-ping opacity-75" style={{ animationDuration: '3s' }} />
      </button>
    </div>
  );
};
