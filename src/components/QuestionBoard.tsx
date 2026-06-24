import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { answerTaskRequest } from '../store/slices/taskSlice';
import { HelpCircle, Send, User, Bot, AlertCircle } from 'lucide-react';

export const QuestionBoard: React.FC = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.items || []);
  const agents = useAppSelector((state) => state.agents.items || []);
  
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const blockedTasks = tasks.filter(t => t.status === 'blocked_on_user');

  const handleAnswerSubmit = (taskId: string) => {
    const answer = answers[taskId];
    if (!answer?.trim()) return;

    dispatch(answerTaskRequest({ taskId, answer }));
    
    // Clear local answer state for this task
    setAnswers(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown Agent';
  };

  if (blockedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
        <HelpCircle size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">No Agent Doubts</h2>
        <p className="text-sm">Agents will pause and ask questions here if they need your input.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-rose-500/10 rounded-lg">
          <AlertCircle className="text-rose-500" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Agent Doubts</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Agents have paused their execution and are waiting for your clarification.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {blockedTasks.map((task) => (
          <div key={task.id} className="bg-zinc-900/60 border border-rose-500/30 rounded-xl overflow-hidden shadow-lg shadow-rose-900/10">
            <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/80 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-zinc-100">{task.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Bot size={12} className="text-purple-400" />
                    {getAgentName(task.assignedAgentId)}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-zinc-500">{task.id}</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30">
                BLOCKED
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Question Bubble */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Bot size={16} className="text-purple-400" />
                </div>
                <div className="bg-zinc-800/60 p-4 rounded-2xl rounded-tl-sm border border-zinc-700/50 shadow-inner flex-1">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {task.pendingQuestion || "I need clarification to proceed with this task."}
                  </p>
                </div>
              </div>

              {/* Answer Input */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <User size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={answers[task.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [task.id]: e.target.value })}
                    placeholder="Type your clarification here to resume the task..."
                    className="w-full h-24 bg-zinc-950/50 border border-zinc-700/50 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleAnswerSubmit(task.id)}
                      disabled={!answers[task.id]?.trim()}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <Send size={16} />
                      Resume Execution
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
