using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;
using CoreApi.Application.Commands;
using coreapi.Infrastructure.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly ISimulationEngine _simulationEngine;
    private readonly DirectorCommandExecutor _directorCommandExecutor;
    private readonly ITransactionService _transactionService;
    private readonly IKernelProviderService _kernelProviderService;

    public SimulationController(
        ISimulationEngine simulationEngine,
        DirectorCommandExecutor directorCommandExecutor,
        ITransactionService transactionService,
        IKernelProviderService kernelProviderService)
    {
        _simulationEngine = simulationEngine;
        _directorCommandExecutor = directorCommandExecutor;
        _transactionService = transactionService;
        _kernelProviderService = kernelProviderService;
    }

    [HttpGet("state")]
    public async Task<ActionResult<SimulationState>> GetState()
    {
        var state = await _simulationEngine.GetStateAsync();
        return Ok(state);
    }

    [HttpPost("state")]
    public async Task<IActionResult> SaveState([FromBody] SimulationState state)
    {
        if (state == null)
        {
            return BadRequest("Invalid simulation state data");
        }
        await _simulationEngine.SaveStateAsync(state);
        return Ok(new { success = true });
    }

    [HttpPost("reset")]
    public async Task<ActionResult<SimulationState>> Reset()
    {
        var state = await _simulationEngine.ResetStateAsync();
        return Ok(state);
    }

    [HttpPost("tick")]
    public async Task<ActionResult<SimulationState>> Tick()
    {
        var state = await _simulationEngine.TickAsync();
        return Ok(state);
    }

    [HttpPost("command")]
    public async Task<ActionResult<DirectorCommandResponse>> ExecuteCommand([FromBody] DirectorCommandRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Command))
        {
            return BadRequest("Command cannot be empty");
        }
        var result = await _directorCommandExecutor.ExecuteAsync(req.Command);
        var state = await _simulationEngine.GetStateAsync();
        return Ok(new DirectorCommandResponse
        {
            Success = result.Success,
            Text = result.Message,
            State = state
        });
    }

    [HttpPost("transaction")]
    public async Task<ActionResult<SimulationState>> CreateTransaction([FromBody] CreateTransactionRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.SubsidiaryId) || string.IsNullOrWhiteSpace(req.Type))
        {
            return BadRequest("Invalid transaction data");
        }

        await _transactionService.RecordTransactionAsync(
            subsidiaryId: req.SubsidiaryId,
            type: req.Type,
            subtotal: req.Subtotal,
            discount: req.Discount,
            cgst: req.Cgst,
            sgst: req.Sgst,
            totalAmount: req.TotalAmount,
            amountPaidOrReceived: req.AmountPaidOrReceived,
            description: req.Description,
            referenceNumber: req.ReferenceNumber,
            partnerName: req.PartnerName,
            documentUrl: req.DocumentUrl,
            processedByAgentId: req.ProcessedByAgentId,
            status: req.Status
        );

        var state = await _simulationEngine.GetStateAsync();
        return Ok(state);
    }

    [HttpPost("extract-transaction")]
    public async Task<ActionResult<ExtractTransactionResponse>> ExtractTransactionData([FromBody] ExtractTransactionRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.FileData))
        {
            return BadRequest("File data cannot be empty");
        }

        var kernel = _kernelProviderService.CreateKernel("gemma4:latest", req.SubsidiaryId ?? "common");
        
        var prompt = @"Extract the transaction details from the provided file data.
Return the result in JSON format matching the following structure exactly (use default values if not found):
{
    ""subtotal"": 0.0,
    ""discount"": 0.0,
    ""cgst"": 0.0,
    ""sgst"": 0.0,
    ""totalAmount"": 0.0,
    ""referenceNumber"": """",
    ""partnerName"": """",
    ""description"": """"
}
File Data Context:
";
        var msgContentItems = new ChatMessageContentItemCollection();
        msgContentItems.Add(new TextContent(prompt));

        if (req.FileData.StartsWith("data:image/"))
        {
            var commaIndex = req.FileData.IndexOf(',');
            var mimeType = req.FileData.Substring(5, req.FileData.IndexOf(';') - 5);
            var base64Data = req.FileData.Substring(commaIndex + 1);
            var imageBytes = Convert.FromBase64String(base64Data);
            msgContentItems.Add(new ImageContent(new ReadOnlyMemory<byte>(imageBytes), mimeType));
        }
        else
        {
            var base64Data = req.FileData.Contains(",") ? req.FileData.Substring(req.FileData.IndexOf(",") + 1) : req.FileData;
            try
            {
                var textData = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(base64Data));
                msgContentItems.Add(new TextContent(textData));
            }
            catch
            {
                msgContentItems.Add(new TextContent($"[Could not parse text from base64]"));
            }
        }

        var chatHistory = new ChatHistory();
        chatHistory.Add(new ChatMessageContent(AuthorRole.User, msgContentItems));
        
        try
        {
            var chatService = kernel.GetRequiredService<IChatCompletionService>();
            var response = await chatService.GetChatMessageContentAsync(chatHistory);

            var responseText = response.Content ?? string.Empty;
            
            var jsonStart = responseText.IndexOf("{");
            var jsonEnd = responseText.LastIndexOf("}");
            
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                responseText = responseText.Substring(jsonStart, jsonEnd - jsonStart + 1);
            }

            var extractedData = System.Text.Json.JsonSerializer.Deserialize<ExtractTransactionResponse>(responseText, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return Ok(extractedData ?? new ExtractTransactionResponse());
        }
        catch
        {
            return Ok(new ExtractTransactionResponse());
        }
    }
}

public class ExtractTransactionRequest
{
    public string FileData { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string SubsidiaryId { get; set; } = string.Empty;
}

public class ExtractTransactionResponse
{
    public double Subtotal { get; set; }
    public double Discount { get; set; }
    public double Cgst { get; set; }
    public double Sgst { get; set; }
    public double TotalAmount { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string PartnerName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class DirectorCommandResponse
{
    public bool Success { get; set; }
    public string Text { get; set; } = string.Empty;
    public SimulationState? State { get; set; }
}
