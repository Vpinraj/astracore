using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/simulation")]
public class AgentController : ControllerBase
{
    private readonly IAgentService _agentService;

    public AgentController(IAgentService agentService)
    {
        _agentService = agentService;
    }

    [HttpPost("agent")]
    public async Task<ActionResult<Agent>> HireAgent([FromBody] HireAgentRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Role))
        {
            return BadRequest("Invalid agent name or role");
        }
        var agent = await _agentService.HireAgentAsync(req.Name, req.Role, req.SubsidiaryId, req.Instructions, req.ModelId, req.CustomOverrides, req.DeductionFee);
        return Ok(agent);
    }
}
