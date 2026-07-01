using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface IMemoryBookService
{
    /// <summary>
    /// Returns memories visible to the given agent (owned by agent + global + role-scoped + subsidiary-scoped).
    /// </summary>
    Task<IEnumerable<MemoryEntry>> GetMemoriesForAgentAsync(
        Agent agent,
        string? category = null,
        int limit = 100,
        CancellationToken ct = default);

    /// <summary>
    /// Returns all memories owned by the given ownerId ("global" for company-wide).
    /// </summary>
    Task<IEnumerable<MemoryEntry>> GetByOwnerAsync(
        string ownerId,
        string? category = null,
        CancellationToken ct = default);

    /// <summary>
    /// Returns ALL memories (for UI listing / admin view).
    /// </summary>
    Task<IEnumerable<MemoryEntry>> GetAllAsync(CancellationToken ct = default);

    /// <summary>
    /// Adds a new memory entry, generating an ID and timestamps.
    /// </summary>
    Task<MemoryEntry> AddAsync(MemoryEntry entry, CancellationToken ct = default);

    /// <summary>
    /// Updates key, value, category, audience, pinned of an existing entry.
    /// Returns null if not found.
    /// </summary>
    Task<MemoryEntry?> UpdateAsync(
        string id,
        string key,
        string value,
        string category,
        string audience,
        bool pinned,
        CancellationToken ct = default);

    /// <summary>
    /// Deletes a memory entry by ID.
    /// </summary>
    Task DeleteAsync(string id, CancellationToken ct = default);

    /// <summary>
    /// Builds a formatted, token-budgeted memory context block for injection into an LLM system prompt.
    /// Pinned entries are always included; remaining are sorted by AccessCount desc then newest first.
    /// </summary>
    Task<string> GetContextSnapshotAsync(Agent agent, CancellationToken ct = default);

    /// <summary>
    /// Increments the AccessCount on a list of memory IDs (called after context snapshot is built).
    /// </summary>
    Task IncrementAccessCountAsync(IEnumerable<string> ids, CancellationToken ct = default);
}
