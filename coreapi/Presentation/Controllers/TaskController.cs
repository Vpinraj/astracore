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
        var task = await _taskService.CreateTaskAsync(req.Title, req.Description, req.SubsidiaryId, req.AssignedAgentId ?? string.Empty, req.AttachedFileName ?? string.Empty, req.AttachedFileData ?? string.Empty);
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

    [HttpPost("task/{taskId}/answer")]
    public async Task<IActionResult> AnswerTaskQuestion(string taskId, [FromBody] AnswerTaskRequest req)
    {
        if (string.IsNullOrWhiteSpace(taskId) || req == null || string.IsNullOrWhiteSpace(req.Answer))
        {
            return BadRequest("Invalid answer request");
        }
        
        await _taskService.ResumeTaskAsync(taskId, req.Answer);
        return Ok(new { success = true });
    }

    [HttpDelete("task/{taskId}")]
    public async Task<IActionResult> DeleteTask(string taskId)
    {
        if (string.IsNullOrWhiteSpace(taskId))
        {
            return BadRequest("Invalid task reference");
        }
        await _taskService.DeleteAsync(taskId);
        return Ok(new { success = true });
    }
}

public class AnswerTaskRequest
{
    public string Answer { get; set; } = string.Empty;
}
