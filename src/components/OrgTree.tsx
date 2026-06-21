import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GitBranch, ChevronDown, ChevronRight, Building2, Globe, Bot } from 'lucide-react';
import type { Subsidiary, Agent, Employee } from '../types';

type OrgNode =
  | { kind: 'root' }
  | { kind: 'subsidiary'; data: Subsidiary }
  | { kind: 'dept'; name: string; subsidiaryId: string }
  | { kind: 'agent'; data: Agent }
  | { kind: 'employee'; data: Employee };

interface NodeCardProps {
  node: OrgNode;
  isSelected: boolean;
  onClick: () => void;
}

const STATUS_DOT: Record<string, string> = {
  idle:     'bg-zinc-500',
  thinking: 'bg-yellow-400 animate-pulse',
  working:  'bg-purple-500 animate-pulse',
  resting:  'bg-blue-400',
  Active:   'bg-emerald-500',
  'On Leave': 'bg-amber-400',
  Resigned: 'bg-red-500',
};

const DEPT_ICONS: Record<string, string> = {
  Engineering: '⚙️', Product: '📋', Design: '🎨', Marketing: '📣',
  Sales: '🤝', Finance: '💰', HR: '👥', Operations: '🔧', Legal: '⚖️', Other: '📁',
};

const NodeCard: React.FC<NodeCardProps> = ({ node, isSelected, onClick }) => {
  if (node.kind === 'root') {
    return (
      <button onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all shadow-lg ${isSelected
          ? 'bg-purple-950/60 border-purple-500/60 shadow-purple-900/20'
          : 'bg-zinc-900/80 border-zinc-700/60 hover:border-purple-500/40'
        }`}>
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
          <Globe size={16} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-zinc-100">AstraCore HQ</p>
          <p className="text-[9px] text-purple-400 font-mono">Root Organization</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'subsidiary') {
    const sub = node.data;
    return (
      <button onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isSelected
          ? 'bg-indigo-950/50 border-indigo-500/50'
          : 'bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-600/60'
        }`}>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${sub.color} opacity-90`}>
          <Building2 size={14} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-zinc-100">{sub.name}</p>
          <p className="text-[9px] text-zinc-500">{sub.industry}</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'dept') {
    return (
      <button onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isSelected
          ? 'bg-zinc-800/80 border-zinc-600'
          : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/60'
        }`}>
        <span className="text-sm">{DEPT_ICONS[node.name] ?? '📁'}</span>
        <div className="text-left">
          <p className="text-[10px] font-semibold text-zinc-300">{node.name}</p>
          <p className="text-[8px] text-zinc-600">Department</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'agent') {
    const a = node.data;
    return (
      <button onClick={onClick}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${isSelected
          ? 'bg-purple-950/50 border-purple-500/40'
          : 'bg-zinc-900/40 border-zinc-800/40 hover:border-purple-500/20'
        }`}>
        <div className="relative shrink-0">
          <span className="text-base">{a.avatar}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-950 ${STATUS_DOT[a.status] ?? 'bg-zinc-500'}`} />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-semibold text-zinc-200">{a.name}</p>
            <Bot size={8} className="text-purple-500" />
          </div>
          <p className="text-[8px] text-zinc-600">{a.role}</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'employee') {
    const e = node.data;
    return (
      <button onClick={onClick}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${isSelected
          ? 'bg-amber-950/40 border-amber-500/40'
          : 'bg-zinc-900/40 border-zinc-800/40 hover:border-amber-500/20'
        }`}>
        <div className="relative shrink-0">
          <span className="text-base">{e.avatar}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-950 ${STATUS_DOT[e.status] ?? 'bg-zinc-500'}`} />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-semibold text-zinc-200">{e.name}</p>
          <p className="text-[8px] text-zinc-600">{e.designation}</p>
        </div>
      </button>
    );
  }

  return null;
};

interface TreeBranchProps {
  label: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  depth?: number;
}

const TreeBranch: React.FC<TreeBranchProps> = ({ label, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {hasChildren && (
          <button
            onClick={() => setOpen(!open)}
            className="w-4 h-4 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
          >
            {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        )}
        {!hasChildren && <div className="w-4 shrink-0" />}
        {label}
      </div>
      {hasChildren && open && (
        <div className="ml-5 mt-1.5 space-y-1.5 border-l border-zinc-800/60 pl-3">
          {children}
        </div>
      )}
    </div>
  );
};

interface DetailPanelProps {
  node: OrgNode | null;
  agents: Agent[];
  employees: Employee[];
  subsidiaries: Subsidiary[];
}

const DetailPanel: React.FC<DetailPanelProps> = ({ node, agents, employees, subsidiaries }) => {
  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <GitBranch size={28} className="text-zinc-700 mb-3" />
        <p className="text-xs text-zinc-500">Select any node in the tree</p>
        <p className="text-[10px] text-zinc-700 mt-1">to view its details</p>
      </div>
    );
  }

  if (node.kind === 'root') {
    const totalAgents = agents.length;
    const totalEmps = employees.length;
    const totalSubs = subsidiaries.filter(s => s.id !== 'common').length;
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">AstraCore HQ</h3>
            <p className="text-[10px] text-purple-400">Root Organization</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-2.5 text-center">
            <p className="text-base font-bold text-purple-400">{totalSubs}</p>
            <p className="text-[9px] text-zinc-600">Subsidiaries</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-2.5 text-center">
            <p className="text-base font-bold text-violet-400">{totalAgents}</p>
            <p className="text-[9px] text-zinc-600">AI Agents</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-2.5 text-center">
            <p className="text-base font-bold text-amber-400">{totalEmps}</p>
            <p className="text-[9px] text-zinc-600">Employees</p>
          </div>
        </div>
      </div>
    );
  }

  if (node.kind === 'subsidiary') {
    const sub = node.data;
    const subAgents = agents.filter(a => a.subsidiaryId === sub.id);
    const subEmps = employees.filter(e => e.subsidiaryId === sub.id);
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${sub.color}`}>
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">{sub.name}</h3>
            <p className="text-[10px] text-zinc-500">{sub.industry}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-2.5">
            <p className="text-[9px] text-zinc-600">AI Agents</p>
            <p className="font-bold text-violet-400">{subAgents.length}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-2.5">
            <p className="text-[9px] text-zinc-600">Employees</p>
            <p className="font-bold text-amber-400">{subEmps.length}</p>
          </div>
        </div>
        {sub.email && <p className="text-[10px] text-zinc-500">{sub.email}</p>}
        {sub.address && <p className="text-[10px] text-zinc-600">{sub.address}</p>}
      </div>
    );
  }

  if (node.kind === 'agent') {
    const a = node.data;
    const sub = subsidiaries.find(s => s.id === a.subsidiaryId);
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{a.avatar}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-zinc-100">{a.name}</h3>
              <Bot size={11} className="text-purple-400" />
            </div>
            <p className="text-[10px] text-purple-400">{a.role} · AI Agent</p>
          </div>
        </div>
        <div className="space-y-2 text-[10px] text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-600">Entity</span>
            <span>{sub?.name ?? a.subsidiaryId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Level</span>
            <span className="text-amber-400">Lv. {a.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Efficiency</span>
            <span className="text-teal-400">{(a.efficiency * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Status</span>
            <span className={`capitalize ${a.status === 'working' ? 'text-purple-400' : a.status === 'idle' ? 'text-zinc-400' : 'text-yellow-400'}`}>
              {a.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Model</span>
            <span className="font-mono">{a.modelId}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {a.roleDefinition?.commonSkills?.slice(0, 3).map(s => (
            <span key={s} className="text-[8px] bg-purple-950/40 border border-purple-800/40 text-purple-400 rounded-md px-1.5 py-0.5">{s}</span>
          ))}
        </div>
      </div>
    );
  }

  if (node.kind === 'employee') {
    const e = node.data;
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{e.avatar}</span>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">{e.name}</h3>
            <p className="text-[10px] text-amber-400">{e.designation}</p>
          </div>
        </div>
        <div className="space-y-2 text-[10px] text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-600">Department</span>
            <span>{e.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Entity</span>
            <span>{e.subsidiaryName || e.subsidiaryId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Status</span>
            <span className={e.status === 'Active' ? 'text-emerald-400' : e.status === 'On Leave' ? 'text-amber-400' : 'text-red-400'}>
              {e.status}
            </span>
          </div>
          {e.salary > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-600">Salary</span>
              <span className="text-emerald-400">₹{e.salary.toLocaleString('en-IN')}/mo</span>
            </div>
          )}
          {e.joinDate && (
            <div className="flex justify-between">
              <span className="text-zinc-600">Since</span>
              <span>{e.joinDate}</span>
            </div>
          )}
          {e.reportsToName && (
            <div className="flex justify-between">
              <span className="text-zinc-600">Reports To</span>
              <span>{e.reportsToName}</span>
            </div>
          )}
          {e.email && <p className="pt-1 border-t border-zinc-800 text-zinc-500">{e.email}</p>}
          {e.phone && <p className="text-zinc-500">{e.phone}</p>}
        </div>
      </div>
    );
  }

  if (node.kind === 'dept') {
    return (
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{DEPT_ICONS[node.name] ?? '📁'}</span>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">{node.name}</h3>
            <p className="text-[10px] text-zinc-500">Department</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export const OrgTree: React.FC = () => {
  const { subsidiaries, agents, employees } = useApp();
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>({ kind: 'root' });

  // Group employees by subsidiary + department
  const empsBySubAndDept = useMemo(() => {
    const map: Record<string, Record<string, Employee[]>> = {};
    employees.forEach(e => {
      if (!map[e.subsidiaryId]) map[e.subsidiaryId] = {};
      if (!map[e.subsidiaryId][e.department]) map[e.subsidiaryId][e.department] = [];
      map[e.subsidiaryId][e.department].push(e);
    });
    return map;
  }, [employees]);

  // Group agents by subsidiary
  const agentsBySub = useMemo(() => {
    const map: Record<string, Agent[]> = {};
    agents.forEach(a => {
      if (!map[a.subsidiaryId]) map[a.subsidiaryId] = [];
      map[a.subsidiaryId].push(a);
    });
    return map;
  }, [agents]);

  const activeSubs = subsidiaries.filter(s => s.id !== 'common');
  const commonSub = subsidiaries.find(s => s.id === 'common');

  const selectNode = (node: OrgNode) => {
    setSelectedNode(JSON.stringify(node) === JSON.stringify(selectedNode) ? null : node);
  };

  const isSelected = (node: OrgNode) => JSON.stringify(node) === JSON.stringify(selectedNode);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
          <GitBranch size={16} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-100">Organization Tree</h2>
          <p className="text-xs text-zinc-500">Full hierarchy · click any node for details</p>
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-5 min-h-[500px]">
        {/* Tree Panel */}
        <div className="flex-1 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 overflow-y-auto">
          <TreeBranch
            defaultOpen
            label={<NodeCard node={{ kind: 'root' }} isSelected={isSelected({ kind: 'root' })} onClick={() => selectNode({ kind: 'root' })} />}
          >
            {/* Active Subsidiaries */}
            {activeSubs.map(sub => {
              const subAgents = agentsBySub[sub.id] || [];
              const subDepts = empsBySubAndDept[sub.id] || {};
              const deptNames = Object.keys(subDepts);

              return (
                <TreeBranch
                  key={sub.id}
                  defaultOpen
                  label={<NodeCard node={{ kind: 'subsidiary', data: sub }} isSelected={isSelected({ kind: 'subsidiary', data: sub })} onClick={() => selectNode({ kind: 'subsidiary', data: sub })} />}
                >
                  {/* AI Agents under this subsidiary */}
                  {subAgents.length > 0 && (
                    <TreeBranch
                      defaultOpen
                      label={
                        <div className="flex items-center gap-2 px-2 py-1">
                          <Bot size={11} className="text-purple-500" />
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">AI Agents</span>
                          <span className="text-[9px] text-zinc-700 bg-zinc-800/60 rounded px-1">{subAgents.length}</span>
                        </div>
                      }
                    >
                      {subAgents.map(a => (
                        <TreeBranch key={a.id} label={<NodeCard node={{ kind: 'agent', data: a }} isSelected={isSelected({ kind: 'agent', data: a })} onClick={() => selectNode({ kind: 'agent', data: a })} />} />
                      ))}
                    </TreeBranch>
                  )}

                  {/* Human Employees by Department */}
                  {deptNames.map(dept => (
                    <TreeBranch
                      key={dept}
                      defaultOpen
                      label={<NodeCard node={{ kind: 'dept', name: dept, subsidiaryId: sub.id }} isSelected={isSelected({ kind: 'dept', name: dept, subsidiaryId: sub.id })} onClick={() => selectNode({ kind: 'dept', name: dept, subsidiaryId: sub.id })} />}
                    >
                      {subDepts[dept].map(emp => (
                        <TreeBranch key={emp.id} label={<NodeCard node={{ kind: 'employee', data: emp }} isSelected={isSelected({ kind: 'employee', data: emp })} onClick={() => selectNode({ kind: 'employee', data: emp })} />} />
                      ))}
                    </TreeBranch>
                  ))}
                </TreeBranch>
              );
            })}

            {/* Common HQ */}
            {commonSub && (
              <TreeBranch
                defaultOpen={false}
                label={<NodeCard node={{ kind: 'subsidiary', data: commonSub }} isSelected={isSelected({ kind: 'subsidiary', data: commonSub })} onClick={() => selectNode({ kind: 'subsidiary', data: commonSub })} />}
              >
                {(agentsBySub['common'] || []).map(a => (
                  <TreeBranch key={a.id} label={<NodeCard node={{ kind: 'agent', data: a }} isSelected={isSelected({ kind: 'agent', data: a })} onClick={() => selectNode({ kind: 'agent', data: a })} />} />
                ))}
                {Object.entries(empsBySubAndDept['common'] || {}).map(([dept, emps]) => (
                  <TreeBranch
                    key={dept}
                    label={<NodeCard node={{ kind: 'dept', name: dept, subsidiaryId: 'common' }} isSelected={isSelected({ kind: 'dept', name: dept, subsidiaryId: 'common' })} onClick={() => selectNode({ kind: 'dept', name: dept, subsidiaryId: 'common' })} />}
                  >
                    {emps.map(emp => (
                      <TreeBranch key={emp.id} label={<NodeCard node={{ kind: 'employee', data: emp }} isSelected={isSelected({ kind: 'employee', data: emp })} onClick={() => selectNode({ kind: 'employee', data: emp })} />} />
                    ))}
                  </TreeBranch>
                ))}
              </TreeBranch>
            )}
          </TreeBranch>
        </div>

        {/* Detail Panel */}
        <div className="w-64 shrink-0 bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-y-auto">
          <DetailPanel node={selectedNode} agents={agents} employees={employees} subsidiaries={subsidiaries} />
        </div>
      </div>
    </div>
  );
};
