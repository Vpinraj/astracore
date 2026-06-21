using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class LogService : ILogService
{
    private readonly IRepository<ActivityLog> _logRepository;

    public LogService(IRepository<ActivityLog> logRepository)
    {
        _logRepository = logRepository;
    }

    public async Task AddLogAsync(string message, string type, string? subsidiaryName = null, string? agentName = null)
    {
        var log = new ActivityLog
        {
            Id = $"log-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString().Substring(0, 5)}",
            Timestamp = DateTime.Now.ToLongTimeString(), // or ToShortTimeString
            Message = message,
            Type = type,
            SubsidiaryName = subsidiaryName,
            AgentName = agentName
        };

        await _logRepository.SaveAsync(log);

        // Keep last 100 logs
        var allLogs = (await _logRepository.GetAllAsync())
            .OrderByDescending(l => l.Id)
            .ToList();

        if (allLogs.Count > 100)
        {
            var logsToRemove = allLogs.Skip(100);
            foreach (var oldLog in logsToRemove)
            {
                await _logRepository.DeleteAsync(oldLog.Id);
            }
        }
    }

    public Task<IEnumerable<ActivityLog>> GetAllAsync() => _logRepository.GetAllAsync();
    public Task SaveAsync(ActivityLog log) => _logRepository.SaveAsync(log);
    public Task DeleteAsync(string id) => _logRepository.DeleteAsync(id);

    public async Task ClearAllAsync()
    {
        var allLogs = await _logRepository.GetAllAsync();
        foreach (var log in allLogs)
        {
            await _logRepository.DeleteAsync(log.Id);
        }
    }
}
