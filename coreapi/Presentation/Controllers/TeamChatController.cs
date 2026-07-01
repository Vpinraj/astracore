using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/teamchat")]
public class TeamChatController : ControllerBase
{
    private readonly ITeamChatManagerService _teamChatManagerService;

    public TeamChatController(ITeamChatManagerService teamChatManagerService)
    {
        _teamChatManagerService = teamChatManagerService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GroupChat>>> GetChats()
    {
        var chats = await _teamChatManagerService.GetAllChatsAsync();
        return Ok(chats);
    }

    [HttpPost]
    public async Task<ActionResult<GroupChat>> CreateChat([FromBody] CreateChatRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest("Name is required");
        }

        var chat = await _teamChatManagerService.CreateGroupChatAsync(req.Name, req.ParticipantIds);
        return Ok(chat);
    }

    [HttpGet("{chatId}/messages")]
    public async Task<ActionResult<IEnumerable<GroupChatMessage>>> GetMessages(string chatId)
    {
        var messages = await _teamChatManagerService.GetMessagesAsync(chatId);
        return Ok(messages);
    }

    [HttpDelete("{chatId}")]
    public async Task<ActionResult> DeleteChat(string chatId)
    {
        await _teamChatManagerService.DeleteGroupChatAsync(chatId);
        return Ok();
    }

    [HttpPost("{chatId}/messages")]
    public async Task<ActionResult<GroupChatMessage>> SendMessage(string chatId, [FromBody] SendMessageRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Content) || string.IsNullOrWhiteSpace(req.SenderId))
        {
            return BadRequest("Content and SenderId are required");
        }

        var message = await _teamChatManagerService.SendMessageAsync(chatId, req.SenderId, req.SenderName, req.SenderType, req.Content);
        return Ok(message);
    }
}

public class CreateChatRequest
{
    public string Name { get; set; } = string.Empty;
    public List<string> ParticipantIds { get; set; } = new();
}

public class SendMessageRequest
{
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderType { get; set; } = "user";
    public string Content { get; set; } = string.Empty;
}
