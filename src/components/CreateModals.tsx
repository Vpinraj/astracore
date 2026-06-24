import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createSubsidiaryRequest } from '../store/slices/subsidiarySlice';
import { createAgentRequest } from '../store/slices/agentSlice';
import { createTaskRequest } from '../store/slices/taskSlice';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { AgentRole, AgentOutputFormat, AgentMemoryType, AgentTool } from '../types';
import { AGENT_ROLE_BLUEPRINTS } from '../types';

// ==========================================
// 1. CREATE SUBSIDIARY MODAL
// ==========================================
interface CreateSubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSubsidiaryModal: React.FC<CreateSubModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('AI Software');
  const [investment, setInvestment] = useState(0); // Defaults to 0
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [error, setError] = useState('');

  const industries = ['AI Software', 'Robotics', 'Fintech', 'Creative Agency', 'Biotech', 'Cybersecurity'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a company name.');
      return;
    }
    if (investment < 0) {
      setError('Initial funding must be positive or zero.');
      return;
    }

    dispatch(createSubsidiaryRequest({
      name, 
      industry, 
      investment, 
      colorTheme: undefined, 
      logoUrl, 
      website, 
      email, 
      phone, 
      description, 
      address, 
      bankDetails
    }));
    setName('');
    setIndustry('AI Software');
    setInvestment(0);
    setLogoUrl('');
    setWebsite('');
    setEmail('');
    setPhone('');
    setDescription('');
    setAddress('');
    setBankDetails('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize New Subsidiary" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-red-400 font-mono text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Initial Seed Capital (₹)</label>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50 font-mono"
              min="0"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="e.g. https://example.com/logo.png"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. https://example.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@example.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Bank Details</label>
            <input
              type="text"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="e.g. HDFC Bank, A/C: 123456"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Physical Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Tech Park, Bangalore"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Subsidiary Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe operations, products, and milestones..."
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none font-sans"
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
// 2. CREATE AGENT MODAL (DEPLOY AI AGENT)
// ==========================================
interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubsidiaryId?: string;
}

const AI_MODELS = [
  { id: 'gemma4:latest',       label: 'Gemma 4 (Local)',     provider: 'Ollama' },
  { id: 'llama3:latest',       label: 'Llama 3 (Local)',     provider: 'Ollama' },
  { id: 'gemini-2.0-flash',    label: 'Gemini 2.0 Flash',    provider: 'Google' },
  { id: 'gemini-2.5-pro',      label: 'Gemini 2.5 Pro',      provider: 'Google' },
  { id: 'gpt-4o',              label: 'GPT-4o',              provider: 'OpenAI' },
  { id: 'gpt-4o-mini',         label: 'GPT-4o Mini',         provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet',   label: 'Claude 3.5 Sonnet',   provider: 'Anthropic' },
  { id: 'claude-3-haiku',      label: 'Claude 3 Haiku',      provider: 'Anthropic' },
];

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ isOpen, onClose, defaultSubsidiaryId }) => {
  const dispatch = useAppDispatch();
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('Developer');
  const [subsidiaryId, setSubsidiaryId] = useState(defaultSubsidiaryId || subsidiaries[0]?.id || '');
  const [instructions, setInstructions] = useState('');
  const [modelId, setModelId] = useState('gemma4:latest');
  // Custom Override States for new Agent fields
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [outputFormat, setOutputFormat] = useState<AgentOutputFormat>('markdown');
  const [memoryType, setMemoryType] = useState<AgentMemoryType>('short_term');
  const [tools, setTools] = useState<AgentTool[]>([]);

  const [error, setError] = useState('');

  const selectedBlueprint = AGENT_ROLE_BLUEPRINTS.find(r => r.name === role);

  const defaultInstructionPlaceholder = selectedBlueprint
    ? `e.g. You are ${name || '[Agent Name]'}, an AI ${role}. Focus on ${selectedBlueprint.commonSkills.slice(0, 2).join(' and ')}. Always prioritize accuracy and transparency in your outputs.`
    : '';

  // Synchronize state when role blueprint or modal open status changes
  React.useEffect(() => {
    if (selectedBlueprint) {
      setTemperature(selectedBlueprint.temperature);
      setMaxTokens(selectedBlueprint.maxTokens);
      setOutputFormat(selectedBlueprint.outputFormat);
      setMemoryType(selectedBlueprint.memoryType);
      // Deep copy tools so toggles don't mutate global blueprints
      setTools(selectedBlueprint.tools.map(t => ({ ...t })));
    }
  }, [role, isOpen]);

  React.useEffect(() => {
    if (isOpen && defaultSubsidiaryId) {
      setSubsidiaryId(defaultSubsidiaryId);
    } else if (isOpen && !subsidiaryId && subsidiaries.length > 0) {
      setSubsidiaryId(subsidiaries[0].id);
    }
  }, [isOpen, defaultSubsidiaryId, subsidiaries]);

  const toggleTool = (toolName: string) => {
    setTools(prev =>
      prev.map(t => (t.name === toolName ? { ...t, enabled: !t.enabled } : t))
    );
  };

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

    dispatch(createAgentRequest({
      name, 
      role, 
      subsidiaryId, 
      instructions, 
      modelId, 
      customOverrides: {
        temperature,
        maxTokens,
        outputFormat,
        memoryType,
        tools
      }
    }));

    setName('');
    setRole('Developer');
    setInstructions('');
    setModelId('gemma4:latest');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deploy AI Agent" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-red-400 font-mono text-xs">
            {error}
          </div>
        )}

        {/* Row: Agent Name + Subsidiary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nexus-7"
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
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))
              )}
            </select>
          </div>

        </div>

        {/* Role Blueprint Selector — pill grid */}
        <div className="space-y-2">
          <label className="text-zinc-400 font-medium">Role Blueprint</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {AGENT_ROLE_BLUEPRINTS.map((blueprint) => (
              <button
                key={blueprint.name}
                type="button"
                onClick={() => setRole(blueprint.name as AgentRole)}
                className={`px-2 py-1.5 rounded-lg border text-center transition-all text-[10px] font-medium ${
                  role === blueprint.name
                    ? 'border-purple-500/60 bg-purple-950/30 text-purple-300'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {blueprint.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Custom Configuration Panel */}
        <div className="border border-zinc-800/80 bg-zinc-950/60 p-4 rounded-xl space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-purple-400 border-b border-zinc-900 pb-2">
            LLM Runtime & Tool Configuration
          </h4>

          {/* Model, Temp, MaxTokens */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 text-xs font-medium">AI Model</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.provider} — {m.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-zinc-400 font-medium">Temperature</label>
                <span className="font-mono text-purple-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-xs font-medium">Max Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50 font-mono"
              />
            </div>
          </div>

          {/* Output Format & Memory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 text-xs font-medium">Output Format</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as AgentOutputFormat)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
              >
                <option value="markdown">Markdown Documents</option>
                <option value="json">Structured JSON Data</option>
                <option value="code">Raw Software Code</option>
                <option value="plain">Plain Conversational Text</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-xs font-medium">Memory Retention</label>
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value as AgentMemoryType)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
              >
                <option value="none">None (No Context Window)</option>
                <option value="short_term">Short-Term (Windowed Chat History)</option>
                <option value="long_term">Long-Term (Vector Store / RAG Summary)</option>
              </select>
            </div>
          </div>

          {/* Tools Toggles */}
          <div className="space-y-2">
            <label className="text-zinc-400 text-xs font-medium">Agent Capability Tools</label>
            {tools.length === 0 ? (
              <p className="text-[11px] text-zinc-600 font-mono">This blueprint does not support any specific execution tools.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tools.map((tool) => (
                  <div
                    key={tool.name}
                    onClick={() => toggleTool(tool.name)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                      tool.enabled
                        ? 'border-purple-500/30 bg-purple-950/10 text-purple-300'
                        : 'border-zinc-900 bg-zinc-900/10 text-zinc-500 hover:border-zinc-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tool.enabled}
                      readOnly
                      className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-950"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono font-bold leading-none">{tool.name}</p>
                      <p className="text-[9px] leading-snug mt-1 text-zinc-500">{tool.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Instructions / Behavioral Prompt */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-zinc-400 font-medium">System Instructions</label>
            <span className="text-[10px] text-zinc-600 font-mono">optional — auto-generated if blank</span>
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={defaultInstructionPlaceholder}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none font-mono text-xs leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
  const dispatch = useAppDispatch();
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const agents = useAppSelector(state => state.agents.items);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subsidiaryId, setSubsidiaryId] = useState(defaultSubsidiaryId || '');
  const [agentId, setAgentId] = useState(defaultAgentId || '');
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

  // filter agents belonging to the selected subsidiary
  const availableAgents = agents.filter(
    (a) => a.subsidiaryId === subsidiaryId
  );

  React.useEffect(() => {
    if (!isOpen) return;
    
    // Check if the currently selected agent belongs to the chosen subsidiary
    const isValidAgent = availableAgents.some(a => a.id === agentId);
    
    if (!isValidAgent) {
      if (defaultAgentId && availableAgents.some(a => a.id === defaultAgentId)) {
        setAgentId(defaultAgentId);
      } else if (availableAgents.length > 0) {
        setAgentId(availableAgents[0].id);
      } else {
        setAgentId('');
      }
    }
  }, [subsidiaryId, agents, defaultAgentId, isOpen, agentId]);

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

    const sub = subsidiaries.find(s => s.id === subsidiaryId);
    if (!sub) return;

    dispatch(createTaskRequest({ title, description, subsidiaryId, assignedAgentId: agentId }));
    setTitle('');
    setDescription('');
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
            <label className="text-zinc-400 font-medium">Assign Agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Leave Unassigned (Assign Later)</option>
              {availableAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role}) {a.status !== 'idle' ? `[${a.status}]` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>


        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="purple">Deploy Task</Button>
        </div>
      </form>
    </Modal>
  );
};
