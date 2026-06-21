import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Target, Plus, Search, ChevronRight, Phone, Mail, User2, Building2, XCircle } from 'lucide-react';
import type { Lead, LeadStage } from '../types';

const STAGES: { id: LeadStage; label: string; color: string; bg: string; dot: string }[] = [
  { id: 'New',       label: 'New',       color: 'text-sky-400',     bg: 'bg-sky-950/40 border-sky-800/50',   dot: 'bg-sky-400' },
  { id: 'Contacted', label: 'Contacted', color: 'text-violet-400',  bg: 'bg-violet-950/40 border-violet-800/50', dot: 'bg-violet-400' },
  { id: 'Qualified', label: 'Qualified', color: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-800/50',  dot: 'bg-amber-400' },
  { id: 'Proposal',  label: 'Proposal',  color: 'text-orange-400',  bg: 'bg-orange-950/40 border-orange-800/50', dot: 'bg-orange-400' },
  { id: 'Won',       label: 'Won',       color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/50', dot: 'bg-emerald-400' },
  { id: 'Lost',      label: 'Lost',      color: 'text-red-400',     bg: 'bg-red-950/40 border-red-800/50',    dot: 'bg-red-400' },
];

const SOURCE_COLORS: Record<string, string> = {
  Inbound:  'bg-teal-950/50 text-teal-400 border border-teal-800/40',
  Outbound: 'bg-blue-950/50 text-blue-400 border border-blue-800/40',
  Referral: 'bg-purple-950/50 text-purple-400 border border-purple-800/40',
  Campaign: 'bg-pink-950/50 text-pink-400 border border-pink-800/40',
};

function fmtINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return '1d ago';
  if (d < 30)  return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

interface LeadCardProps {
  lead: Lead;
  onClick: (l: Lead) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => (
  <div
    onClick={() => onClick(lead)}
    className="group bg-zinc-900/70 border border-zinc-800/60 rounded-xl p-3.5 cursor-pointer hover:border-purple-500/30 hover:bg-zinc-900 transition-all duration-200 hover:shadow-[0_0_12px_rgba(168,85,247,0.08)] space-y-2.5"
  >
    {/* Header */}
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-100 truncate leading-tight">{lead.contactName}</p>
        <p className="text-[10px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
          <Building2 size={9} /> {lead.companyName}
        </p>
      </div>
      {lead.estimatedValue > 0 && (
        <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 rounded-md px-1.5 py-0.5">
          {fmtINR(lead.estimatedValue)}
        </span>
      )}
    </div>

    {/* Source badge */}
    <div className="flex items-center justify-between gap-2">
      <span className={`text-[9px] font-semibold uppercase tracking-wider rounded-md px-1.5 py-0.5 ${SOURCE_COLORS[lead.source] ?? 'bg-zinc-800/50 text-zinc-400'}`}>
        {lead.source}
      </span>
      <span className="text-[9px] text-zinc-600">{timeAgo(lead.createdAt)}</span>
    </div>

    {/* Assigned */}
    {lead.assignedToName && (
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
        <User2 size={9} className="shrink-0" />
        <span className="truncate">{lead.assignedToName}</span>
      </div>
    )}

    {/* Follow-up count */}
    {lead.followUps.length > 0 && (
      <div className="flex items-center gap-1 text-[9px] text-zinc-600">
        <ChevronRight size={8} />
        {lead.followUps.length} follow-up{lead.followUps.length > 1 ? 's' : ''}
      </div>
    )}
  </div>
);

interface LeadDetailDrawerProps {
  lead: Lead;
  onClose: () => void;
  onStageUpdate: (leadId: string, stage: string, note: string, by: string) => Promise<void>;
  onDelete: (leadId: string) => Promise<void>;
}

const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({ lead, onClose, onStageUpdate, onDelete }) => {
  const [noteText, setNoteText] = useState('');
  const [selectedStage, setSelectedStage] = useState(lead.stage);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdate = async () => {
    if (!noteText.trim() && selectedStage === lead.stage) return;
    setIsUpdating(true);
    await onStageUpdate(lead.id, selectedStage, noteText, 'Director');
    setNoteText('');
    setIsUpdating(false);
    onClose();
  };

  const stageCfg = STAGES.find(s => s.id === lead.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-sm h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-zinc-100 truncate">{lead.contactName}</h3>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
              <Building2 size={10} /> {lead.companyName}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageCfg?.bg} ${stageCfg?.color}`}>
              {lead.stage}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800">
              <XCircle size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Key Details */}
          <div className="grid grid-cols-2 gap-3">
            {lead.estimatedValue > 0 && (
              <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-3">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Deal Value</p>
                <p className="text-base font-bold text-emerald-400">{fmtINR(lead.estimatedValue)}</p>
              </div>
            )}
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-3">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Source</p>
              <p className="text-sm font-semibold text-zinc-200">{lead.source}</p>
            </div>
            {lead.subsidiaryName && (
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-3">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Entity</p>
                <p className="text-sm font-semibold text-zinc-200">{lead.subsidiaryName}</p>
              </div>
            )}
            {lead.assignedToName && (
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-3">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Assigned To</p>
                <p className="text-sm font-semibold text-zinc-200">{lead.assignedToName}</p>
              </div>
            )}
          </div>

          {/* Contact Info */}
          {(lead.email || lead.phone) && (
            <div className="space-y-2">
              <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">Contact</p>
              {lead.email && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Mail size={11} className="text-zinc-600" /> {lead.email}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Phone size={11} className="text-zinc-600" /> {lead.phone}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Timeline */}
          <div className="space-y-2">
            <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">Activity Timeline</p>
            {lead.followUps.length === 0 ? (
              <p className="text-xs text-zinc-700 italic">No follow-ups yet</p>
            ) : (
              <div className="space-y-2.5 relative">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-zinc-800" />
                {[...lead.followUps].reverse().map((fu, i) => (
                  <div key={i} className="pl-6 relative">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-purple-600/80 border border-purple-500/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-300" />
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{fu.note}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-zinc-600">{fu.createdBy}</span>
                      <span className="text-[9px] text-zinc-700">·</span>
                      <span className="text-[9px] text-zinc-600">{timeAgo(fu.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Stage & Add Note */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">Update Lead</p>
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50"
            >
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={2}
              placeholder="Add a follow-up note..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 resize-none"
            />
            <button
              onClick={handleUpdate}
              disabled={isUpdating || (!noteText.trim() && selectedStage === lead.stage)}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        </div>

        {/* Delete */}
        <div className="px-5 py-4 border-t border-zinc-800">
          {confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={() => onDelete(lead.id).then(onClose)} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold py-2 rounded-lg">Confirm Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2 rounded-lg">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="w-full text-red-500 hover:text-red-400 text-xs py-1.5 transition-colors">
              Delete Lead
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose }) => {
  const { subsidiaries, agents, employees, createLead } = useApp();
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Inbound');
  const [stage, setStage] = useState('New');
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [subsidiaryId, setSubsidiaryId] = useState('common');
  const [assignedToId, setAssignedToId] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const assignablePersons = useMemo(() => {
    const agentOpts = agents.map(a => ({ id: a.id, name: `${a.name} (AI Agent · ${a.role})` }));
    const empOpts = employees.map(e => ({ id: e.id, name: `${e.name} (${e.designation})` }));
    return [...agentOpts, ...empOpts];
  }, [agents, employees]);

  const handleAssignChange = (id: string) => {
    setAssignedToId(id);
    const person = [...agents, ...employees].find(p => p.id === id);
    setAssignedToName(person ? person.name : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) { setError('Contact name is required.'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await createLead(subsidiaryId, contactName, companyName, email, phone, source, stage, estimatedValue, assignedToId, assignedToName, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl z-10 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-zinc-900/60 backdrop-blur px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-600/20 border border-teal-500/30">
              <Target size={14} className="text-teal-400" />
            </div>
            <h2 className="text-sm font-bold text-zinc-100">New Lead</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-xs text-zinc-300">
          {error && <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Contact Name <span className="text-red-400">*</span></label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Priya Sharma"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Company Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Aura Industries"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98XXXXXXXX"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Source</label>
              <select value={source} onChange={e => setSource(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50">
                {['Inbound','Outbound','Referral','Campaign'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Initial Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50">
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Estimated Value (₹)</label>
              <input type="number" min="0" value={estimatedValue} onChange={e => setEstimatedValue(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Entity</label>
              <select value={subsidiaryId} onChange={e => setSubsidiaryId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50">
                <option value="common">Common (HQ)</option>
                {subsidiaries.filter(s => s.id !== 'common').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-semibold">Assign To</label>
            <select value={assignedToId} onChange={e => handleAssignChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50">
              <option value="">— Unassigned —</option>
              {assignablePersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-semibold">Initial Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Brief context about this lead..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all">
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LeadCRM: React.FC = () => {
  const { leads, subsidiaries, updateLeadStage, deleteLead } = useApp();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterSubsidiary, setFilterSubsidiary] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (filterSubsidiary !== 'all' && l.subsidiaryId !== filterSubsidiary) return false;
      if (filterSource !== 'all' && l.source !== filterSource) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.contactName.toLowerCase().includes(q) && !l.companyName.toLowerCase().includes(q) && !l.assignedToName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [leads, filterSubsidiary, filterSource, searchQuery]);

  const leadsByStage = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = {
      New: [], Contacted: [], Qualified: [], Proposal: [], Won: [], Lost: []
    };
    filteredLeads.forEach(l => map[l.stage]?.push(l));
    return map;
  }, [filteredLeads]);

  const totalPipeline = filteredLeads.filter(l => l.stage !== 'Lost').reduce((s, l) => s + l.estimatedValue, 0);
  const wonValue = filteredLeads.filter(l => l.stage === 'Won').reduce((s, l) => s + l.estimatedValue, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-teal-600/20 border border-teal-500/30">
              <Target size={16} className="text-teal-400" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">Lead Pipeline</h2>
            <span className="text-[10px] font-mono bg-zinc-800/60 border border-zinc-700/50 rounded-md px-2 py-0.5 text-zinc-400">
              {filteredLeads.length} LEADS
            </span>
          </div>
          <p className="text-xs text-zinc-500">CRM pipeline · track contacts from first touch to closed deal</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-900/30"
        >
          <Plus size={14} /> New Lead
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3.5 space-y-0.5">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Active Pipeline</p>
          <p className="text-lg font-bold text-teal-400">{fmtINR(totalPipeline)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3.5 space-y-0.5">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Won Value</p>
          <p className="text-lg font-bold text-emerald-400">{fmtINR(wonValue)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3.5 space-y-0.5">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Win Rate</p>
          <p className="text-lg font-bold text-amber-400">
            {filteredLeads.length > 0 ? `${Math.round((leadsByStage.Won.length / filteredLeads.length) * 100)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 w-44"
          />
        </div>
        <select value={filterSubsidiary} onChange={e => setFilterSubsidiary(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50">
          <option value="all">All Entities</option>
          <option value="common">Common (HQ)</option>
          {subsidiaries.filter(s => s.id !== 'common').map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50">
          <option value="all">All Sources</option>
          {['Inbound','Outbound','Referral','Campaign'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[400px]">
        {STAGES.map(stage => {
          const stageLeads = leadsByStage[stage.id] || [];
          const stageValue = stageLeads.reduce((s, l) => s + l.estimatedValue, 0);
          return (
            <div key={stage.id} className="flex-shrink-0 w-56">
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-2.5 ${stage.bg}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900/50 rounded px-1.5 py-0.5">
                  {stageLeads.length}
                </span>
              </div>
              {stageValue > 0 && (
                <p className="text-[9px] text-zinc-600 px-1 mb-2">{fmtINR(stageValue)} pipeline</p>
              )}
              {/* Cards */}
              <div className="space-y-2">
                {stageLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} onClick={setSelectedLead} />
                ))}
                {stageLeads.length === 0 && (
                  <div className="border border-dashed border-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-[9px] text-zinc-700">No leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals/Drawers */}
      {isCreateOpen && <CreateLeadModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStageUpdate={async (id, stage, note, by) => {
            await updateLeadStage(id, stage, note, by);
            setSelectedLead(null);
          }}
          onDelete={async (id) => {
            await deleteLead(id);
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
};
