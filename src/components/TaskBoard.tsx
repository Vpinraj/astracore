import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { assignAgentRequest, startTaskRequest, deleteTaskRequest } from '../store/slices/taskSlice';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { CreateTaskModal } from './CreateModals';
import { Modal } from './ui/Modal';
import { ClipboardList, Plus, Play, Search, Filter, Trash2 } from 'lucide-react';
import { Task } from '../types';

export const TaskBoard: React.FC = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(state => state.tasks.items);
  const agents = useAppSelector(state => state.agents.items);
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSub, setFilterSub] = useState('all');

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
                    <tr key={task.id} className="hover:bg-zinc-900/20 transition-all duration-200">
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
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedTask(task)}
                          className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 text-[10px] h-7 px-3 font-medium"
                        >
                          Details
                        </Button>
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

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Task Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-zinc-100">{selectedTask.title}</h4>
                <p className="text-xs text-zinc-400 mt-1">{selectedTask.description}</p>
              </div>
              <Badge variant={selectedTask.status as any}>{selectedTask.status.replace('_', ' ')}</Badge>
            </div>
            
            <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Task ID:</span>
                <span className="text-zinc-300 font-mono">{selectedTask.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Subsidiary:</span>
                <span className="text-zinc-300">{getSubsidiary(selectedTask.subsidiaryId)?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Assigned Agent:</span>
                <span className="text-zinc-300">
                  {getAgent(selectedTask.assignedAgentId)?.name || (
                    <span className="italic text-zinc-600">Unassigned</span>
                  )}
                </span>
              </div>
            </div>

            {selectedTask.status === 'pending' && !selectedTask.assignedAgentId && (
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

            {selectedTask.status === 'pending' && selectedTask.assignedAgentId && (
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

            {selectedTask.status !== 'pending' && (
              <div className="space-y-2">
                <span className="text-xs text-zinc-400">Progress:</span>
                <ProgressBar value={selectedTask.progress} color="indigo" showText />
              </div>
            )}

            {(selectedTask.logs.length > 0 || selectedTask.output) && (
              <div className="space-y-2">
                <span className="text-xs text-zinc-400">Execution Logs:</span>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 font-mono text-xs text-indigo-400 max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                  {selectedTask.output || selectedTask.logs.join('\n')}
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
