using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.DTOs;

namespace CoreApi.Application.Services.Interfaces;

public interface IAgentService
{
    Task<Agent> HireAgentAsync(string name, string role, string subsidiaryId, string? instructions = null, string? modelId = null, AgentRoleDefinition? customOverrides = null);
    Task<IEnumerable<Agent>> GetAllAsync();
    Task<Agent?> GetByIdAsync(string id);
    Task SaveAsync(Agent agent);
    Task DeleteAsync(string id);

    /// <summary>Patch mutable fields on an existing agent. Returns null if not found.</summary>
    Task<Agent?> UpdateAgentAsync(string id, UpdateAgentRequest req, CancellationToken ct = default);

    /// <summary>Backfill HeartbeatInstruction for any agent whose instruction is currently empty, using the role-default from the blueprint.</summary>
    Task SeedHeartbeatInstructionsAsync(CancellationToken ct = default);

    Task<IEnumerable<ExecutionLogDto>> GetExecutionLogsAsync(int limit = 1000, double? hours = null);
}
