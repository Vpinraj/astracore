using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

/// <summary>
/// Manages per-agent heartbeat configuration and execution log persistence.
/// The actual scheduling is handled by <c>AgentHeartbeatWorker</c> (BackgroundService).
/// </summary>
public interface IHeartbeatService
{
    // ── Configuration ──────────────────────────────────────────────────────────

    /// <summary>Updates the heartbeat configuration for an agent and (re)schedules the next pulse.</summary>
    Task<Agent?> ConfigureAsync(
        string agentId,
        bool enabled,
        int intervalMinutes,
        string instruction,
        CancellationToken ct = default);

    // ── Execution (called by AgentHeartbeatWorker) ─────────────────────────────

    /// <summary>
    /// Runs the LLM heartbeat pulse for the agent and persists the result.
    /// </summary>
    Task<HeartbeatLog> ExecutePulseAsync(Agent agent, CancellationToken ct = default);

    // ── Logs ───────────────────────────────────────────────────────────────────

    Task<IEnumerable<HeartbeatLog>> GetLogsAsync(string agentId, int limit = 20, CancellationToken ct = default);
    Task ClearLogsAsync(string agentId, CancellationToken ct = default);
}
