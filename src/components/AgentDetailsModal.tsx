import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Agent, AgentOutputFormat, AgentMemoryType, AgentTool, HeartbeatLog } from '../types';
import { getDefaultHeartbeatInstruction } from '../types';
import { api } from '../api';
import {
  Building2, Bot, Brain, Zap, Cpu, HardDrive, TerminalSquare,
  CheckCircle2, Activity, RefreshCw, Trash2, Play, Clock,
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Save, Pencil,
} from 'lucide-react';

interface AgentDetailsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  /** Optional: called after heartbeat config is saved, so parent can refresh agent list. */
  onAgentUpdate?: (updated: Agent) => void;
}

type Tab = 'blueprint' | 'heartbeat' | 'edit';

// ─────────────────────────────────────────────────────────────────────────────
// HEARTBEAT TAB
// ─────────────────────────────────────────────────────────────────────────────

interface HeartbeatTabProps {
  agent: Agent;
  onAgentUpdate?: (updated: Agent) => void;
}

const HeartbeatTab: React.FC<HeartbeatTabProps> = ({ agent, onAgentUpdate }) => {
  // ── Form state ──
  const [enabled, setEnabled] = useState(agent.heartbeatEnabled ?? false);
  const [interval, setIntervalMins] = useState(agent.heartbeatIntervalMinutes ?? 60);
  const [instruction, setInstruction] = useState(
    agent.heartbeatInstruction || getDefaultHeartbeatInstruction(agent.role)
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Logs state ──
  const [logs, setLogs] = useState<HeartbeatLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Sync form when agent changes
  useEffect(() => {
    setEnabled(agent.heartbeatEnabled ?? false);
    setIntervalMins(agent.heartbeatIntervalMinutes ?? 60);
    setInstruction(agent.heartbeatInstruction || getDefaultHeartbeatInstruction(agent.role));
  }, [agent]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await api.fetchHeartbeatLogs(agent.id, 20);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail — logs are informational
    } finally {
      setLogsLoading(false);
    }
  }, [agent.id]);

  useEffect(() => {
    if (agent) loadLogs();
  }, [agent, loadLogs]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated: Agent = await api.configureHeartbeat(agent.id, enabled, interval, instruction);
      setSaveMsg({ ok: true, text: 'Heartbeat configuration saved.' });
      onAgentUpdate?.(updated);
    } catch (err: any) {
      setSaveMsg({ ok: false, text: err.message ?? 'Save failed.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3500);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      await api.triggerHeartbeat(agent.id);
      setTriggerMsg({ ok: true, text: 'Pulse triggered! Refreshing logs…' });
      setTimeout(() => loadLogs(), 2500);
    } catch (err: any) {
      setTriggerMsg({ ok: false, text: err.message ?? 'Trigger failed.' });
    } finally {
      setTriggering(false);
      setTimeout(() => setTriggerMsg(null), 4000);
    }
  };

  const handleClearLogs = async () => {
    try {
      await api.clearHeartbeatLogs(agent.id);
      setLogs([]);
    } catch {
      /* ignore */
    }
  };

  const formatTs = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Status strip ── */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-xs">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-zinc-400">Status:</span>
          <span className={enabled ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
            {enabled ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Clock size={12} />
          <span>Last pulse:</span>
          <span className="text-zinc-300 font-mono">{formatTs(agent.lastHeartbeatAt)}</span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Activity size={12} />
          <span>Next pulse:</span>
          <span className="text-zinc-300 font-mono">{formatTs(agent.nextHeartbeatAt)}</span>
        </div>
      </div>

      {/* ── Configuration form ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Cpu size={13} /> Configuration
        </h4>
        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-300">Enable Autonomous Heartbeat</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Agent wakes up automatically and runs its heartbeat instruction.
              </p>
            </div>
            <button
              id={`hb-toggle-${agent.id}`}
              onClick={() => setEnabled(v => !v)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200
                ${enabled ? 'bg-purple-600' : 'bg-zinc-700'}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200
                  ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {/* Interval */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400" htmlFor={`hb-interval-${agent.id}`}>
              Interval — every{' '}
              <span className="text-purple-400 font-mono font-semibold">{interval}</span> minute
              {interval !== 1 ? 's' : ''}
            </label>
            <input
              id={`hb-interval-${agent.id}`}
              type="range"
              min={1}
              max={240}
              value={interval}
              onChange={e => setIntervalMins(Number(e.target.value))}
              disabled={!enabled}
              className="w-full h-1.5 rounded-full accent-purple-500 disabled:opacity-40 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
              <span>1 min</span><span>1 hr</span><span>2 hr</span><span>4 hr</span>
            </div>
          </div>

          {/* Instruction */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400" htmlFor={`hb-instruction-${agent.id}`}>
                Wake-up Instruction
              </label>
              <span className="text-[10px] text-zinc-600 font-mono">role default pre-filled</span>
            </div>
            <textarea
              id={`hb-instruction-${agent.id}`}
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              placeholder={getDefaultHeartbeatInstruction(agent.role)}
              rows={3}
              className="w-full rounded-lg border border-zinc-700/70 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600
                focus:outline-none focus:ring-1 focus:ring-purple-600/60 resize-none transition"
            />
          </div>

          {/* Save button + feedback */}
          <div className="flex items-center gap-3">
            <button
              id={`hb-save-${agent.id}`}
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold
                transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saveMsg && (
              <span className={`text-[11px] flex items-center gap-1 ${saveMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {saveMsg.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                {saveMsg.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Execution Logs ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Activity size={13} /> Execution Logs
          </h4>
          <div className="flex items-center gap-2">
            <button
              id={`hb-trigger-${agent.id}`}
              onClick={handleTrigger}
              disabled={triggering || agent.status !== 'idle'}
              title={agent.status !== 'idle' ? `Agent is ${agent.status} — can only trigger when idle` : 'Trigger pulse now'}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/20 border border-emerald-600/30 hover:bg-emerald-600/30
                text-emerald-400 text-[11px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {triggering ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
              Trigger
            </button>
            <button
              id={`hb-refresh-${agent.id}`}
              onClick={loadLogs}
              disabled={logsLoading}
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition disabled:opacity-40"
            >
              <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
            </button>
            <button
              id={`hb-clear-${agent.id}`}
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition disabled:opacity-40"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {triggerMsg && (
          <div className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg
            ${triggerMsg.ok ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/50 text-red-400 border border-red-800/40'}`}>
            {triggerMsg.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            {triggerMsg.text}
          </div>
        )}

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 divide-y divide-zinc-800/60 max-h-64 overflow-y-auto">
          {logsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-zinc-500 text-xs">
              <RefreshCw size={14} className="animate-spin" /> Loading logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-zinc-600 text-xs italic">
              No heartbeat logs yet.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="group">
                <button
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-zinc-900/50 transition"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="mt-0.5 shrink-0">
                    {log.success
                      ? <CheckCircle size={13} className="text-emerald-400" />
                      : <XCircle size={13} className="text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-zinc-500">
                      {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                    </p>
                    <p className="text-xs text-zinc-300 truncate mt-0.5">
                      {log.success
                        ? (log.response?.slice(0, 90) || '—')
                        : (log.errorMessage || 'Error')
                      }
                      {log.success && log.response?.length > 90 ? '…' : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-zinc-600 group-hover:text-zinc-400 transition">
                    {expandedLog === log.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </div>
                </button>

                {expandedLog === log.id && (
                  <div className="px-4 pb-4 space-y-2 bg-zinc-900/30">
                    {log.instruction && (
                      <div>
                        <p className="text-[10px] font-mono uppercase text-zinc-600 mb-1">Instruction</p>
                        <p className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap">{log.instruction}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-mono uppercase text-zinc-600 mb-1">
                        {log.success ? 'Response' : 'Error'}
                      </p>
                      <p className={`text-[11px] font-mono whitespace-pre-wrap ${log.success ? 'text-zinc-300' : 'text-red-400'}`}>
                        {log.success ? (log.response || '—') : (log.errorMessage || '—')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIT TAB
// ─────────────────────────────────────────────────────────────────────────────

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

const EMOJI_PRESETS = ['🤖','👨‍💻','👩‍💻','👩‍💼','👨‍💼','📣','📢','🎨','📋','🔬','🎧','⚙️','🧠','💡','🌐','🔐','📊','📈'];

interface EditTabProps {
  agent: Agent;
  onAgentUpdate?: (updated: Agent) => void;
}

const EditTab: React.FC<EditTabProps> = ({ agent, onAgentUpdate }) => {
  // ── Identity ──
  const [name, setName]                 = useState(agent.name);
  const [avatar, setAvatar]             = useState(agent.avatar);
  const [level, setLevel]               = useState(agent.level);
  const [efficiency, setEfficiency]     = useState(agent.efficiency);
  const [instructions, setInstructions] = useState(agent.instructions);
  const [modelId, setModelId]           = useState(agent.modelId);

  // ── LLM config ──
  const rd = agent.roleDefinition;
  const [temperature, setTemperature]   = useState(rd?.temperature ?? 0.5);
  const [maxTokens, setMaxTokens]       = useState(rd?.maxTokens ?? 2048);
  const [outputFormat, setOutputFormat] = useState<AgentOutputFormat>((rd?.outputFormat as AgentOutputFormat) ?? 'markdown');
  const [memoryType, setMemoryType]     = useState<AgentMemoryType>((rd?.memoryType as AgentMemoryType) ?? 'short_term');
  const [tools, setTools]               = useState<AgentTool[]>(() =>
    (rd?.tools ?? []).map(t => ({ ...t }))
  );

  // ── Heartbeat ──
  const [hbEnabled, setHbEnabled]       = useState(agent.heartbeatEnabled ?? false);
  const [hbInterval, setHbInterval]     = useState(agent.heartbeatIntervalMinutes ?? 60);
  const [hbInstruction, setHbInstruction] = useState(
    agent.heartbeatInstruction || getDefaultHeartbeatInstruction(agent.role)
  );

  // ── Save state ──
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Sync when agent changes (e.g. parent refresh)
  useEffect(() => {
    setName(agent.name);
    setAvatar(agent.avatar);
    setLevel(agent.level);
    setEfficiency(agent.efficiency);
    setInstructions(agent.instructions);
    setModelId(agent.modelId);
    const rd2 = agent.roleDefinition;
    setTemperature(rd2?.temperature ?? 0.5);
    setMaxTokens(rd2?.maxTokens ?? 2048);
    setOutputFormat((rd2?.outputFormat as AgentOutputFormat) ?? 'markdown');
    setMemoryType((rd2?.memoryType as AgentMemoryType) ?? 'short_term');
    setTools((rd2?.tools ?? []).map(t => ({ ...t })));
    setHbEnabled(agent.heartbeatEnabled ?? false);
    setHbInterval(agent.heartbeatIntervalMinutes ?? 60);
    setHbInstruction(agent.heartbeatInstruction || getDefaultHeartbeatInstruction(agent.role));
  }, [agent]);

  const toggleTool = (toolName: string) => {
    setTools(prev => prev.map(t => t.name === toolName ? { ...t, enabled: !t.enabled } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated: Agent = await api.updateAgent(agent.id, {
        name: name.trim(),
        avatar,
        level,
        efficiency,
        instructions,
        modelId,
        temperature,
        maxTokens,
        outputFormat,
        memoryType,
        tools,
        heartbeatEnabled: hbEnabled,
        heartbeatIntervalMinutes: hbInterval,
        heartbeatInstruction: hbInstruction,
      });
      setSaveMsg({ ok: true, text: 'Agent updated successfully.' });
      onAgentUpdate?.(updated);
    } catch (err: any) {
      setSaveMsg({ ok: false, text: err.message ?? 'Save failed.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const fieldClass = "w-full bg-zinc-950 border border-zinc-700/70 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-600/60 transition";
  const labelClass = "text-[10px] font-mono uppercase tracking-widest text-zinc-500";
  const sectionClass = "space-y-3 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30";

  return (
    <div className="space-y-5">

      {/* ── Identity ── */}
      <div className="space-y-2">
        <h4 className={`${labelClass} flex items-center gap-2`}><Bot size={13} /> Identity</h4>
        <div className={sectionClass}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Name</label>
              <input
                id={`edit-name-${agent.id}`}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Role</label>
              <input
                type="text"
                value={agent.role}
                readOnly
                className={`${fieldClass} opacity-50 cursor-not-allowed`}
              />
            </div>
          </div>

          {/* Avatar */}
          <div className="space-y-2">
            <label className={labelClass}>Avatar</label>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-950 border border-zinc-700">
                {avatar}
              </div>
              {EMOJI_PRESETS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`text-lg w-9 h-9 rounded-lg border transition ${
                    avatar === emoji
                      ? 'border-purple-500 bg-purple-950/30'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
              <input
                id={`edit-avatar-${agent.id}`}
                type="text"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                maxLength={2}
                placeholder="✏️"
                className="w-16 bg-zinc-950 border border-zinc-700/70 rounded-lg px-2 py-1.5 text-xs text-center text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-600/60"
              />
            </div>
          </div>

          {/* Level & Efficiency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className={labelClass}>Level</label>
                <span className="text-[10px] font-mono text-purple-400">{level}</span>
              </div>
              <input
                id={`edit-level-${agent.id}`}
                type="range" min={1} max={10} value={level}
                onChange={e => setLevel(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono"><span>1</span><span>5</span><span>10</span></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className={labelClass}>Efficiency</label>
                <span className="text-[10px] font-mono text-purple-400">{(efficiency * 100).toFixed(0)}%</span>
              </div>
              <input
                id={`edit-efficiency-${agent.id}`}
                type="range" min={10} max={150} value={Math.round(efficiency * 100)}
                onChange={e => setEfficiency(Number(e.target.value) / 100)}
                className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono"><span>10%</span><span>80%</span><span>150%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Model & System Instructions ── */}
      <div className="space-y-2">
        <h4 className={`${labelClass} flex items-center gap-2`}><Brain size={13} /> Model & Instructions</h4>
        <div className={sectionClass}>
          <div className="space-y-1.5">
            <label className={labelClass}>AI Model</label>
            <select
              id={`edit-model-${agent.id}`}
              value={modelId}
              onChange={e => setModelId(e.target.value)}
              className={fieldClass}
            >
              {AI_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.provider} — {m.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>System Instructions</label>
            <textarea
              id={`edit-instructions-${agent.id}`}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={4}
              className={`${fieldClass} resize-none font-mono leading-relaxed`}
            />
          </div>
        </div>
      </div>

      {/* ── LLM Config ── */}
      <div className="space-y-2">
        <h4 className={`${labelClass} flex items-center gap-2`}><Cpu size={13} /> LLM Configuration</h4>
        <div className={sectionClass}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className={labelClass}>Temperature</label>
                <span className="text-[10px] font-mono text-purple-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                id={`edit-temp-${agent.id}`}
                type="range" min={0} max={1} step={0.05} value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono"><span>Precise</span><span>Creative</span></div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Max Tokens</label>
              <input
                id={`edit-maxtokens-${agent.id}`}
                type="number" min={1} value={maxTokens}
                onChange={e => setMaxTokens(Math.max(1, parseInt(e.target.value) || 1))}
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Output Format</label>
              <select
                id={`edit-format-${agent.id}`}
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value as AgentOutputFormat)}
                className={fieldClass}
              >
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="code">Code</option>
                <option value="plain">Plain</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Memory Retention</label>
            <select
              id={`edit-memory-${agent.id}`}
              value={memoryType}
              onChange={e => setMemoryType(e.target.value as AgentMemoryType)}
              className={fieldClass}
            >
              <option value="none">None (No Context Window)</option>
              <option value="short_term">Short-Term (Windowed Chat History)</option>
              <option value="long_term">Long-Term (Vector Store / RAG Summary)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Tools ── */}
      {tools.length > 0 && (
        <div className="space-y-2">
          <h4 className={`${labelClass} flex items-center gap-2`}><CheckCircle2 size={13} /> Capability Tools</h4>
          <div className={sectionClass}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tools.map(tool => (
                <div
                  key={tool.name}
                  onClick={() => toggleTool(tool.name)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                    tool.enabled
                      ? 'border-purple-500/30 bg-purple-950/10 text-purple-300'
                      : 'border-zinc-800 bg-zinc-900/20 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <input type="checkbox" checked={tool.enabled} readOnly
                    className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono font-bold">{tool.name}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Heartbeat (quick-edit) ── */}
      <div className="space-y-2">
        <h4 className={`${labelClass} flex items-center gap-2`}><Activity size={13} /> Heartbeat</h4>
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-300">Autonomous Heartbeat</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Wake agent automatically on a schedule.</p>
            </div>
            <button
              id={`edit-hb-toggle-${agent.id}`}
              onClick={() => setHbEnabled(v => !v)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${hbEnabled ? 'bg-purple-600' : 'bg-zinc-700'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${hbEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className={labelClass}>Interval</label>
              <span className="text-[10px] font-mono text-purple-400">{hbInterval} min</span>
            </div>
            <input
              id={`edit-hb-interval-${agent.id}`}
              type="range" min={1} max={240} value={hbInterval}
              onChange={e => setHbInterval(Number(e.target.value))}
              disabled={!hbEnabled}
              className="w-full h-1.5 rounded-full accent-purple-500 disabled:opacity-40 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Wake-up Instruction</label>
            <textarea
              id={`edit-hb-instruction-${agent.id}`}
              value={hbInstruction}
              onChange={e => setHbInstruction(e.target.value)}
              rows={3}
              className={`${fieldClass} resize-none font-mono`}
            />
          </div>
        </div>
      </div>

      {/* ── Save ── */}
      <div className="flex items-center gap-3 pt-1 pb-2">
        <button
          id={`edit-save-${agent.id}`}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold
            transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saveMsg && (
          <span className={`text-[11px] flex items-center gap-1.5 ${saveMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {saveMsg.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            {saveMsg.text}
          </span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  agent,
  isOpen,
  onClose,
  onAgentUpdate,
}) => {
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const [activeTab, setActiveTab] = useState<Tab>('blueprint');

  // Reset tab whenever a different agent is opened
  useEffect(() => {
    if (isOpen) setActiveTab('blueprint');
  }, [agent?.id, isOpen]);

  if (!agent) return null;

  const subsidiaryName =
    subsidiaries.find(s => s.id === agent.subsidiaryId)?.name || 'Unknown Subsidiary';

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'blueprint', label: 'Blueprint', icon: <Bot size={13} /> },
    { id: 'heartbeat', label: 'Heartbeat', icon: <Activity size={13} /> },
    { id: 'edit',      label: 'Edit',      icon: <Pencil size={13} /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agent Details" size="lg">
      <div className="space-y-4 pr-1">
        {/* ── Header ── */}
        <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
          <div className="text-4xl w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 shadow-inner">
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-zinc-100 truncate">{agent.name}</h3>
              <Badge variant={agent.status as any}>{agent.status}</Badge>
            </div>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">{agent.id}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge variant="role" className="px-2 py-0.5">{agent.role}</Badge>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Building2 size={14} className="text-zinc-500" />
                {subsidiaryName}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}-${agent.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-zinc-700 text-zinc-100 shadow'
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'heartbeat' && agent.heartbeatEnabled && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="max-h-[60vh] overflow-y-auto text-sm text-zinc-300">
          {activeTab === 'blueprint' ? (
            <div className="space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <Zap size={14} /> <span className="text-[10px] font-mono uppercase">Level</span>
                  </div>
                  <p className="text-lg font-semibold text-zinc-200">{agent.level}</p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <Brain size={14} /> <span className="text-[10px] font-mono uppercase">Efficiency</span>
                  </div>
                  <p className="text-lg font-semibold text-zinc-200">{(agent.efficiency * 100).toFixed(0)}%</p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <Bot size={14} /> <span className="text-[10px] font-mono uppercase">AI Model</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-200 mt-1 truncate" title={agent.modelId}>{agent.modelId}</p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                    <HardDrive size={14} /> <span className="text-[10px] font-mono uppercase">Memory</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-200 mt-1 capitalize">
                    {agent.roleDefinition.memoryType.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* System Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <TerminalSquare size={14} /> System Instructions
                </h4>
                <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {agent.instructions || 'No custom instructions provided. Using default blueprint prompt.'}
                </div>
              </div>

              {/* Runtime Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Cpu size={14} /> LLM Configuration
                  </h4>
                  <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Temperature</span>
                      <span className="font-mono text-purple-400">{agent.roleDefinition.temperature}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Max Tokens</span>
                      <span className="font-mono text-purple-400">{agent.roleDefinition.maxTokens}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Output Format</span>
                      <span className="font-mono text-purple-400 capitalize">{agent.roleDefinition.outputFormat}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Enabled Tools
                  </h4>
                  <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 space-y-1.5 h-[90px] overflow-y-auto">
                    {agent.roleDefinition.tools.filter(t => t.enabled).length > 0 ? (
                      agent.roleDefinition.tools.filter(t => t.enabled).map(tool => (
                        <div key={tool.name} className="flex justify-between items-center text-xs">
                          <span className="font-mono text-zinc-300">{tool.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-500 italic mt-1">No execution tools enabled</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Heartbeat instruction preview */}
              {agent.heartbeatInstruction && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Activity size={14} /> Heartbeat Instruction
                  </h4>
                  <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-400 leading-relaxed">
                    {agent.heartbeatInstruction}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Core Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.roleDefinition.commonSkills.map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'heartbeat' ? (
            <HeartbeatTab agent={agent} onAgentUpdate={onAgentUpdate} />
          ) : (
            <EditTab agent={agent} onAgentUpdate={onAgentUpdate} />
          )}
        </div>
      </div>
    </Modal>
  );
};
