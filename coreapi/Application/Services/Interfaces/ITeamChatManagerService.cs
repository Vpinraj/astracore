using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface ITeamChatManagerService
{
    Task<GroupChat> CreateGroupChatAsync(string name, List<string> participantIds);
    Task<IEnumerable<GroupChat>> GetAllChatsAsync();
    Task<GroupChat?> GetChatByIdAsync(string id);
    Task<IEnumerable<GroupChatMessage>> GetMessagesAsync(string chatId);
    Task<GroupChatMessage> SendMessageAsync(string chatId, string senderId, string senderName, string senderType, string content);
    Task DeleteGroupChatAsync(string id);
}
