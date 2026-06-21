using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IRepository<AppConfig> _configRepository;
    private const string ConfigId = "app-config";

    public ConfigController(IRepository<AppConfig> configRepository)
    {
        _configRepository = configRepository;
    }

    [HttpGet]
    public async Task<ActionResult<AppConfig>> GetConfig()
    {
        var config = await _configRepository.GetByIdAsync(ConfigId);
        if (config == null)
        {
            config = new AppConfig();
            await _configRepository.SaveAsync(config);
        }
        return Ok(config);
    }

    [HttpPost]
    public async Task<IActionResult> SaveConfig([FromBody] AppConfig config)
    {
        if (config == null)
        {
            return BadRequest("Invalid configuration data");
        }
        config.Id = ConfigId;
        await _configRepository.SaveAsync(config);
        return Ok(config);
    }
}
