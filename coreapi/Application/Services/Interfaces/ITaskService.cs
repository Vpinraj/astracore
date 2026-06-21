using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface ITaskService
{
    Task<TaskItem> CreateTaskAsync(string title, string description, string subsidiaryId, string assignedAgentId, double payout, double cost);
    Task StartTaskAsync(string taskId);
    Task AssignAgentAsync(string taskId, string agentId);
    Task<IEnumerable<TaskItem>> GetAllAsync();
    Task<TaskItem?> GetByIdAsync(string id);
    Task SaveAsync(TaskItem task);
    Task DeleteAsync(string id);
}
