import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { assignAgentRequest, startTaskRequest, deleteTaskRequest, updateTaskRequest, postTaskDiscussionRequest } from '../store/slices/taskSlice';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { CreateTaskModal } from './CreateModals';
import { Modal } from './ui/Modal';
import { ClipboardList, Plus, Play, Search, Filter, Trash2, Copy, Check, MessageSquare, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task } from '../types';

export const TaskBoard: React.FC = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(state => state.tasks.items);
  const agents = useAppSelector(state => state.agents.items);
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAgentId, setEditAgentId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [discussionText, setDiscussionText] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSub, setFilterSub] = useState('all');

  // Auto-scroll ref for discussion chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keep selectedTask in sync with Redux store (so polling updates reflect immediately)
  const liveSelectedTask = selectedTask
    ? tasks.find(t => t.id === selectedTask.id) ?? selectedTask
    : null;

  // Auto-scroll to bottom when discussion messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveSelectedTask?.discussion?.length]);

  const [filterAgent, setFilterAgent] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const getSubsidiary = (subId: string) => {
    return subsidiaries.find((s) => s.id === subId);
  };

  const getAgent = (agentId: string) => {
    return agents.find((a) => a.id === agentId);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchSub = filterSub === 'all' || task.subsidiaryId === filterSub;
    const matchAgent = filterAgent === 'all' || 
                       (filterAgent === 'unassigned' && !task.assignedAgentId) ||
                       task.assignedAgentId === filterAgent;
    return matchSearch && matchStatus && matchSub && matchAgent;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'latest') return b.id.localeCompare(a.id);
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'progress-high') return b.progress - a.progress;
    if (sortBy === 'progress-low') return a.progress - b.progress;
    return 0;
  });

  const handleCopy = (text: string, type: 'id' | 'output') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  const handleAssignAgent = (taskId: string, agentId: string) => {
    if (!agentId) return;
    dispatch(assignAgentRequest({ taskId, agentId }));
  };

  const handleStartTask = (taskId: string) => {
    dispatch(startTaskRequest({ taskId }));
  };

  return (
    <div className="space-y-6">
      {/* Task Board Header & Filter Bar */}
      <div className="flex flex-col gap-4 bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 border-b border-zinc-800/50 pb-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-zinc-100 tracking-wide flex items-center gap-2">
              <ClipboardList className="text-purple-400" size={20} />
              Operations Grid
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">Comprehensive operations ledger and workflow tracking</p>
          </div>
          <Button
            variant="purple"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 font-semibold shrink-0"
          >
            <Plus size={16} /> Create Task
          </Button>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          {/* Search */}
          <div className="space-y-1 flex-1 min-w-[140px] max-w-xs">
            <span className="text-[10px] text-zinc-500 font-mono block">SEARCH TASKS</span>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Subsidiary */}
          <div className="space-y-1 flex-1 min-w-[130px] max-w-[180px]">
            <span className="text-[10px] text-zinc-500 font-mono block">FILTER SUBSIDIARY</span>
            <select
              value={filterSub}
              onChange={(e) => setFilterSub(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="all">All Subsidiaries</option>
              {subsidiaries.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Agent */}
          <div className="space-y-1 flex-1 min-w-[130px] max-w-[180px]">
            <span className="text-[10px] text-zinc-500 font-mono block">ASSIGNED AGENT</span>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="all">All Agents</option>
              <option value="unassigned">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1 flex-1 min-w-[120px] max-w-[150px]">
            <span className="text-[10px] text-zinc-500 font-mono block">FILTER STATUS</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked_on_user">Blocked on User</option>
            </select>
          </div>

          {/* Sort */}
          <div className="space-y-1 flex-1 min-w-[120px] max-w-[150px]">
            <span className="text-[10px] text-zinc-500 font-mono block">SORT BY</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="latest">Latest Created</option>
              <option value="title">Title (A-Z)</option>
              <option value="progress-high">Progress (Highest)</option>
              <option value="progress-low">Progress (Lowest)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 overflow-hidden">
        {sortedTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-600 bg-zinc-950/15">
            <Filter className="mx-auto mb-2 text-zinc-700" size={32} />
            No tasks found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-zinc-900 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-4 pl-5">Task ID</th>
                  <th className="p-4">Operation Title / Description</th>
                  <th className="p-4">Subsidiary</th>
                  <th className="p-4">Assigned Agent</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                {sortedTasks.map((task) => {
                  const sub = getSubsidiary(task.subsidiaryId);
                  const assignedAgent = getAgent(task.assignedAgentId);

                  return (
                    <tr 
                      key={task.id} 
                      className="hover:bg-zinc-900/40 cursor-pointer transition-all duration-200 group"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsEditing(false);
                      }}
                    >
                      <td className="p-4 pl-5 font-mono text-[10px] text-zinc-500">
                        {task.id.replace('task-', '')}
                      </td>
                      <td className="p-4 max-w-[280px]">
                        <p className="font-bold text-zinc-200 truncate">{task.title}</p>
                        <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{task.description}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-zinc-900 border border-zinc-800 ${sub?.textColor || 'text-zinc-400'}`}>
                          {sub?.name || 'HQ'}
                        </span>
                      </td>
                      <td className="p-4">
                        {assignedAgent ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{assignedAgent.avatar}</span>
                            <div>
                              <p className="font-medium text-zinc-300 leading-tight">{assignedAgent.name}</p>
                              <p className="text-[9px] text-zinc-500 font-mono leading-none">{assignedAgent.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] italic text-zinc-600 font-mono">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-zinc-500 leading-none">
                            <span>Completing</span>
                            <span>{task.progress}%</span>
                          </div>
                          <ProgressBar value={task.progress} color="indigo" />
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={task.status as any} className="text-[9px] px-2 py-0.5 uppercase tracking-wide font-bold">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 pr-5 text-right flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this task?')) {
                              dispatch(deleteTaskRequest({ taskId: task.id }));
                            }
                          }}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 p-0 rounded-md"
                          title="Delete Task"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
            setIsEditing(false);
          }}
          title="Task Details"
          size={selectedTask.status === 'completed' ? 'full' : 'lg'}
        >
          <div className={selectedTask.status === 'completed' ? 'grid grid-cols-1 md:grid-cols-3 gap-6 h-full' : 'space-y-4'}>
            
            {/* Left Column (Metadata) */}
            <div className={`space-y-4 ${selectedTask.status === 'completed' ? 'md:col-span-1 border-r border-zinc-800/50 pr-6' : ''}`}>
              <div className="flex justify-between items-start">
              {isEditing ? (
                <div className="w-full mr-4 space-y-2">
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-100 font-bold focus:outline-none focus:border-purple-500/50"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task Title"
                  />
                  <textarea
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Task Description"
                    rows={3}
                  />
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-bold text-zinc-100">{selectedTask.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{selectedTask.description}</p>
                </div>
              )}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge variant={selectedTask.status as any}>{selectedTask.status.replace('_', ' ')}</Badge>
                {isEditing ? (
                  <div className="flex gap-2 mt-1">
                    <Button variant="ghost" size="xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="purple" size="xs" onClick={() => {
                      dispatch(updateTaskRequest({
                        taskId: selectedTask.id,
                        data: {
                          title: editTitle,
                          description: editDescription,
                          assignedAgentId: editAgentId
                        }
                      }));
                      setIsEditing(false);
                    }}>Save</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="xs" className="mt-1 text-zinc-400 hover:text-zinc-200" onClick={() => {
                    setEditTitle(selectedTask.title);
                    setEditDescription(selectedTask.description);
                    setEditAgentId(selectedTask.assignedAgentId || '');
                    setIsEditing(true);
                  }}>
                    Edit Task
                  </Button>
                )}
              </div>
            </div>
            
            <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs items-center">
                <span className="text-zinc-500">Task ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300 font-mono">{selectedTask.id}</span>
                  <button 
                    onClick={() => handleCopy(selectedTask.id, 'id')}
                    className="text-zinc-500 hover:text-purple-400 transition-colors"
                    title="Copy Task ID"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-zinc-500">Subsidiary:</span>
                <span className="text-zinc-300">{getSubsidiary(selectedTask.subsidiaryId)?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-zinc-500">Assigned Agent:</span>
                {isEditing ? (
                  <select
                    value={editAgentId}
                    onChange={(e) => setEditAgentId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 cursor-pointer w-48"
                  >
                    <option value="">Unassigned</option>
                    {agents.filter(a => a.subsidiaryId === selectedTask.subsidiaryId && (a.status === 'idle' || a.id === selectedTask.assignedAgentId)).map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-zinc-300">
                    {getAgent(selectedTask.assignedAgentId)?.name || (
                      <span className="italic text-zinc-600">Unassigned</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {selectedTask.status === 'pending' && !selectedTask.assignedAgentId && !isEditing && (
              <div className="space-y-2">
                <span className="text-xs text-zinc-400">Allocate Agent:</span>
                <select
                  onChange={(e) => handleAssignAgent(selectedTask.id, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Select idle agent...</option>
                  {agents.filter(a => a.subsidiaryId === selectedTask.subsidiaryId && a.status === 'idle').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>
            )}

            {selectedTask.status === 'pending' && selectedTask.assignedAgentId && !isEditing && (
              <div className="flex justify-end">
                <Button
                  variant="purple"
                  onClick={() => {
                    handleStartTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="flex items-center gap-1"
                >
                  <Play size={14} /> Dispatch Task
                </Button>
              </div>
            )}

            {selectedTask.status !== 'pending' && selectedTask.status !== 'completed' && (
              <div className="space-y-2">
                <span className="text-xs text-zinc-400">Progress:</span>
                <ProgressBar value={selectedTask.progress} color="indigo" showText />
              </div>
            )}

            {/* If task is NOT completed, show logs at the bottom. If it IS completed, this column ends here. */}
            {selectedTask.status !== 'completed' && (selectedTask.logs.length > 0 || selectedTask.output) && (
              <div className="space-y-2 mt-4">
                <span className="text-xs text-zinc-400">Execution Logs:</span>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 font-mono text-xs text-indigo-400 max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                  {selectedTask.output || selectedTask.logs.join('\n')}
                </div>
              </div>
            )}

            {/* Discussion Area */}
            {selectedTask.status === 'completed' && (
              <div className="space-y-2 mt-6 border-t border-zinc-800/50 pt-4 flex flex-col h-[400px]">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <MessageSquare size={14} className="text-purple-400" /> Task Discussion
                </span>
                
                <div className="flex-1 bg-zinc-950/50 rounded-lg border border-zinc-800 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {(!liveSelectedTask.discussion || liveSelectedTask.discussion.length === 0) ? (
                    <div className="text-center text-zinc-600 text-xs mt-10">
                      No discussion yet. Start the conversation!
                    </div>
                  ) : (
                    <>
                      {liveSelectedTask.discussion.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                            msg.role === 'user' ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30' : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold opacity-75 text-[10px]">{msg.senderName || msg.role}</span>
                              <span className="text-[9px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div>{msg.content}</div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>
                
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={discussionText}
                    onChange={(e) => setDiscussionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && discussionText.trim()) {
                        dispatch(postTaskDiscussionRequest({ taskId: selectedTask.id, content: discussionText.trim() }));
                        setDiscussionText('');
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    onClick={() => {
                      if (discussionText.trim()) {
                        dispatch(postTaskDiscussionRequest({ taskId: selectedTask.id, content: discussionText.trim() }));
                        setDiscussionText('');
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-purple-400 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* Right Column (Entire Output) ONLY if task is completed */}
            {selectedTask.status === 'completed' && (
              <div className="md:col-span-2 flex flex-col h-full bg-zinc-950/40 rounded-xl border border-zinc-800 overflow-hidden shadow-inner">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center backdrop-blur-md">
                  <span className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList size={16} className="text-purple-400" /> Final Output & Logs
                  </span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleCopy(selectedTask.output || selectedTask.logs.join('\n'), 'output')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-purple-400 transition-colors bg-zinc-800/50 px-2.5 py-1.5 rounded-lg border border-zinc-700/50 hover:border-purple-500/50 hover:bg-purple-500/10"
                    >
                      {copiedOutput ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copiedOutput ? 'Copied' : 'Copy'}
                    </button>
                    <Badge variant="completed" className="shadow-lg shadow-emerald-500/20">100%</Badge>
                  </div>
                </div>
                <div className="flex-1 p-6 text-zinc-300 max-h-[75vh] overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950/40 to-zinc-950">
                  <div className="prose prose-invert prose-zinc prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedTask.output || selectedTask.logs.join('\n')}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

          </div>
        </Modal>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
