using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface ISubsidiaryService
{
    Task<Subsidiary> CreateSubsidiaryAsync(string name, string industry, double investment, string? colorTheme = null, string? logoUrl = null, string? website = null, string? email = null, string? phone = null, string? description = null, string? address = null, string? bankDetails = null);
    Task AllocateFundsAsync(string subsidiaryId, double amount);
    Task<IEnumerable<Subsidiary>> GetAllAsync();
    Task<Subsidiary?> GetByIdAsync(string id);
    Task SaveAsync(Subsidiary subsidiary);
    Task DeleteAsync(string id);
}
