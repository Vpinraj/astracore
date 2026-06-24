namespace coreapi.Core.Entities;

public class ChatRequest
{
    public required string Prompt { get; set; }
    public string AssignedModelId { get; set; } = "gemma4:latest";
    public float Temperature { get; set; } = 0.7f;
    public int MaxTokens { get; set; } = 1000;
    public string? SubsidiaryId { get; set; }
}
