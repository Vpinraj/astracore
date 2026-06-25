using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Implementations;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/simulation/roles")]
public class RoleBlueprintController : ControllerBase
{
    private readonly IRepository<RoleBlueprint> _roleBlueprintRepository;
    private readonly IAgentService _agentService;

    public RoleBlueprintController(
        IRepository<RoleBlueprint> roleBlueprintRepository,
        IAgentService agentService)
    {
        _roleBlueprintRepository = roleBlueprintRepository;
        _agentService = agentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleBlueprint>>> GetRoles()
    {
        // Check and prefill if empty
        if (_agentService is AgentService impl)
        {
            await impl.EnsureRolesSeededAsync();
        }

        var roles = await _roleBlueprintRepository.GetAllAsync();
        return Ok(roles.OrderBy(r => r.Name));
    }

    [HttpPost]
    public async Task<ActionResult<RoleBlueprint>> CreateOrUpdateRole([FromBody] RoleBlueprint role)
    {
        if (role == null || string.IsNullOrWhiteSpace(role.Name))
        {
            return BadRequest("Invalid role blueprint name");
        }

        if (string.IsNullOrWhiteSpace(role.Id))
        {
            role.Id = role.Name.Replace(" ", "-").ToLower();
        }

        await _roleBlueprintRepository.SaveAsync(role);
        return Ok(role);
    }
}
