using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/simulation")]
public class SubsidiaryController : ControllerBase
{
    private readonly ISubsidiaryService _subsidiaryService;

    public SubsidiaryController(ISubsidiaryService subsidiaryService)
    {
        _subsidiaryService = subsidiaryService;
    }

    [HttpPost("subsidiary")]
    public async Task<ActionResult<Subsidiary>> CreateSubsidiary([FromBody] CreateSubsidiaryRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest("Invalid subsidiary name");
        }
        var sub = await _subsidiaryService.CreateSubsidiaryAsync(
            req.Name, 
            req.Industry, 
            req.Investment, 
            req.ColorTheme,
            req.LogoUrl,
            req.Website,
            req.Email,
            req.Phone,
            req.Description,
            req.Address,
            req.BankDetails
        );
        return Ok(sub);
    }

    [HttpPut("subsidiary/{id}")]
    public async Task<ActionResult<Subsidiary>> UpdateSubsidiary(string id, [FromBody] UpdateSubsidiaryRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest("Invalid subsidiary name");
        }
        var sub = await _subsidiaryService.UpdateSubsidiaryAsync(
            id,
            req.Name,
            req.Industry,
            req.ColorTheme,
            req.LogoUrl,
            req.Website,
            req.Email,
            req.Phone,
            req.Description,
            req.Address,
            req.BankDetails
        );
        return Ok(sub);
    }

    [HttpPost("allocate-funds")]
    public async Task<IActionResult> AllocateFunds([FromBody] AllocateFundsRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.SubsidiaryId) || req.Amount <= 0)
        {
            return BadRequest("Invalid allocation amount or subsidiary reference");
        }
        await _subsidiaryService.AllocateFundsAsync(req.SubsidiaryId, req.Amount);
        return Ok(new { success = true });
    }
}
