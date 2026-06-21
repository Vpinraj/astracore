using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface IAgentService
{
    Task<Agent> HireAgentAsync(string name, string role, string subsidiaryId, string? instructions = null, string? modelId = null, AgentRoleDefinition? customOverrides = null, double deductionFee = 0);
    Task<IEnumerable<Agent>> GetAllAsync();
    Task<Agent?> GetByIdAsync(string id);
    Task SaveAsync(Agent agent);
    Task DeleteAsync(string id);
}
