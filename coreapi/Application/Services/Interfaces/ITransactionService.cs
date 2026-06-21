using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface ITransactionService
{
    Task<Transaction> RecordTransactionAsync(
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
        string status = "Completed"
    );
    Task<IEnumerable<Transaction>> GetAllAsync();
    Task ClearAllAsync();
}
