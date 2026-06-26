using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CoreApi.Core.Entities;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/agents")]
public class AgentController : ControllerBase
{
    private readonly IAgentService     _agentService;
    private readonly IHeartbeatService _heartbeatService;

    public AgentController(
        IAgentService     agentService,
        IHeartbeatService heartbeatService)
    {
        _agentService     = agentService;
        _heartbeatService = heartbeatService;
    }

    // ── Hire ──────────────────────────────────────────────────────────────────

    /// <summary>POST /api/agents — Hire a new AI agent.</summary>
    [HttpPost]
    [Route("/api/simulation/agent")]   // Keep backward-compat route
    public async Task<ActionResult<Agent>> HireAgent([FromBody] HireAgentRequest req)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Role))
            return BadRequest("Invalid agent name or role.");

        var agent = await _agentService.HireAgentAsync(
            req.Name, req.Role, req.SubsidiaryId, req.Instructions, req.ModelId, req.CustomOverrides);

        return Ok(agent);
    }

    // ── Heartbeat Configuration ────────────────────────────────────────────────

    /// <summary>
    /// PUT /api/agents/{id}/heartbeat
    /// Configure (or disable) an agent's autonomous heartbeat.
    /// </summary>
    [HttpPut("{id}/heartbeat")]
    public async Task<ActionResult<Agent>> SetHeartbeat(
        string id,
        [FromBody] SetHeartbeatRequest req)
    {
        if (req is null)
            return BadRequest("Request body is required.");

        if (req.IntervalMinutes < 1 || req.IntervalMinutes > 1440)
            return BadRequest("IntervalMinutes must be between 1 and 1440.");

        var updated = await _heartbeatService.ConfigureAsync(
            id,
            req.Enabled,
            req.IntervalMinutes,
            req.Instruction ?? string.Empty,
            HttpContext.RequestAborted);

        if (updated is null)
            return NotFound($"Agent '{id}' not found.");

        return Ok(updated);
    }

    // ── Heartbeat Logs ────────────────────────────────────────────────────────

    /// <summary>
    /// GET /api/agents/{id}/heartbeat-logs?limit=20
    /// Retrieve the most recent heartbeat execution logs for an agent.
    /// </summary>
    [HttpGet("{id}/heartbeat-logs")]
    public async Task<ActionResult<HeartbeatLog[]>> GetHeartbeatLogs(
        string id,
        [FromQuery] int limit = 20)
    {
        limit = Math.Clamp(limit, 1, 100);
        var logs = await _heartbeatService.GetLogsAsync(id, limit, HttpContext.RequestAborted);
        return Ok(logs.ToArray());
    }

    /// <summary>
    /// DELETE /api/agents/{id}/heartbeat-logs
    /// Clear all heartbeat logs for an agent.
    /// </summary>
    [HttpDelete("{id}/heartbeat-logs")]
    public async Task<IActionResult> ClearHeartbeatLogs(string id)
    {
        await _heartbeatService.ClearLogsAsync(id, HttpContext.RequestAborted);
        return Ok(new { success = true });
    }

    // ── Manual Trigger ────────────────────────────────────────────────────────

    /// <summary>
    /// POST /api/agents/{id}/heartbeat/trigger
    /// Immediately fire a heartbeat pulse for testing / manual invocation.
    /// The agent must have a heartbeat instruction configured.
    /// </summary>
    [HttpPost("{id}/heartbeat/trigger")]
    public async Task<ActionResult<HeartbeatLog>> TriggerHeartbeat(string id)
    {
        var agent = await _agentService.GetByIdAsync(id);
        if (agent is null)
            return NotFound($"Agent '{id}' not found.");

        if (agent.Status != "idle")
            return Conflict($"Agent '{agent.Name}' is currently {agent.Status}. Heartbeat can only be triggered when idle.");

        // Allow trigger even if heartbeat is not enabled (useful for testing)
        if (string.IsNullOrWhiteSpace(agent.HeartbeatInstruction))
            agent.HeartbeatInstruction = "Perform a quick self-status check and report your current operational readiness.";

        var log = await _heartbeatService.ExecutePulseAsync(agent, HttpContext.RequestAborted);
        return Ok(log);
    }

    // ── Full Agent Update ──────────────────────────────────────────────────

    /// <summary>
    /// PATCH /api/agents/{id}
    /// Update any combination of mutable agent fields.
    /// </summary>
    [HttpPatch("{id}")]
    public async Task<ActionResult<Agent>> UpdateAgent(
        string id,
        [FromBody] UpdateAgentRequest req)
    {
        if (req is null)
            return BadRequest("Request body is required.");

        var updated = await _agentService.UpdateAgentAsync(id, req, HttpContext.RequestAborted);
        if (updated is null)
            return NotFound($"Agent '{id}' not found.");

        return Ok(updated);
    }

    // ── Seed Heartbeat Instructions ────────────────────────────────────────

    /// <summary>
    /// POST /api/agents/seed-heartbeat-instructions
    /// Backfills HeartbeatInstruction for all agents that currently have none.
    /// Safe to call multiple times — only updates agents with an empty instruction.
    /// </summary>
    [HttpPost("seed-heartbeat-instructions")]
    public async Task<IActionResult> SeedHeartbeatInstructions()
    {
        await _agentService.SeedHeartbeatInstructionsAsync(HttpContext.RequestAborted);
        return Ok(new { success = true, message = "Heartbeat instructions seeded for agents with empty instructions." });
    }
}
