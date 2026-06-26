import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchStateRequest } from '../store/slices/coreSlice';
import { api } from '../api';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Plus, Search, Settings, Shield, Sliders, Cpu, Save } from 'lucide-react';
import type { RoleBlueprint, AgentOutputFormat, AgentMemoryType, AgentTool } from '../types';

export const RoleRegistry: React.FC = () => {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(state => state.agents.roles);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleBlueprint | null>(null);

  // Form States
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSkills, setNewRoleSkills] = useState('');
  const [newRoleTemp, setNewRoleTemp] = useState(0.5);
  const [newRoleTokens, setNewRoleTokens] = useState(2048);
  const [newRoleFormat, setNewRoleFormat] = useState<AgentOutputFormat>('markdown');
  const [newRoleMemory, setNewRoleMemory] = useState<AgentMemoryType>('short_term');
  const [newRoleHeartbeat, setNewRoleHeartbeat] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Standard Tool Selection list for custom roles
  const [selectedTools, setSelectedTools] = useState<AgentTool[]>([
    { name: 'web_search', description: 'Search the web for market intelligence', enabled: true },
    { name: 'code_exec', description: 'Execute code in a sandboxed runtime', enabled: false },
    { name: 'read_codebase', description: 'Read source files from the repository', enabled: false },
    { name: 'write_file', description: 'Write or patch source files', enabled: false },
    { name: 'generate_copy', description: 'Generate marketing/ad copy text', enabled: false },
    { name: 'read_kb', description: 'Read knowledge base articles', enabled: false },
    { name: 'send_email', description: 'Send campaign or newsletter emails', enabled: false }
  ]);

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.map(t => (t.name === toolName ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleEditRole = (role: RoleBlueprint) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleSkills(role.commonSkills.join(', '));
    setNewRoleTemp(role.temperature);
    setNewRoleTokens(role.maxTokens);
    setNewRoleFormat(role.outputFormat);
    setNewRoleMemory(role.memoryType);
    setNewRoleHeartbeat(role.heartbeatInstruction || '');
    
    // Merge existing tools with standard list
    setSelectedTools([
      { name: 'web_search', description: 'Search the web for market intelligence', enabled: role.tools?.find(t => t.name === 'web_search')?.enabled ?? false },
      { name: 'code_exec', description: 'Execute code in a sandboxed runtime', enabled: role.tools?.find(t => t.name === 'code_exec')?.enabled ?? false },
      { name: 'read_codebase', description: 'Read source files from the repository', enabled: role.tools?.find(t => t.name === 'read_codebase')?.enabled ?? false },
      { name: 'write_file', description: 'Write or patch source files', enabled: role.tools?.find(t => t.name === 'write_file')?.enabled ?? false },
      { name: 'generate_copy', description: 'Generate marketing/ad copy text', enabled: role.tools?.find(t => t.name === 'generate_copy')?.enabled ?? false },
      { name: 'read_kb', description: 'Read knowledge base articles', enabled: role.tools?.find(t => t.name === 'read_kb')?.enabled ?? false },
      { name: 'send_email', description: 'Send campaign or newsletter emails', enabled: role.tools?.find(t => t.name === 'send_email')?.enabled ?? false }
    ]);
    
    setIsCreateModalOpen(true);
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.commonSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    if (!newRoleName.trim()) {
      setError('Role name is required.');
      setIsSaving(false);
      return;
    }

    const skillsArray = newRoleSkills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (skillsArray.length === 0) {
      setError('Please provide at least one core skill.');
      setIsSaving(false);
      return;
    }

    const roleBlueprint: Partial<RoleBlueprint> = {
      id: editingRole ? editingRole.id : undefined,
      name: newRoleName.trim(),
      commonSkills: skillsArray,
      temperature: newRoleTemp,
      maxTokens: newRoleTokens,
      outputFormat: newRoleFormat,
      memoryType: newRoleMemory,
      heartbeatInstruction: newRoleHeartbeat.trim() || undefined,
      tools: selectedTools
    };

    try {
      await api.createRole(roleBlueprint);
      // Refresh global state to load new roles
      dispatch(fetchStateRequest());
      
      // Reset Form
      setNewRoleName('');
      setNewRoleSkills('');
      setNewRoleTemp(0.5);
      setNewRoleTokens(2048);
      setNewRoleFormat('markdown');
      setNewRoleMemory('short_term');
      setNewRoleHeartbeat('');
      setSelectedTools([
        { name: 'web_search', description: 'Search the web for market intelligence', enabled: true },
        { name: 'code_exec', description: 'Execute code in a sandboxed runtime', enabled: false },
        { name: 'read_codebase', description: 'Read source files from the repository', enabled: false },
        { name: 'write_file', description: 'Write or patch source files', enabled: false },
        { name: 'generate_copy', description: 'Generate marketing/ad copy text', enabled: false },
        { name: 'read_kb', description: 'Read knowledge base articles', enabled: false },
        { name: 'send_email', description: 'Send campaign or newsletter emails', enabled: false }
      ]);
      
      setEditingRole(null);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save role blueprint');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleSkills('');
    setNewRoleTemp(0.5);
    setNewRoleTokens(2048);
    setNewRoleFormat('markdown');
    setNewRoleMemory('short_term');
    setNewRoleHeartbeat('');
    setSelectedTools([
      { name: 'web_search', description: 'Search the web for market intelligence', enabled: true },
      { name: 'code_exec', description: 'Execute code in a sandboxed runtime', enabled: false },
      { name: 'read_codebase', description: 'Read source files from the repository', enabled: false },
      { name: 'write_file', description: 'Write or patch source files', enabled: false },
      { name: 'generate_copy', description: 'Generate marketing/ad copy text', enabled: false },
      { name: 'read_kb', description: 'Read knowledge base articles', enabled: false },
      { name: 'send_email', description: 'Send campaign or newsletter emails', enabled: false }
    ]);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Bar */}
      <div className="flex flex-col gap-4 bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 border-b border-zinc-800/50 pb-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-zinc-100 tracking-wide flex items-center gap-2">
              <Cpu className="text-indigo-400" size={20} />
              Role Blueprint Registry
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Available agent architectures in the database: {roles.length} total blueprint shapes
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 border-zinc-700/60 font-semibold text-zinc-200"
          >
            <Plus size={16} /> Create Custom Role
          </Button>
        </div>

        <div className="max-w-xs space-y-1">
          <span className="text-[10px] text-zinc-500 font-mono block">FILTER ROLES</span>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by role name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      </div>

      {/* Grid of Blueprint Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-800 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Visual Glassmorphic Accent */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />

            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">{role.name}</h4>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight">Blueprint Config</span>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700 transition"
                    title="Edit Role Blueprint"
                  >
                    <Settings size={14} />
                  </button>
                  <Badge variant="role">{role.outputFormat}</Badge>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {role.commonSkills.slice(0, 5).map(skill => (
                  <span
                    key={skill}
                    className="text-[8px] bg-zinc-900 border border-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Specifications list */}
              <div className="space-y-1.5 text-[10px] font-mono text-zinc-400 border-t border-zinc-900/60 pt-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 flex items-center gap-1"><Sliders size={10} /> Temp:</span>
                  <span className={role.temperature > 0.6 ? 'text-amber-400' : 'text-teal-400'}>
                    {role.temperature.toFixed(2)} ({role.temperature > 0.6 ? 'Creative' : 'Precise'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 flex items-center gap-1"><Settings size={10} /> Max Tokens:</span>
                  <span>{role.maxTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 flex items-center gap-1"><Shield size={10} /> Memory:</span>
                  <span className="capitalize">{role.memoryType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Tools list */}
            <div className="border-t border-zinc-900/60 pt-3">
              <span className="text-[9px] text-zinc-500 font-mono block mb-1.5">ENABLED CAPABILITIES:</span>
              <div className="flex flex-wrap gap-1">
                {role.tools.filter(t => t.enabled).length === 0 ? (
                  <span className="text-[9px] italic text-zinc-600">No active execution tools</span>
                ) : (
                  role.tools.filter(t => t.enabled).map(t => (
                    <span
                      key={t.name}
                      className="text-[9px] font-mono bg-indigo-950/20 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded"
                      title={t.description}
                    >
                      🛠️ {t.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Custom Role Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingRole(null);
          }}
          title={editingRole ? `Edit Role: ${editingRole.name}` : "Create Custom Role Blueprint"}
          size="lg"
        >
          <form onSubmit={handleCreateRole} className="space-y-4 text-xs text-zinc-300 max-h-[78vh] overflow-y-auto pr-1">
            {error && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-red-400 font-mono">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Role Name</label>
                <input
                  type="text"
                  placeholder="e.g. Content Writer, Supervisor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Max Tokens Limit</label>
                <input
                  type="number"
                  value={newRoleTokens}
                  onChange={(e) => setNewRoleTokens(Math.max(1, parseInt(e.target.value) || 2048))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500/50 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Core Skills (comma separated list)</label>
              <input
                type="text"
                placeholder="e.g. Strategy planning, SEO copy, Trend audit"
                value={newRoleSkills}
                onChange={(e) => setNewRoleSkills(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Default Heartbeat Instruction (Optional)</label>
              <textarea
                placeholder="e.g. Perform a routine self-status check..."
                value={newRoleHeartbeat}
                onChange={(e) => setNewRoleHeartbeat(e.target.value)}
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 font-mono text-[11px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 font-semibold">Temperature</label>
                  <span className="font-mono text-indigo-400">{newRoleTemp.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={newRoleTemp}
                  onChange={(e) => setNewRoleTemp(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Output Format</label>
                <select
                  value={newRoleFormat}
                  onChange={(e) => setNewRoleFormat(e.target.value as AgentOutputFormat)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="markdown">Markdown Documents</option>
                  <option value="json">Structured JSON Data</option>
                  <option value="code">Raw Software Code</option>
                  <option value="plain">Plain Conversational Text</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Memory Type</label>
                <select
                  value={newRoleMemory}
                  onChange={(e) => setNewRoleMemory(e.target.value as AgentMemoryType)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="none">None (No Context Window)</option>
                  <option value="short_term">Short-Term (Windowed History)</option>
                  <option value="long_term">Long-Term (Vector Store / RAG)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-900 pt-3">
              <label className="text-zinc-300 font-semibold block mb-1">Select Execution Tools</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedTools.map((tool) => (
                  <div
                    key={tool.name}
                    onClick={() => toggleTool(tool.name)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                      tool.enabled
                        ? 'border-indigo-500/30 bg-indigo-950/10 text-indigo-300'
                        : 'border-zinc-900 bg-zinc-900/10 text-zinc-500 hover:border-zinc-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tool.enabled}
                      readOnly
                      className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                    />
                    <div className="min-w-0 leading-tight">
                      <p className="text-[10px] font-mono font-bold">{tool.name}</p>
                      <p className="text-[8px] mt-0.5 text-zinc-500 leading-normal">{tool.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900/60">
              <Button type="button" variant="outline" onClick={() => { setIsCreateModalOpen(false); setEditingRole(null); }}>
                Cancel
              </Button>
              <Button type="submit" variant="purple" disabled={isSaving} className="flex items-center gap-1">
                <Save size={14} /> {isSaving ? 'Saving...' : (editingRole ? 'Save Changes' : 'Register Role')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
