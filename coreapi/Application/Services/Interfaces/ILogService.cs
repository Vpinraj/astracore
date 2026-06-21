using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface ILogService
{
    Task AddLogAsync(string message, string type, string? subsidiaryName = null, string? agentName = null);
    Task<IEnumerable<ActivityLog>> GetAllAsync();
    Task SaveAsync(ActivityLog log);
    Task DeleteAsync(string id);
    Task ClearAllAsync();
}
