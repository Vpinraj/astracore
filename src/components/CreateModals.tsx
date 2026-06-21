import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { AgentRole } from '../types';

// ==========================================
// 1. CREATE SUBSIDIARY MODAL
// ==========================================
interface CreateSubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSubsidiaryModal: React.FC<CreateSubModalProps> = ({ isOpen, onClose }) => {
  const { createSubsidiary } = useApp();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('AI Software');
  const [investment, setInvestment] = useState(50000);
  const [error, setError] = useState('');

  const industries = ['AI Software', 'Robotics', 'Fintech', 'Creative Agency', 'Biotech', 'Cybersecurity'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a company name.');
      return;
    }
    if (investment <= 0) {
      setError('Initial funding must be greater than zero.');
      return;
    }

    createSubsidiary(name, industry, investment);
    setName('');
    setIndustry('AI Software');
    setInvestment(50000);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize New Subsidiary">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-red-400 font-mono text-xs">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Subsidiary Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CyberDyne Tech"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Industry Classification</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Initial Seed Capital ($)</label>
          <input
            type="number"
            value={investment}
            onChange={(e) => setInvestment(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="50000"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50 font-mono"
            min="1000"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="purple">Deploy Subsidiary</Button>
        </div>
      </form>
    </Modal>
  );
};


// ==========================================
// 2. CREATE AGENT MODAL (HIRE AGENT)
// ==========================================
interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubsidiaryId?: string;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ isOpen, onClose, defaultSubsidiaryId }) => {
  const { subsidiaries, createAgent } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('Developer');
  const [subsidiaryId, setSubsidiaryId] = useState(defaultSubsidiaryId || subsidiaries[0]?.id || '');
  const [error, setError] = useState('');

  const roles: AgentRole[] = [
    'CEO', 'CFO', 'CTO', 'CMO', 
    'Product Manager', 'Developer', 
    'UI Designer', 'Marketer', 
    'QA Engineer', 'Customer Support'
  ];

  // sync if defaults change or modal opens
  React.useEffect(() => {
    if (isOpen && defaultSubsidiaryId) {
      setSubsidiaryId(defaultSubsidiaryId);
    } else if (isOpen && !subsidiaryId && subsidiaries.length > 0) {
      setSubsidiaryId(subsidiaries[0].id);
    }
  }, [isOpen, defaultSubsidiaryId, subsidiaries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide an agent name.');
      return;
    }
    if (!subsidiaryId) {
      setError('A subsidiary must be selected to allocate this agent.');
      return;
    }

    const sub = subsidiaries.find(s => s.id === subsidiaryId);
    if (!sub) return;

    if (sub.balance < 2500) {
      setError(`Insufficient subsidiary balance. Hiring fees require $2,500, but ${sub.name} only holds $${sub.balance.toLocaleString()}.`);
      return;
    }

    createAgent(name, role, subsidiaryId);
    setName('');
    setRole('Developer');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hire AI Agent Unit">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-red-400 font-mono text-xs">
            {error}
          </div>
        )}

        <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-lg text-xs text-zinc-400">
          Hiring an AI agent deducts an initial server setup fee of <span className="text-zinc-100 font-mono font-semibold">$2,500</span> from the selected subsidiary's ledger.
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jarvis"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Subsidiary Cluster</label>
          <select
            value={subsidiaryId}
            onChange={(e) => setSubsidiaryId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
          >
            {subsidiaries.length === 0 ? (
              <option value="">No subsidiaries found. Create one first.</option>
            ) : (
              subsidiaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Balance: ${s.balance.toLocaleString()})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Agent Role Blueprint</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AgentRole)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
          >
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="purple" disabled={subsidiaries.length === 0}>Deploy Agent</Button>
        </div>
      </form>
    </Modal>
  );
};


// ==========================================
// 3. CREATE TASK MODAL (ASSIGN TASK)
// ==========================================
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubsidiaryId?: string;
  defaultAgentId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultSubsidiaryId,
  defaultAgentId,
}) => {
  const { subsidiaries, agents, createTask } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subsidiaryId, setSubsidiaryId] = useState(defaultSubsidiaryId || '');
  const [agentId, setAgentId] = useState(defaultAgentId || '');
  const [cost, setCost] = useState(2000);
  const [payout, setPayout] = useState(8000);
  const [error, setError] = useState('');

  // Sync state variables
  React.useEffect(() => {
    if (isOpen) {
      if (defaultSubsidiaryId) {
        setSubsidiaryId(defaultSubsidiaryId);
      } else if (subsidiaries.length > 0 && !subsidiaryId) {
        setSubsidiaryId(subsidiaries[0].id);
      }
    }
  }, [isOpen, defaultSubsidiaryId, subsidiaries]);

  // filter idle agents belonging to the selected subsidiary
  const idleAgents = agents.filter(
    (a) => a.subsidiaryId === subsidiaryId && a.status === 'idle'
  );

  React.useEffect(() => {
    if (isOpen) {
      if (defaultAgentId) {
        setAgentId(defaultAgentId);
      } else if (idleAgents.length > 0) {
        setAgentId(idleAgents[0].id);
      } else {
        setAgentId('');
      }
    }
  }, [subsidiaryId, idleAgents, defaultAgentId, isOpen]);

  const handleSubChange = (id: string) => {
    setSubsidiaryId(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Please fill in both the task title and description.');
      return;
    }
    if (!subsidiaryId) {
      setError('Please select a subsidiary.');
      return;
    }
    if (!agentId) {
      setError('Please select an idle AI agent to assign this task.');
      return;
    }
    if (cost <= 0 || payout <= 0) {
      setError('Cost and payout yields must be positive numbers.');
      return;
    }

    const sub = subsidiaries.find(s => s.id === subsidiaryId);
    if (!sub) return;

    if (sub.balance < cost) {
      setError(`Insufficient subsidiary balance. Deploying this task requires a budget of $${cost.toLocaleString()}, but ${sub.name} only holds $${sub.balance.toLocaleString()}.`);
      return;
    }

    createTask(title, description, subsidiaryId, agentId, payout, cost);
    setTitle('');
    setDescription('');
    setCost(2000);
    setPayout(8000);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deploy Operations Task">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-red-400 font-mono text-xs">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build API Server Gateway"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Task Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the workflow requirements..."
            className="w-full h-16 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Subsidiary</label>
            <select
              value={subsidiaryId}
              onChange={(e) => handleSubChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
            >
              {subsidiaries.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Idle Agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
            >
              {idleAgents.length === 0 ? (
                <option value="">No idle agents in subsidiary</option>
              ) : (
                idleAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Deployment Cost ($)</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50 font-mono"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Projected Yield Payout ($)</label>
            <input
              type="number"
              value={payout}
              onChange={(e) => setPayout(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50 font-mono"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="purple" disabled={!agentId}>Assign Task</Button>
        </div>
      </form>
    </Modal>
  );
};
