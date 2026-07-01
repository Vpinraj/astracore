using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Exceptions;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class SubsidiaryService : ISubsidiaryService
{
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly ILogService _logService;
    private readonly ITransactionService _transactionService;

    private static readonly List<(string Color, string Border, string Text)> COLORS = new()
    {
        ("from-purple-600 to-indigo-600", "border-purple-500/30", "text-purple-400"),
        ("from-blue-600 to-cyan-600", "border-blue-500/30", "text-blue-400"),
        ("from-emerald-600 to-teal-600", "border-emerald-500/30", "text-emerald-400"),
        ("from-amber-500 to-orange-600", "border-amber-500/30", "text-amber-400"),
        ("from-rose-600 to-pink-600", "border-rose-500/30", "text-rose-400")
    };

    private static readonly List<string> ICONS = new()
    {
        "Cpu", "Palette", "DollarSign", "Shield", "Database", "Activity"
    };

    public SubsidiaryService(
        IRepository<Subsidiary> subsidiaryRepository, 
        ILogService logService,
        ITransactionService transactionService)
    {
        _subsidiaryRepository = subsidiaryRepository;
        _logService = logService;
        _transactionService = transactionService;
    }

    public async Task<Subsidiary> CreateSubsidiaryAsync(string name, string industry, double investment, string? colorTheme = null, string? logoUrl = null, string? website = null, string? email = null, string? phone = null, string? description = null, string? address = null, string? bankDetails = null)
    {
        var random = new Random();
        var index = random.Next(COLORS.Count);
        var chosenColor = COLORS[index];

        if (!string.IsNullOrEmpty(colorTheme))
        {
            var match = COLORS.FirstOrDefault(c => c.Color.Contains(colorTheme));
            if (match.Color != null)
            {
                chosenColor = match;
            }
        }

        var randomIcon = ICONS[random.Next(ICONS.Count)];

        var subsidiary = new Subsidiary
        {
            Id = $"sub-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Name = name,
            Industry = industry,
            Investment = 0,
            Balance = 0,
            Expenses = 0,
            Profits = 0,
            Color = chosenColor.Color,
            BorderColor = chosenColor.Border,
            TextColor = chosenColor.Text,
            Icon = randomIcon,
            LogoUrl = logoUrl ?? string.Empty,
            Website = website ?? string.Empty,
            Email = email ?? string.Empty,
            Phone = phone ?? string.Empty,
            Description = description ?? string.Empty,
            Address = address ?? string.Empty,
            BankDetails = bankDetails ?? string.Empty,
            Procurements = 0,
            Sales = 0
        };

        await _subsidiaryRepository.SaveAsync(subsidiary);

        if (investment > 0)
        {
            await _transactionService.RecordTransactionAsync(
                subsidiaryId: subsidiary.Id,
                type: "Investment",
                subtotal: investment,
                discount: 0,
                cgst: 0,
                sgst: 0,
                totalAmount: investment,
                amountPaidOrReceived: investment,
                description: "Initial seed investment funding",
                referenceNumber: $"INV-SEED-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 100000}",
                partnerName: "Parent Enterprise"
            );
        }
        else
        {
            await _logService.AddLogAsync(
                $"Subsidiary \"{name}\" created in the {industry} industry with zero initial funding.",
                "info",
                subsidiaryName: name
            );
        }

        return subsidiary;
    }

    public async Task<Subsidiary> UpdateSubsidiaryAsync(string id, string name, string industry, string? colorTheme = null, string? logoUrl = null, string? website = null, string? email = null, string? phone = null, string? description = null, string? address = null, string? bankDetails = null)
    {
        var subsidiary = await _subsidiaryRepository.GetByIdAsync(id);
        if (subsidiary == null)
        {
            throw new EntityNotFoundException(nameof(Subsidiary), id);
        }

        subsidiary.Name = name;
        subsidiary.Industry = industry;
        
        if (!string.IsNullOrEmpty(colorTheme))
        {
            var match = COLORS.FirstOrDefault(c => c.Color.Contains(colorTheme));
            if (match.Color != null)
            {
                subsidiary.Color = match.Color;
                subsidiary.BorderColor = match.Border;
                subsidiary.TextColor = match.Text;
            }
        }

        subsidiary.LogoUrl = logoUrl ?? subsidiary.LogoUrl;
        subsidiary.Website = website ?? subsidiary.Website;
        subsidiary.Email = email ?? subsidiary.Email;
        subsidiary.Phone = phone ?? subsidiary.Phone;
        subsidiary.Description = description ?? subsidiary.Description;
        subsidiary.Address = address ?? subsidiary.Address;
        subsidiary.BankDetails = bankDetails ?? subsidiary.BankDetails;

        await _subsidiaryRepository.SaveAsync(subsidiary);
        return subsidiary;
    }

    public async Task AllocateFundsAsync(string subsidiaryId, double amount)
    {
        var subsidiary = await _subsidiaryRepository.GetByIdAsync(subsidiaryId);
        if (subsidiary == null)
        {
            throw new EntityNotFoundException(nameof(Subsidiary), subsidiaryId);
        }

        await _transactionService.RecordTransactionAsync(
            subsidiaryId: subsidiaryId,
            type: "Investment",
            subtotal: amount,
            discount: 0,
            cgst: 0,
            sgst: 0,
            totalAmount: amount,
            amountPaidOrReceived: amount,
            description: "Capital funding allocation",
            referenceNumber: $"INV-ALLOC-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 100000}",
            partnerName: "Parent Enterprise"
        );
    }

    public Task<IEnumerable<Subsidiary>> GetAllAsync() => _subsidiaryRepository.GetAllAsync();
    public Task<Subsidiary?> GetByIdAsync(string id) => _subsidiaryRepository.GetByIdAsync(id);
    public Task SaveAsync(Subsidiary subsidiary) => _subsidiaryRepository.SaveAsync(subsidiary);
    public Task DeleteAsync(string id) => _subsidiaryRepository.DeleteAsync(id);
}
