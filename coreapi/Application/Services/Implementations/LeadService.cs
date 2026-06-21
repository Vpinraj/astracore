using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class LeadService : ILeadService
{
    private readonly IRepository<Lead> _leadRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;

    public LeadService(
        IRepository<Lead> leadRepository,
        IRepository<Subsidiary> subsidiaryRepository)
    {
        _leadRepository = leadRepository;
        _subsidiaryRepository = subsidiaryRepository;
    }

    public async Task<Lead> CreateLeadAsync(
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
        string notes = "")
    {
        // Resolve subsidiary name
        var sub = await _subsidiaryRepository.GetByIdAsync(subsidiaryId);
        string subName = sub?.Name ?? subsidiaryId;

        string timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var lead = new Lead
        {
            Id = $"lead-{timestamp}-{new Random().Next(1000, 9999)}",
            SubsidiaryId = subsidiaryId,
            SubsidiaryName = subName,
            ContactName = contactName,
            CompanyName = companyName,
            Email = email,
            Phone = phone,
            Source = source,
            Stage = stage,
            EstimatedValue = estimatedValue,
            AssignedToId = assignedToId,
            AssignedToName = assignedToName,
            Notes = notes,
            FollowUps = new List<LeadFollowUp>(),
            CreatedAt = DateTimeOffset.UtcNow.ToString("o"),
            UpdatedAt = DateTimeOffset.UtcNow.ToString("o")
        };

        // Add initial follow-up if notes provided
        if (!string.IsNullOrWhiteSpace(notes))
        {
            lead.FollowUps.Add(new LeadFollowUp
            {
                Date = DateTimeOffset.UtcNow.ToString("o"),
                Note = notes,
                CreatedBy = string.IsNullOrWhiteSpace(assignedToName) ? "System" : assignedToName
            });
        }

        await _leadRepository.SaveAsync(lead);
        return lead;
    }

    public async Task<Lead?> UpdateLeadStageAsync(string leadId, string stage, string followUpNote = "", string createdBy = "System")
    {
        var lead = await _leadRepository.GetByIdAsync(leadId);
        if (lead == null) return null;

        lead.Stage = stage;
        lead.UpdatedAt = DateTimeOffset.UtcNow.ToString("o");

        if (!string.IsNullOrWhiteSpace(followUpNote))
        {
            lead.FollowUps.Add(new LeadFollowUp
            {
                Date = DateTimeOffset.UtcNow.ToString("o"),
                Note = $"[{stage}] {followUpNote}",
                CreatedBy = createdBy
            });
        }
        else
        {
            lead.FollowUps.Add(new LeadFollowUp
            {
                Date = DateTimeOffset.UtcNow.ToString("o"),
                Note = $"Stage updated to \"{stage}\"",
                CreatedBy = createdBy
            });
        }

        await _leadRepository.SaveAsync(lead);
        return lead;
    }

    public async Task<IEnumerable<Lead>> GetAllAsync()
    {
        return (await _leadRepository.GetAllAsync())
            .OrderByDescending(l => l.CreatedAt);
    }

    public async Task DeleteAsync(string leadId)
    {
        await _leadRepository.DeleteAsync(leadId);
    }

    public async Task ClearAllAsync()
    {
        var all = await _leadRepository.GetAllAsync();
        foreach (var lead in all)
            await _leadRepository.DeleteAsync(lead.Id);
    }
}
