using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/simulation")]
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TaskController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpPost("task")]
    public async Task<ActionResult<TaskItem>> CreateTask([FromBody] CreateTaskRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Title))
        {
            return BadRequest("Invalid task attributes");
        }
        var task = await _taskService.CreateTaskAsync(req.Title, req.Description, req.SubsidiaryId, req.AssignedAgentId ?? string.Empty, req.Payout, req.Cost);
        return Ok(task);
    }

    [HttpPost("task/assign")]
    public async Task<IActionResult> AssignAgent([FromBody] AssignAgentRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.TaskId) || string.IsNullOrWhiteSpace(req.AgentId))
        {
            return BadRequest("Invalid task or agent references");
        }
        await _taskService.AssignAgentAsync(req.TaskId, req.AgentId);
        return Ok(new { success = true });
    }

    [HttpPost("start-task")]
    public async Task<IActionResult> StartTask([FromBody] StartTaskRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.TaskId))
        {
            return BadRequest("Invalid task reference");
        }
        await _taskService.StartTaskAsync(req.TaskId);
        return Ok(new { success = true });
    }
}
