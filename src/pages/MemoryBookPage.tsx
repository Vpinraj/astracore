import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, Search, Pin, Trash2, RefreshCw, Globe, User,
  Brain, Target, Lightbulb, Bookmark, CheckSquare, FileText, Users, Building2,
  X, Edit3, Save, Eye, Cpu, Zap, Clock
} from 'lucide-react';
import { api } from '../api';
import type { MemoryEntry, MemoryCategory } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: { id: MemoryCategory | 'all'; label: string; icon: React.FC<any> }[] = [
  { id: 'all',        label: 'All',        icon: BookOpen },
  { id: 'fact',       label: 'Fact',       icon: FileText },
  { id: 'goal',       label: 'Goal',       icon: Target },
  { id: 'lesson',     label: 'Lesson',     icon: Lightbulb },
  { id: 'decision',   label: 'Decision',   icon: CheckSquare },
  { id: 'preference', label: 'Preference', icon: Bookmark },
  { id: 'project',    label: 'Project',    icon: Brain },
  { id: 'person',     label: 'Person',     icon: Users },
  { id: 'company',    label: 'Company',    icon: Building2 },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  fact:       { bg: 'bg-sky-500/15',    text: 'text-sky-400',    border: 'border-sky-500/30' },
  goal:       { bg: 'bg-emerald-500/15',text: 'text-emerald-400',border: 'border-emerald-500/30' },
  lesson:     { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30' },
  decision:   { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  preference: { bg: 'bg-pink-500/15',   text: 'text-pink-400',   border: 'border-pink-500/30' },
  project:    { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  person:     { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  company:    { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const SOURCE_STYLES: Record<string, { label: string; color: string }> = {
  user:      { label: 'User',      color: 'text-zinc-400' },
  agent:     { label: 'Agent',     color: 'text-purple-400' },
  heartbeat: { label: 'Heartbeat', color: 'text-emerald-400' },
  task:      { label: 'Task',      color: 'text-amber-400' },
};

// ─── Add/Edit Modal ────────────────────────────────────────────────────────────
interface MemoryModalProps {
  entry?: MemoryEntry | null;
  agents: { id: string; name: string; role: string }[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const MemoryModal: React.FC<MemoryModalProps> = ({ entry, agents, onClose, onSave }) => {
  const [form, setForm] = useState({
    ownerId:   entry?.ownerId   ?? 'global',
    ownerName: entry?.ownerName ?? 'Company',
    audience:  entry?.audience  ?? 'global',
    category:  (entry?.category  ?? 'fact') as MemoryCategory,
    key:       entry?.key       ?? '',
    value:     entry?.value     ?? '',
    pinned:    entry?.pinned    ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleOwnerChange = (ownerId: string) => {
    if (ownerId === 'global') {
      setForm(f => ({ ...f, ownerId: 'global', ownerName: 'Company' }));
    } else {
      const agent = agents.find(a => a.id === ownerId);
      setForm(f => ({ ...f, ownerId, ownerName: agent?.name ?? ownerId }));
    }
  };

  const handleSubmit = async () => {
    if (!form.key.trim() || !form.value.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, source: 'user' });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-purple-400" />
            <span className="font-semibold text-zinc-100">{entry ? 'Edit Memory' : 'New Memory Entry'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Owner</label>
            <select value={form.ownerId} onChange={e => handleOwnerChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-purple-500/50">
              <option value="global">🌐 Company (Global)</option>
              {agents.map(a => <option key={a.id} value={a.id}>🤖 {a.name} ({a.role})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Visibility / Audience</label>
            <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-purple-500/50">
              <option value="global">🌐 Global (all agents)</option>
              {agents.map(a => <option key={`aud-${a.id}`} value={a.id}>🔒 {a.name} only</option>)}
              {['ceo','cfo','cto','developer','designer','marketing','sales','finance','hr','operations','support'].map(r => (
                <option key={`role-${r}`} value={r}>👥 {r.toUpperCase()} role</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                const Icon = cat.icon;
                const active = form.category === cat.id;
                const colors = CATEGORY_COLORS[cat.id] ?? {};
                return (
                  <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id as MemoryCategory }))}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${active
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-zinc-300'}`}>
                    <Icon size={12} />{cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Key (headline)</label>
            <input type="text" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
              placeholder="e.g. Preferred communication style"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Value (memory content)</label>
            <textarea value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="Write the full memory content here..." rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none" />
          </div>

          <button onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.pinned
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'}`}>
            <Pin size={12} />{form.pinned ? 'Pinned (always injected)' : 'Not pinned'}
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.key.trim() || !form.value.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-purple-900/30">
            <Save size={14} />{saving ? 'Saving…' : entry ? 'Update' : 'Add Memory'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Memory Card ───────────────────────────────────────────────────────────────
interface MemoryCardProps {
  entry: MemoryEntry;
  agents: { id: string; name: string; role: string }[];
  onPin: (entry: MemoryEntry) => void;
  onEdit: (entry: MemoryEntry) => void;
  onDelete: (id: string) => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ entry, agents, onPin, onEdit, onDelete }) => {
  const colors = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.fact;
  const src    = SOURCE_STYLES[entry.source] ?? SOURCE_STYLES.user;
  const audienceLabel = () => {
    if (entry.audience === 'global') return '🌐 All Agents';
    const ag = agents.find(a => a.id === entry.audience);
    if (ag) return `🔒 ${ag.name}`;
    return `👥 ${entry.audience.toUpperCase()}`;
  };

  return (
    <div className={`group relative bg-zinc-900/60 border rounded-xl p-4 hover:border-zinc-600/60 transition-all duration-200 ${
      entry.pinned ? 'border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.08)]' : 'border-zinc-800/60'}`}>
      {entry.pinned && <div className="absolute top-3 right-3"><Pin size={12} className="text-amber-400 fill-amber-400" /></div>}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
          {entry.category}
        </span>
        <span className={`text-[11px] font-mono ${src.color}`}>via {src.label}</span>
        {entry.accessCount > 0 && <span className="text-[11px] text-zinc-600 font-mono">· read {entry.accessCount}×</span>}
      </div>

      <p className="text-sm font-semibold text-zinc-100 mb-1.5 pr-6">{entry.key}</p>
      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{entry.value}</p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2 text-[11px] text-zinc-600">
          <span>{entry.ownerId === 'global' ? '🌐 Company' : `🤖 ${entry.ownerName}`}</span>
          <span>→</span>
          <span className="text-zinc-500">{audienceLabel()}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onPin(entry)} title={entry.pinned ? 'Unpin' : 'Pin'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"><Pin size={13} /></button>
          <button onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"><Edit3 size={13} /></button>
          <button onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const MemoryBookPage: React.FC = () => {
  const [memories, setMemories]       = useState<MemoryEntry[]>([]);
  const [agents, setAgents]           = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'all'>('all');
  const [activeView, setActiveView]   = useState<'global' | 'agent'>('global');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [showModal, setShowModal]     = useState(false);
  const [editEntry, setEditEntry]     = useState<MemoryEntry | null>(null);
  const [snapshot, setSnapshot]       = useState<string | null>(null);
  const [showSnapshot, setShowSnapshot] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mems, stateRes] = await Promise.all([
        api.fetchMemories(),
        fetch('http://localhost:5035/api/simulation/state').then(r => r.json()),
      ]);
      setMemories(mems);
      setAgents((stateRes.agents ?? []).map((a: any) => ({ id: a.id, name: a.name, role: a.role })));
    } catch (e) {
      console.error('Memory Book fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 12_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const filtered = memories.filter(m => {
    if (activeView === 'global' && m.ownerId !== 'global') return false;
    if (activeView === 'agent') {
      if (!selectedAgent) return m.ownerId !== 'global';
      if (m.ownerId !== selectedAgent) return false;
    }
    if (activeCategory !== 'all' && m.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q);
    }
    return true;
  });

  const pinnedList   = filtered.filter(m => m.pinned);
  const unpinnedList = filtered.filter(m => !m.pinned);

  const handleSave = async (data: any) => {
    if (editEntry) {
      await api.updateMemory(editEntry.id, { key: data.key, value: data.value, category: data.category, audience: data.audience, pinned: data.pinned });
    } else {
      await api.createMemory(data);
    }
    setEditEntry(null);
    await fetchData();
  };

  const handlePin = async (entry: MemoryEntry) => {
    await api.updateMemory(entry.id, { key: entry.key, value: entry.value, category: entry.category, audience: entry.audience, pinned: !entry.pinned });
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this memory entry?')) return;
    await api.deleteMemory(id);
    await fetchData();
  };

  const handleViewSnapshot = async () => {
    if (!selectedAgent) return;
    try {
      const res = await api.fetchMemorySnapshot(selectedAgent);
      setSnapshot(res.snapshot || '(no memories found for this agent)');
      setShowSnapshot(true);
    } catch { setSnapshot('Error fetching snapshot.'); setShowSnapshot(true); }
  };

  const stats = {
    total: memories.length,
    global: memories.filter(m => m.ownerId === 'global').length,
    agentOwned: memories.filter(m => m.ownerId !== 'global').length,
    pinned: memories.filter(m => m.pinned).length,
    aiWritten: memories.filter(m => ['agent','heartbeat','task'].includes(m.source)).length,
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30">
            <BookOpen className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Memory Book</h2>
            <p className="text-xs text-zinc-500">Agent persistent knowledge — read &amp; written autonomously during heartbeats &amp; tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800 transition-all" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => { setEditEntry(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-900/30">
            <Plus size={15} />Add Memory
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: stats.total,      icon: BookOpen, color: 'text-zinc-300' },
          { label: 'Global',     value: stats.global,     icon: Globe,    color: 'text-sky-400' },
          { label: 'Agent-owned',value: stats.agentOwned, icon: User,     color: 'text-purple-400' },
          { label: 'Pinned',     value: stats.pinned,     icon: Pin,      color: 'text-amber-400' },
          { label: 'AI-written', value: stats.aiWritten,  icon: Zap,      color: 'text-emerald-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 flex items-center gap-3">
              <Icon size={16} className={s.color} />
              <div>
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-zinc-600 font-mono">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1">
          <button onClick={() => setActiveView('global')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeView === 'global'
              ? 'bg-sky-600/25 text-sky-400 border border-sky-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Globe size={13} />Global / Company
          </button>
          <button onClick={() => setActiveView('agent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeView === 'agent'
              ? 'bg-purple-600/25 text-purple-400 border border-purple-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Cpu size={13} />Per-Agent
          </button>
        </div>

        {activeView === 'agent' && (
          <div className="flex items-center gap-2">
            <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50">
              <option value="">All agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
            </select>
            {selectedAgent && (
              <button onClick={handleViewSnapshot}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-emerald-400 hover:bg-zinc-700 transition-all">
                <Eye size={12} />Preview Context
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          const colors = CATEGORY_COLORS[cat.id] ?? {};
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active
                  ? cat.id === 'all'
                    ? 'bg-zinc-700/50 text-zinc-100 border-zinc-600'
                    : `${(colors as any).bg} ${(colors as any).text} ${(colors as any).border}`
                  : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/60 hover:text-zinc-300 hover:bg-zinc-800/60'}`}>
              <Icon size={11} />{cat.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories…"
          className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"><X size={13} /></button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-zinc-500">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm">Loading memories…</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 mb-4"><BookOpen size={28} className="text-zinc-600" /></div>
          <p className="text-sm text-zinc-500">No memories found.</p>
          <p className="text-xs text-zinc-600 mt-1">{memories.length === 0 ? 'Add your first memory entry to get started.' : 'Try changing the filter or search query.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin size={13} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pinned — Always Injected into Agent Context</span>
                <div className="flex-1 h-px bg-amber-500/20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {pinnedList.map(m => (
                  <MemoryCard key={m.id} entry={m} agents={agents}
                    onPin={handlePin} onEdit={e => { setEditEntry(e); setShowModal(true); }} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {unpinnedList.length > 0 && (
            <div>
              {pinnedList.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={13} className="text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recent</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {unpinnedList.map(m => (
                  <MemoryCard key={m.id} entry={m} agents={agents}
                    onPin={handlePin} onEdit={e => { setEditEntry(e); setShowModal(true); }} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-zinc-600 text-center">Showing {filtered.length} of {memories.length} memories</p>
      )}

      {showModal && (
        <MemoryModal entry={editEntry} agents={agents}
          onClose={() => { setShowModal(false); setEditEntry(null); }}
          onSave={handleSave} />
      )}

      {showSnapshot && snapshot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-emerald-400" />
                <span className="font-semibold text-zinc-100 text-sm">LLM Context Preview</span>
                <span className="text-xs text-zinc-500 ml-1">— what this agent reads on each activation</span>
              </div>
              <button onClick={() => setShowSnapshot(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">{snapshot}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
