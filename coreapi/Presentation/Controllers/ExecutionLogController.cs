using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/execution-logs")]
public class ExecutionLogController : ControllerBase
{
    private readonly IAgentService _agentService;

    public ExecutionLogController(IAgentService agentService)
    {
        _agentService = agentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExecutionLogDto>>> GetLogs([FromQuery] int limit = 1000, [FromQuery] double? hours = null)
    {
        var logs = await _agentService.GetExecutionLogsAsync(limit, hours);
        return Ok(logs);
    }
}
