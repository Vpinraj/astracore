using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/memory-book")]
public class MemoryBookController : ControllerBase
{
    private readonly IMemoryBookService _memoryBook;
    private readonly IAgentService      _agentService;

    public MemoryBookController(IMemoryBookService memoryBook, IAgentService agentService)
    {
        _memoryBook   = memoryBook;
        _agentService = agentService;
    }

    // GET /api/memory-book  — list all, or filter by ownerId / audience / category
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? ownerId  = null,
        [FromQuery] string? category = null)
    {
        IEnumerable<MemoryEntry> results;

        if (!string.IsNullOrWhiteSpace(ownerId))
            results = await _memoryBook.GetByOwnerAsync(ownerId, category);
        else
            results = await _memoryBook.GetAllAsync();

        // Apply category filter on GetAllAsync path
        if (!string.IsNullOrWhiteSpace(category) && string.IsNullOrWhiteSpace(ownerId))
        {
            results = System.Linq.Enumerable.Where(results, m =>
                m.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(results);
    }

    // GET /api/memory-book/snapshot/{agentId}  — formatted context for debugging / previewing
    [HttpGet("snapshot/{agentId}")]
    public async Task<IActionResult> GetSnapshot(string agentId)
    {
        var agent = await _agentService.GetByIdAsync(agentId);
        if (agent is null) return NotFound($"Agent {agentId} not found.");

        var snapshot = await _memoryBook.GetContextSnapshotAsync(agent);
        return Ok(new { agentId, snapshot });
    }

    // POST /api/memory-book  — create a new memory entry
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MemoryEntry entry)
    {
        if (string.IsNullOrWhiteSpace(entry.Key) || string.IsNullOrWhiteSpace(entry.Value))
            return BadRequest("Key and Value are required.");

        var created = await _memoryBook.AddAsync(entry);
        return CreatedAtAction(nameof(GetAll), new { ownerId = created.OwnerId }, created);
    }

    // PUT /api/memory-book/{id}  — update an existing entry
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateMemoryRequest req)
    {
        var updated = await _memoryBook.UpdateAsync(
            id, req.Key, req.Value, req.Category, req.Audience, req.Pinned);

        if (updated is null) return NotFound($"Memory entry {id} not found.");
        return Ok(updated);
    }

    // DELETE /api/memory-book/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _memoryBook.DeleteAsync(id);
        return Ok(new { deleted = true, id });
    }
}

public record UpdateMemoryRequest(
    string Key,
    string Value,
    string Category,
    string Audience,
    bool   Pinned
);
