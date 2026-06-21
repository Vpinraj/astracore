using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface ILeadService
{
    Task<Lead> CreateLeadAsync(
        string subsidiaryId,
        string contactName,
        string companyName,
        string email = "",
        string phone = "",
        string source = "Inbound",
        string stage = "New",
        double estimatedValue = 0,
        string assignedToId = "",
        string assignedToName = "",
        string notes = ""
    );
    Task<Lead?> UpdateLeadStageAsync(string leadId, string stage, string followUpNote = "", string createdBy = "System");
    Task<IEnumerable<Lead>> GetAllAsync();
    Task DeleteAsync(string leadId);
    Task ClearAllAsync();
}
