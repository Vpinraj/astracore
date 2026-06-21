using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/simulation")]
public class LogController : ControllerBase
{
    private readonly ILogService _logService;

    public LogController(ILogService logService)
    {
        _logService = logService;
    }

    [HttpPost("clear-logs")]
    public async Task<IActionResult> ClearLogs()
    {
        await _logService.ClearAllAsync();
        return Ok(new { success = true });
    }
}
