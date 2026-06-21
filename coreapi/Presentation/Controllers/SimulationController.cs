using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;
using CoreApi.Application.Commands;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly ISimulationEngine _simulationEngine;
    private readonly DirectorCommandExecutor _directorCommandExecutor;
    private readonly ITransactionService _transactionService;

    public SimulationController(
        ISimulationEngine simulationEngine,
        DirectorCommandExecutor directorCommandExecutor,
        ITransactionService transactionService)
    {
        _simulationEngine = simulationEngine;
        _directorCommandExecutor = directorCommandExecutor;
        _transactionService = transactionService;
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
}

public class DirectorCommandResponse
{
    public bool Success { get; set; }
    public string Text { get; set; } = string.Empty;
    public SimulationState? State { get; set; }
}
