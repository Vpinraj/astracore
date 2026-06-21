using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class TransactionService : ITransactionService
{
    private readonly IRepository<Transaction> _transactionRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly ILogService _logService;

    public TransactionService(
        IRepository<Transaction> transactionRepository,
        IRepository<Subsidiary> subsidiaryRepository,
        ILogService logService)
    {
        _transactionRepository = transactionRepository;
        _subsidiaryRepository = subsidiaryRepository;
        _logService = logService;
    }

    public async Task<Transaction> RecordTransactionAsync(
        string subsidiaryId, 
        string type, 
        double subtotal,
        double discount,
        double cgst,
        double sgst,
        double totalAmount,
        double amountPaidOrReceived,
        string description, 
        string referenceNumber = "", 
        string partnerName = "", 
        string documentUrl = "", 
        string processedByAgentId = "", 
        string status = "Completed")
    {
        var sub = await _subsidiaryRepository.GetByIdAsync(subsidiaryId);
        string subsidiaryName = "Common";

        if (sub != null)
        {
            subsidiaryName = sub.Name;

            // Apply financial changes to the subsidiary based on the transaction type
            if (type.Equals("Investment", StringComparison.OrdinalIgnoreCase))
            {
                sub.Balance += amountPaidOrReceived;
                sub.Investment += amountPaidOrReceived;
            }
            else if (type.Equals("Expense", StringComparison.OrdinalIgnoreCase) || type.Equals("Procurement", StringComparison.OrdinalIgnoreCase))
            {
                sub.Balance -= amountPaidOrReceived;
                sub.Expenses += amountPaidOrReceived;
                
                if (type.Equals("Procurement", StringComparison.OrdinalIgnoreCase))
                {
                    sub.Procurements += 1;
                }
            }
            else if (type.Equals("Profit", StringComparison.OrdinalIgnoreCase) || type.Equals("Sale", StringComparison.OrdinalIgnoreCase))
            {
                sub.Balance += amountPaidOrReceived;
                sub.Profits += amountPaidOrReceived;

                if (type.Equals("Sale", StringComparison.OrdinalIgnoreCase))
                {
                    sub.Sales += 1;
                }
            }
            await _subsidiaryRepository.SaveAsync(sub);
        }

        var transaction = new Transaction
        {
            Id = $"tx-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString().Substring(0, 4)}",
            SubsidiaryId = subsidiaryId,
            SubsidiaryName = subsidiaryName,
            Type = type,
            Subtotal = subtotal,
            Discount = discount,
            Cgst = cgst,
            Sgst = sgst,
            TotalAmount = totalAmount,
            AmountPaidOrReceived = amountPaidOrReceived,
            Description = description,
            Timestamp = DateTime.UtcNow.ToString("o"),
            ReferenceNumber = referenceNumber,
            PartnerName = partnerName,
            DocumentUrl = documentUrl,
            ProcessedByAgentId = processedByAgentId,
            Status = status
        };

        await _transactionRepository.SaveAsync(transaction);

        // Add to Live Activity Log
        string logMsg = $"LEDGER: Recorded {type} of ₹{amountPaidOrReceived:N2} for {subsidiaryName}. Desc: {description}";
        if (!string.IsNullOrEmpty(referenceNumber))
        {
            logMsg += $" (Ref: {referenceNumber})";
        }
        await _logService.AddLogAsync(logMsg, "info", subsidiaryName: subsidiaryName);

        return transaction;
    }

    public Task<IEnumerable<Transaction>> GetAllAsync()
    {
        return _transactionRepository.GetAllAsync();
    }

    public async Task ClearAllAsync()
    {
        var txs = await _transactionRepository.GetAllAsync();
        foreach (var tx in txs)
        {
            await _transactionRepository.DeleteAsync(tx.Id);
        }
    }
}
