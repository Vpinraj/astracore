using Microsoft.AspNetCore.Mvc;
using CoreApi.Application.Services.Interfaces;
using CoreApi.Application.DTOs;
using System.Threading.Tasks;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var leads = await _leadService.GetAllAsync();
        return Ok(leads);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest req)
    {
        var lead = await _leadService.CreateLeadAsync(
            req.SubsidiaryId,
            req.ContactName,
            req.CompanyName,
            req.Email,
            req.Phone,
            req.Source,
            req.Stage,
            req.EstimatedValue,
            req.AssignedToId,
            req.AssignedToName,
            req.Notes
        );
        return Ok(lead);
    }

    [HttpPatch("{id}/stage")]
    public async Task<IActionResult> UpdateStage(string id, [FromBody] UpdateLeadStageRequest req)
    {
        var lead = await _leadService.UpdateLeadStageAsync(id, req.Stage, req.FollowUpNote, req.CreatedBy);
        if (lead == null) return NotFound(new { message = $"Lead {id} not found." });
        return Ok(lead);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _leadService.DeleteAsync(id);
        return Ok(new { message = "Lead deleted." });
    }
}
