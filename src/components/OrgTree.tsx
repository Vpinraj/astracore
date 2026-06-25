import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { GitBranch, Building2, Globe, Bot, ArrowDown } from 'lucide-react';
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
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-300 shadow-md ${isSelected
          ? 'bg-purple-950/70 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
          : 'bg-zinc-900 border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900/90'
        }`}>
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
          <Globe size={14} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-zinc-100">AstraCore HQ</p>
          <p className="text-[8px] text-purple-400 font-mono leading-none">Root Treasury</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'subsidiary') {
    const sub = node.data;
    return (
      <button onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${isSelected
          ? 'bg-indigo-950/60 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-600'
        }`}>
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${sub.color || 'from-zinc-700 to-slate-800'} opacity-90`}>
          <Building2 size={12} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-bold text-zinc-100 truncate max-w-[100px]">{sub.name}</p>
          <p className="text-[8px] text-zinc-500 leading-none">{sub.industry}</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'dept') {
    return (
      <button onClick={onClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${isSelected
          ? 'bg-zinc-800 border-zinc-500'
          : 'bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700'
        }`}>
        <span className="text-xs">{DEPT_ICONS[node.name] ?? '📁'}</span>
        <div className="text-left">
          <p className="text-[9px] font-bold text-zinc-300 leading-tight">{node.name}</p>
          <p className="text-[7px] text-zinc-600 leading-none">Department</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'agent') {
    const a = node.data;
    return (
      <button onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all duration-200 ${isSelected
          ? 'bg-purple-950/40 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
          : 'bg-zinc-900/40 border-zinc-900/50 hover:border-purple-500/30'
        }`}>
        <div className="relative shrink-0">
          <span className="text-sm">{a.avatar}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-zinc-950 ${STATUS_DOT[a.status] ?? 'bg-zinc-500'}`} />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-bold text-zinc-200 truncate max-w-[80px] leading-tight">{a.name}</p>
          <p className="text-[7px] text-zinc-600 leading-none">{a.role}</p>
        </div>
      </button>
    );
  }

  if (node.kind === 'employee') {
    const e = node.data;
    return (
      <button onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all duration-200 ${isSelected
          ? 'bg-amber-950/30 border-amber-500/45 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
          : 'bg-zinc-900/40 border-zinc-900/50 hover:border-amber-500/30'
        }`}>
        <div className="relative shrink-0">
          <span className="text-xs">{e.avatar}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-zinc-950 ${STATUS_DOT[e.status] ?? 'bg-zinc-500'}`} />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-bold text-zinc-200 truncate max-w-[80px] leading-tight">{e.name}</p>
          <p className="text-[7px] text-zinc-600 leading-none">{e.designation}</p>
        </div>
      </button>
    );
  }

  return null;
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
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-zinc-950/20">
        <GitBranch size={22} className="text-zinc-800 mb-2" />
        <p className="text-[10px] text-zinc-500">Select any node in the reversed tree</p>
        <p className="text-[8px] text-zinc-700 mt-0.5">to inspect details</p>
      </div>
    );
  }

  if (node.kind === 'root') {
    const totalAgents = agents.length;
    const totalEmps = employees.length;
    const totalSubs = subsidiaries.filter(s => s.id !== 'common').length;
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
            <Globe size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100">AstraCore HQ</h3>
            <p className="text-[9px] text-purple-400 font-mono">Root Treasury</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900">
            <p className="text-sm font-bold text-purple-400 font-mono">{totalSubs}</p>
            <p className="text-[8px] text-zinc-600">Subsidiaries</p>
          </div>
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900">
            <p className="text-sm font-bold text-violet-400 font-mono">{totalAgents}</p>
            <p className="text-[8px] text-zinc-600">AI Agents</p>
          </div>
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900">
            <p className="text-sm font-bold text-amber-400 font-mono">{totalEmps}</p>
            <p className="text-[8px] text-zinc-600">Employees</p>
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
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${sub.color || 'from-zinc-700 to-slate-800'}`}>
            <Building2 size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100">{sub.name}</h3>
            <p className="text-[9px] text-zinc-500 font-sans">{sub.industry}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 font-mono">
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900">
            <p className="text-[8px] text-zinc-600">AI Agents</p>
            <p className="text-xs font-bold text-violet-400">{subAgents.length}</p>
          </div>
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900">
            <p className="text-[8px] text-zinc-600">Employees</p>
            <p className="text-xs font-bold text-amber-400">{subEmps.length}</p>
          </div>
        </div>
        {sub.email && <p className="text-[9px] text-zinc-500 truncate">{sub.email}</p>}
        {sub.address && <p className="text-[9px] text-zinc-600 leading-snug">{sub.address}</p>}
      </div>
    );
  }

  if (node.kind === 'agent') {
    const a = node.data;
    const sub = subsidiaries.find(s => s.id === a.subsidiaryId);
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{a.avatar}</span>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 leading-tight">{a.name}</h3>
            <p className="text-[8px] text-purple-400 font-mono">AI Agent · {a.role}</p>
          </div>
        </div>
        <div className="space-y-1.5 text-[9px] text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
          <div className="flex justify-between">
            <span className="text-zinc-600">Cluster</span>
            <span className="truncate max-w-[100px]">{sub?.name ?? a.subsidiaryId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Efficiency</span>
            <span className="text-teal-400">{(a.efficiency * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Status</span>
            <span className={a.status === 'working' ? 'text-purple-400' : 'text-zinc-400'}>{a.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Level</span>
            <span className="text-amber-400">Lv. {a.level}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {a.roleDefinition?.commonSkills?.slice(0, 3).map(s => (
            <span key={s} className="text-[7px] bg-purple-950/40 border border-purple-800/40 text-purple-400 rounded px-1.5 py-0.5">{s}</span>
          ))}
        </div>
      </div>
    );
  }

  if (node.kind === 'employee') {
    const e = node.data;
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{e.avatar}</span>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 leading-tight">{e.name}</h3>
            <p className="text-[8px] text-amber-400 font-mono">{e.designation}</p>
          </div>
        </div>
        <div className="space-y-1.5 text-[9px] text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
          <div className="flex justify-between">
            <span className="text-zinc-600">Dept</span>
            <span>{e.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Status</span>
            <span className={e.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'}>{e.status}</span>
          </div>
          {e.salary > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-600">Salary</span>
              <span className="text-emerald-400">₹{e.salary.toLocaleString('en-IN')}</span>
            </div>
          )}
          {e.reportsToName && (
            <div className="flex justify-between">
              <span className="text-zinc-600">Manager</span>
              <span className="truncate max-w-[100px]">{e.reportsToName}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export const OrgTree: React.FC = () => {
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const agents = useAppSelector(state => state.agents.items);
  const employees = useAppSelector(state => state.crm.employees);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>({ kind: 'root' });

  // Filter out HQ
  const activeSubs = useMemo(() => subsidiaries.filter(s => s.id !== 'common'), [subsidiaries]);
  const commonSub = useMemo(() => subsidiaries.find(s => s.id === 'common'), [subsidiaries]);

  // Group employee data
  const subTreeData = useMemo(() => {
    return activeSubs.map(sub => {
      // Find agents in this subsidiary
      const subAgents = agents.filter(a => a.subsidiaryId === sub.id);
      
      // Find human employees in this subsidiary
      const subEmps = employees.filter(e => e.subsidiaryId === sub.id);
      
      // Group employees by department
      const depts: Record<string, Employee[]> = {};
      subEmps.forEach(e => {
        if (!depts[e.department]) depts[e.department] = [];
        depts[e.department].push(e);
      });

      return {
        subsidiary: sub,
        agents: subAgents,
        departments: depts
      };
    });
  }, [activeSubs, agents, employees]);

  const selectNode = (node: OrgNode) => {
    setSelectedNode(JSON.stringify(node) === JSON.stringify(selectedNode) ? null : node);
  };

  const isSelected = (node: OrgNode) => JSON.stringify(node) === JSON.stringify(selectedNode);

  const ConnectionArrow = () => (
    <div className="flex flex-col items-center select-none py-1">
      <div className="w-px h-4 bg-zinc-800" />
      <ArrowDown size={10} className="text-zinc-700" />
      <div className="w-px h-1.5 bg-zinc-800" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20">
          <GitBranch size={15} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-100">Organization Hierarchy</h2>
          <p className="text-[10px] text-zinc-500">Reversed (Bottom-Up) structure. Click nodes to view information.</p>
        </div>
      </div>

      <div className="flex gap-4 min-h-[500px]">
        {/* Visual Inverted Tree canvas */}
        <div className="flex-1 bg-zinc-900/20 border border-zinc-900 rounded-xl overflow-x-auto overflow-y-auto max-h-[75vh] custom-scrollbar p-6">
          <div className="flex flex-col items-center gap-1 min-w-[900px] select-none">
            
            {/* LAYER 1: Leaves (Employees / Agents) at the very top */}
            <div className="flex justify-around items-start w-full gap-8">
              {subTreeData.map(({ subsidiary, agents, departments }) => (
                <div key={subsidiary.id} className="flex gap-6 justify-center">
                  
                  {/* Subsidiary Agents Section */}
                  {agents.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5 border border-dashed border-zinc-800/40 p-2 rounded-xl bg-zinc-950/10">
                      <span className="text-[8px] text-purple-400/70 font-mono tracking-wider uppercase font-semibold">AI SQUAD</span>
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px]">
                        {agents.map(a => (
                          <NodeCard key={a.id} node={{ kind: 'agent', data: a }} isSelected={isSelected({ kind: 'agent', data: a })} onClick={() => selectNode({ kind: 'agent', data: a })} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subsidiary Departments */}
                  {Object.entries(departments).map(([deptName, emps]) => (
                    <div key={deptName} className="flex flex-col items-center gap-1.5 border border-zinc-900/60 p-2 rounded-xl bg-zinc-950/5">
                      <span className="text-[8px] text-amber-500/60 font-mono tracking-wider uppercase font-semibold">{deptName}</span>
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px]">
                        {emps.map(e => (
                          <NodeCard key={e.id} node={{ kind: 'employee', data: e }} isSelected={isSelected({ kind: 'employee', data: e })} onClick={() => selectNode({ kind: 'employee', data: e })} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Connecting lines Layer 1 -> Layer 2 */}
            <div className="w-11/12 border-b border-zinc-800/60 mt-2" />
            <ConnectionArrow />

            {/* LAYER 2: Departments & Agent groups */}
            <div className="flex justify-around items-start w-full gap-8">
              {subTreeData.map(({ subsidiary, agents, departments }) => (
                <div key={subsidiary.id} className="flex gap-10 justify-center">
                  {/* AI Agents Department node */}
                  {agents.length > 0 && (
                    <NodeCard node={{ kind: 'dept', name: 'Operations', subsidiaryId: subsidiary.id }} isSelected={isSelected({ kind: 'dept', name: 'Operations', subsidiaryId: subsidiary.id })} onClick={() => selectNode({ kind: 'dept', name: 'Operations', subsidiaryId: subsidiary.id })} />
                  )}

                  {/* Human department nodes */}
                  {Object.keys(departments).map(deptName => (
                    <NodeCard key={deptName} node={{ kind: 'dept', name: deptName, subsidiaryId: subsidiary.id }} isSelected={isSelected({ kind: 'dept', name: deptName, subsidiaryId: subsidiary.id })} onClick={() => selectNode({ kind: 'dept', name: deptName, subsidiaryId: subsidiary.id })} />
                  ))}
                </div>
              ))}
            </div>

            {/* Connecting lines Layer 2 -> Layer 3 */}
            <div className="w-10/12 border-b border-zinc-800/60 mt-2" />
            <ConnectionArrow />

            {/* LAYER 3: Subsidiaries */}
            <div className="flex justify-center items-start w-full gap-24">
              {subTreeData.map(({ subsidiary }) => (
                <div key={subsidiary.id} className="flex flex-col items-center">
                  <NodeCard node={{ kind: 'subsidiary', data: subsidiary }} isSelected={isSelected({ kind: 'subsidiary', data: subsidiary })} onClick={() => selectNode({ kind: 'subsidiary', data: subsidiary })} />
                </div>
              ))}
              {commonSub && (
                <div className="flex flex-col items-center">
                  <NodeCard node={{ kind: 'subsidiary', data: commonSub }} isSelected={isSelected({ kind: 'subsidiary', data: commonSub })} onClick={() => selectNode({ kind: 'subsidiary', data: commonSub })} />
                </div>
              )}
            </div>

            {/* Connecting lines Layer 3 -> Layer 4 (Root HQ) */}
            <div className="w-8/12 border-b border-zinc-800/60 mt-2" />
            <ConnectionArrow />

            {/* LAYER 4: AstraCore Root HQ at the bottom */}
            <div className="flex flex-col items-center">
              <NodeCard node={{ kind: 'root' }} isSelected={isSelected({ kind: 'root' })} onClick={() => selectNode({ kind: 'root' })} />
            </div>

          </div>
        </div>

        {/* Right side Detail Panel */}
        <div className="w-64 shrink-0 bg-zinc-900/20 border border-zinc-900 rounded-xl overflow-y-auto">
          <DetailPanel node={selectedNode} agents={agents} employees={employees} subsidiaries={subsidiaries} />
        </div>
      </div>
    </div>
  );
};
