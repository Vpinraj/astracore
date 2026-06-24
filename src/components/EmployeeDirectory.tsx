import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createEmployeeRequest, deleteEmployeeRequest } from '../store/slices/crmSlice';
import { Users2, Plus, Briefcase, Mail, Phone, Calendar, Trash2, Building2, Search } from 'lucide-react';


const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Legal', 'Other'];

const DEPT_COLORS: Record<string, string> = {
  Engineering:  'bg-blue-950/50 text-blue-400 border-blue-800/40',
  Product:      'bg-purple-950/50 text-purple-400 border-purple-800/40',
  Design:       'bg-pink-950/50 text-pink-400 border-pink-800/40',
  Marketing:    'bg-orange-950/50 text-orange-400 border-orange-800/40',
  Sales:        'bg-teal-950/50 text-teal-400 border-teal-800/40',
  Finance:      'bg-emerald-950/50 text-emerald-400 border-emerald-800/40',
  HR:           'bg-amber-950/50 text-amber-400 border-amber-800/40',
  Operations:   'bg-sky-950/50 text-sky-400 border-sky-800/40',
  Legal:        'bg-rose-950/50 text-rose-400 border-rose-800/40',
  Other:        'bg-zinc-900/50 text-zinc-400 border-zinc-700/40',
};

const STATUS_COLORS: Record<string, string> = {
  Active:     'bg-emerald-950/50 text-emerald-400 border-emerald-800/40',
  'On Leave': 'bg-amber-950/50 text-amber-400 border-amber-800/40',
  Resigned:   'bg-red-950/50 text-red-400 border-red-800/40',
};

function fmtSalary(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L/mo`;
  return `₹${n.toLocaleString('en-IN')}/mo`;
}

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const agents = useAppSelector(state => state.agents.items);
  const existingEmployees = useAppSelector(state => state.crm.employees);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [subsidiaryId, setSubsidiaryId] = useState('common');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState(0);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportsToId, setReportsToId] = useState('');
  const [reportsToName, setReportsToName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [status, setStatus] = useState('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const AVATARS = ['👤', '👩‍💼', '👨‍💼', '👩‍💻', '👨‍💻', '👩‍🔬', '👨‍🔬', '🎨', '📊', '📱', '🧑‍🏫', '👷'];

  const managerOptions = useMemo(() => [
    ...agents.map(a => ({ id: a.id, name: `${a.name} (AI Agent · ${a.role})` })),
    ...existingEmployees.map(e => ({ id: e.id, name: `${e.name} (${e.designation})` }))
  ], [agents, existingEmployees]);

  const handleManagerChange = (id: string) => {
    setReportsToId(id);
    const person = [...agents, ...existingEmployees].find(p => p.id === id);
    setReportsToName(person ? person.name : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!designation.trim()) { setError('Designation is required.'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      dispatch(createEmployeeRequest({ name, designation, department, subsidiaryId, email, phone, salary, joinDate, reportsToId, reportsToName, avatar, status }));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create employee.');
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
            <div className="p-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30">
              <Users2 size={14} className="text-amber-400" />
            </div>
            <h2 className="text-sm font-bold text-zinc-100">Add Team Member</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-xs text-zinc-300">
          {error && <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400">{error}</div>}

          {/* Avatar picker */}
          <div className="space-y-2">
            <label className="text-zinc-400 font-semibold">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button key={a} type="button" onClick={() => setAvatar(a)}
                  className={`text-xl p-2 rounded-lg border transition-all ${avatar === a ? 'border-purple-500 bg-purple-950/30' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Full Name <span className="text-red-400">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kavya Iyer"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Designation <span className="text-red-400">*</span></label>
              <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Senior Engineer"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50">
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
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
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 80 XXXX XXXX"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Monthly Salary (₹)</label>
              <input type="number" min="0" value={salary} onChange={e => setSalary(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Join Date</label>
              <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50">
                <option>Active</option>
                <option>On Leave</option>
                <option>Resigned</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Reports To</label>
              <select value={reportsToId} onChange={e => handleManagerChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50">
                <option value="">— None —</option>
                {managerOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all">
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EmployeeDirectory: React.FC = () => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(state => state.crm.employees);
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterSub, setFilterSub] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => employees.filter(emp => {
    if (filterSub !== 'all' && emp.subsidiaryId !== filterSub) return false;
    if (filterDept !== 'all' && emp.department !== filterDept) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!emp.name.toLowerCase().includes(q) && !emp.designation.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [employees, filterSub, filterDept, searchQuery]);

  const departments = useMemo(() => [...new Set(employees.map(e => e.department))], [employees]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30">
              <Users2 size={16} className="text-amber-400" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">Team Directory</h2>
            <span className="text-[10px] font-mono bg-zinc-800/60 border border-zinc-700/50 rounded-md px-2 py-0.5 text-zinc-400">
              {employees.length} MEMBERS
            </span>
          </div>
          <p className="text-xs text-zinc-500">Human employees across all subsidiaries</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-900/30"
        >
          <Plus size={14} /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl">
        <div className="space-y-1 flex-1 min-w-[140px] max-w-xs">
          <span className="text-[10px] text-zinc-500 font-mono block">SEARCH EMPLOYEES</span>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search team..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50" />
          </div>
        </div>
        <div className="space-y-1 flex-1 min-w-[140px] max-w-[200px]">
          <span className="text-[10px] text-zinc-500 font-mono block">FILTER ENTITY</span>
          <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 cursor-pointer">
            <option value="all">All Entities</option>
            <option value="common">Common (HQ)</option>
            {subsidiaries.filter(s => s.id !== 'common').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 flex-1 min-w-[140px] max-w-[200px]">
          <span className="text-[10px] text-zinc-500 font-mono block">FILTER DEPARTMENT</span>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 cursor-pointer">
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/30">
        <table className="w-full min-w-[800px] text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-950/60 border-b border-zinc-900 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
              <th className="p-4 pl-5">Employee</th>
              <th className="p-4">Designation</th>
              <th className="p-4">Department</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 md:p-12 text-center text-zinc-500 bg-zinc-950/15">
                  <Users2 className="mx-auto text-zinc-700 w-10 h-10 mb-3" />
                  <p className="text-sm font-semibold">No team members found</p>
                  <p className="text-xs text-zinc-600 mt-1">Try modifying your filter options or add a new human employee.</p>
                </td>
              </tr>
            ) : (
              filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors group">
                  <td className="p-4 pl-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xl w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        {emp.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-100 truncate">{emp.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                          {emp.email && <span className="truncate" title={emp.email}>{emp.email}</span>}
                          {emp.email && emp.phone && <span>·</span>}
                          {emp.phone && <span className="truncate">{emp.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-zinc-200">
                    {emp.designation}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${DEPT_COLORS[emp.department] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {emp.department}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-zinc-600" />
                      <span className="font-medium text-zinc-300 truncate">
                        {emp.subsidiaryName || emp.subsidiaryId}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border ${STATUS_COLORS[emp.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-4 pr-5 text-right">
                    {confirmDeleteId === emp.id ? (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => {
                            dispatch(deleteEmployeeRequest(emp.id));
                            setConfirmDeleteId(null);
                          }}
                          className="text-[10px] px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded-md">Confirm</button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(emp.id)}
                        className="text-[10px] text-zinc-500 hover:text-red-500 py-1 px-2 rounded-md hover:bg-red-500/10 transition-colors flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && <CreateEmployeeModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />}
    </div>
  );
};
