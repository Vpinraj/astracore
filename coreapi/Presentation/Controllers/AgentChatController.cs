using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using coreapi.Application.Services;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly GroupChatService _groupChatService;

    public ChatController(GroupChatService groupChatService)
    {
        _groupChatService = groupChatService;
    }

    [HttpPost]
    public async Task<ActionResult<ChatResult>> ChatWithAgent([FromBody] ChatRequestDto req)
    {
        if (req == null || (string.IsNullOrWhiteSpace(req.Message) && req.Attachments.Count == 0))
        {
            return BadRequest("Message and attachments cannot both be empty");
        }
        
        var resultMessages = await _groupChatService.RunHierarchicalChatAsync(req.AgentId, req.Message, req.History, req.Attachments);
        
        return Ok(new ChatResult
        {
            Messages = resultMessages
        });
    }
}

public class ChatRequestDto
{
    public string AgentId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<ChatMessageDto> History { get; set; } = new();
    public List<AttachmentDto> Attachments { get; set; } = new();
}

public class AttachmentDto
{
    public string Name { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class ChatMessageDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class ChatResult
{
    public List<ResultMessageDto> Messages { get; set; } = new();
}

public class ResultMessageDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
}
