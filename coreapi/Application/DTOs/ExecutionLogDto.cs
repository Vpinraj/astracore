using System;

namespace CoreApi.Application.DTOs;

public class ExecutionLogDto
{
    public string Id { get; set; } = string.Empty;
    public string AgentId { get; set; } = string.Empty;
    public string AgentName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "Chat", "Task", "Heartbeat"
    public string Timestamp { get; set; } = string.Empty;
    public string Input { get; set; } = string.Empty;
    public string Output { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
