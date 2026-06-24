namespace coreapi.Core.Entities;

public class ChatResponse
{
    public required string Content { get; set; }
    public string ModelUsed { get; set; } = "gemma4:latest";
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
}
