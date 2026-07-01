using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

/// <summary>
/// Manages the Memory Book — the persistent knowledge store shared between agents and the system.
/// 
/// Visibility rules (Option C: per-agent + global):
///   An agent can read a memory entry if ANY of the following is true:
///     • entry.OwnerId  == agent.Id              (private to this agent)
///     • entry.OwnerId  == "global"               (company-wide)
///     • entry.Audience == "global"               (broadcast to all)
///     • entry.Audience == agent.Role.ToLower()   (role-scoped)
///     • entry.Audience == agent.SubsidiaryId     (subsidiary-scoped)
///     • entry.Audience == agent.Id               (addressed to this agent specifically)
/// </summary>
public sealed class MemoryBookService : IMemoryBookService
{
    private const int MaxContextChars = 3_200; // ~800 tokens (4 chars/token estimate)

    private readonly IRepository<MemoryEntry> _repo;

    public MemoryBookService(IRepository<MemoryEntry> repo)
    {
        _repo = repo;
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    public async Task<IEnumerable<MemoryEntry>> GetMemoriesForAgentAsync(
        Agent agent,
        string? category = null,
        int limit = 100,
        CancellationToken ct = default)
    {
        var all = await _repo.GetAllAsync();

        var role = agent.Role?.ToLowerInvariant() ?? string.Empty;

        var visible = all.Where(m =>
            m.OwnerId  == agent.Id     ||
            m.OwnerId  == "global"     ||
            m.Audience == "global"     ||
            m.Audience.Equals(role, StringComparison.OrdinalIgnoreCase) ||
            m.Audience == agent.SubsidiaryId ||
            m.Audience == agent.Id
        );

        if (!string.IsNullOrWhiteSpace(category))
            visible = visible.Where(m => m.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

        return visible
            .OrderByDescending(m => m.Pinned)
            .ThenByDescending(m => m.AccessCount)
            .ThenByDescending(m => m.UpdatedAt)
            .Take(limit);
    }

    public async Task<IEnumerable<MemoryEntry>> GetByOwnerAsync(
        string ownerId,
        string? category = null,
        CancellationToken ct = default)
    {
        var all = await _repo.GetAllAsync();
        var filtered = all.Where(m => m.OwnerId == ownerId);
        if (!string.IsNullOrWhiteSpace(category))
            filtered = filtered.Where(m => m.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        return filtered.OrderByDescending(m => m.Pinned).ThenByDescending(m => m.UpdatedAt);
    }

    public async Task<IEnumerable<MemoryEntry>> GetAllAsync(CancellationToken ct = default)
    {
        var all = await _repo.GetAllAsync();
        return all.OrderByDescending(m => m.Pinned).ThenByDescending(m => m.UpdatedAt);
    }

    // ── Mutations ──────────────────────────────────────────────────────────────

    public async Task<MemoryEntry> AddAsync(MemoryEntry entry, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(entry.Id))
            entry.Id = $"mem-{Guid.NewGuid():N}";

        var now = DateTime.UtcNow.ToString("o");
        if (string.IsNullOrWhiteSpace(entry.CreatedAt)) entry.CreatedAt = now;
        entry.UpdatedAt = now;

        await _repo.SaveAsync(entry);
        return entry;
    }

    public async Task<MemoryEntry?> UpdateAsync(
        string id, string key, string value, string category,
        string audience, bool pinned, CancellationToken ct = default)
    {
        var entry = await _repo.GetByIdAsync(id);
        if (entry is null) return null;

        entry.Key      = key.Trim();
        entry.Value    = value.Trim();
        entry.Category = category;
        entry.Audience = audience;
        entry.Pinned   = pinned;
        entry.UpdatedAt = DateTime.UtcNow.ToString("o");

        await _repo.SaveAsync(entry);
        return entry;
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
        => await _repo.DeleteAsync(id);

    // ── LLM Context Builder ────────────────────────────────────────────────────

    public async Task<string> GetContextSnapshotAsync(Agent agent, CancellationToken ct = default)
    {
        var memories = (await GetMemoriesForAgentAsync(agent, limit: 200, ct: ct)).ToList();
        if (memories.Count == 0) return string.Empty;

        var sb     = new StringBuilder();
        var usedIds = new List<string>();

        sb.AppendLine("=== MEMORY BOOK ===");
        sb.AppendLine("(Your persistent knowledge store. Use this to inform your responses.)");
        sb.AppendLine();

        // Pinned first — always included
        var pinned = memories.Where(m => m.Pinned).ToList();
        var rest   = memories.Where(m => !m.Pinned).ToList();

        foreach (var m in pinned.Concat(rest))
        {
            var line = $"[{m.Category.ToUpperInvariant()}] {m.Key}: {m.Value}";
            if (sb.Length + line.Length > MaxContextChars) break;
            sb.AppendLine(line);
            usedIds.Add(m.Id);
        }

        sb.AppendLine("=== END MEMORY BOOK ===");

        // Bump access counts in the background (fire-and-forget OK here)
        _ = IncrementAccessCountAsync(usedIds, ct);

        return sb.ToString();
    }

    public async Task IncrementAccessCountAsync(IEnumerable<string> ids, CancellationToken ct = default)
    {
        foreach (var id in ids)
        {
            var entry = await _repo.GetByIdAsync(id);
            if (entry is null) continue;
            entry.AccessCount++;
            await _repo.SaveAsync(entry);
        }
    }
}
